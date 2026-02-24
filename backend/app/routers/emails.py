"""Email router — smart inbox with AI classification, summaries, and drafts."""

import logging
import math
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.main import limiter
from app.models.database import Email, User, get_db
from app.models.schemas import (
    EmailClassifyResponse,
    EmailDraftReplyResponse,
    EmailResponse,
    EmailStatsResponse,
    PaginatedResponse,
)
from app.services import ai_agent

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/emails", tags=["emails"])


# ---------------------------------------------------------------------------
# GET /api/emails/stats — inbox statistics (placed before /{id} routes)
# ---------------------------------------------------------------------------


@router.get("/stats", response_model=EmailStatsResponse)
async def get_email_stats(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return inbox statistics for the current user."""
    base = select(Email).where(Email.user_id == user.id)

    total_result = await db.execute(
        select(func.count()).select_from(base.subquery())
    )
    total = total_result.scalar() or 0

    unread_result = await db.execute(
        select(func.count()).select_from(
            base.where(Email.is_read == False).subquery()  # noqa: E712
        )
    )
    unread = unread_result.scalar() or 0

    needs_reply_result = await db.execute(
        select(func.count()).select_from(
            base.where(Email.needs_reply == True).subquery()  # noqa: E712
        )
    )
    needs_reply = needs_reply_result.scalar() or 0

    # Counts grouped by category
    cat_query = (
        select(Email.category, func.count())
        .where(Email.user_id == user.id)
        .where(Email.category.isnot(None))
        .group_by(Email.category)
    )
    cat_result = await db.execute(cat_query)
    by_category: dict[str, int] = {row[0]: row[1] for row in cat_result.all()}

    return EmailStatsResponse(
        total=total,
        unread=unread,
        needs_reply=needs_reply,
        by_category=by_category,
    )


# ---------------------------------------------------------------------------
# GET /api/emails — paginated email list, filterable by category
# ---------------------------------------------------------------------------


@router.get("", response_model=PaginatedResponse)
@limiter.limit("100/minute")
async def list_emails(
    request: Request,
    category: str | None = Query(None, description="Filter by category"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List the authenticated user's emails with optional category filter."""
    query = select(Email).where(Email.user_id == user.id)

    if category:
        query = query.where(Email.category == category)

    # Total count for pagination
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Paginate — newest first
    query = query.order_by(Email.received_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)

    result = await db.execute(query)
    emails = result.scalars().all()

    return PaginatedResponse(
        items=[EmailResponse.model_validate(e) for e in emails],
        total=total,
        page=page,
        page_size=page_size,
        pages=max(1, math.ceil(total / page_size)),
    )


# ---------------------------------------------------------------------------
# GET /api/emails/{id} — single email with AI summary
# ---------------------------------------------------------------------------


@router.get("/{email_id}", response_model=EmailResponse)
async def get_email(
    email_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve a single email by ID. Marks it as read and generates an AI summary if missing."""
    result = await db.execute(
        select(Email).where(Email.id == email_id, Email.user_id == user.id)
    )
    email = result.scalar_one_or_none()

    if email is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Email not found",
        )

    # Mark as read on open
    if not email.is_read:
        email.is_read = True

    # Auto-generate summary if missing
    if not email.ai_summary and email.body_preview:
        try:
            email.ai_summary = await ai_agent.summarize_email(
                email.subject, email.body_preview
            )
        except Exception as exc:
            logger.warning("AI summarize failed for email %s: %s", email_id, exc)

    return email


# ---------------------------------------------------------------------------
# POST /api/emails/{id}/classify — AI classification
# ---------------------------------------------------------------------------


@router.post("/{email_id}/classify", response_model=EmailClassifyResponse)
async def classify_email(
    email_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Trigger AI classification on an email."""
    result = await db.execute(
        select(Email).where(Email.id == email_id, Email.user_id == user.id)
    )
    email = result.scalar_one_or_none()

    if email is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Email not found",
        )

    classification = await ai_agent.classify_email(
        subject=email.subject,
        body=email.body_preview or email.snippet or "",
        from_addr=email.from_addr,
    )

    email.category = classification["category"]
    email.needs_reply = classification.get("needs_reply", False)

    # Also generate a summary while we are at it
    if not email.ai_summary:
        try:
            email.ai_summary = await ai_agent.summarize_email(
                email.subject, email.body_preview or email.snippet or ""
            )
        except Exception as exc:
            logger.warning("AI summarize failed for email %s: %s", email_id, exc)
            email.ai_summary = f"Email about: {email.subject[:80]}"

    return EmailClassifyResponse(
        id=email.id,
        category=email.category,
        ai_summary=email.ai_summary or "",
        needs_reply=email.needs_reply,
    )


# ---------------------------------------------------------------------------
# POST /api/emails/{id}/summarize — AI summary
# ---------------------------------------------------------------------------


@router.post("/{email_id}/summarize")
async def summarize_email(
    email_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Generate or regenerate an AI summary for an email."""
    result = await db.execute(
        select(Email).where(Email.id == email_id, Email.user_id == user.id)
    )
    email = result.scalar_one_or_none()

    if email is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Email not found",
        )

    summary = await ai_agent.summarize_email(
        subject=email.subject,
        body=email.body_preview or email.snippet or "",
    )
    email.ai_summary = summary

    return {"id": email.id, "ai_summary": summary}


# ---------------------------------------------------------------------------
# POST /api/emails/{id}/draft-reply — AI reply draft
# ---------------------------------------------------------------------------


@router.post("/{email_id}/draft-reply", response_model=EmailDraftReplyResponse)
async def draft_reply(
    email_id: str,
    tone: str = Query("professional", description="Reply tone: professional, friendly, formal, concise"),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Generate an AI-drafted reply for an email."""
    result = await db.execute(
        select(Email).where(Email.id == email_id, Email.user_id == user.id)
    )
    email = result.scalar_one_or_none()

    if email is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Email not found",
        )

    draft = await ai_agent.draft_reply(
        subject=email.subject,
        body=email.body_preview or email.snippet or "",
        from_addr=email.from_addr,
        tone=tone,
    )
    email.reply_draft = draft

    return EmailDraftReplyResponse(
        id=email.id,
        reply_draft=draft,
        tone=tone,
    )


# ---------------------------------------------------------------------------
# POST /api/emails/sync — sync latest emails from Gmail
# ---------------------------------------------------------------------------


@router.post("/sync")
async def sync_emails(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Sync the latest emails from Gmail into the local database.

    In demo mode or when Gmail is not configured, returns a message
    indicating the sync is unavailable.
    """
    from app.config import settings

    if settings.DEMO_MODE or not user.google_token:
        return {
            "message": "Email sync unavailable in demo mode or without Google OAuth.",
            "synced": 0,
        }

    try:
        from app.services import gmail_service

        new_emails = await gmail_service.sync_inbox(user)
        synced_count = 0

        for raw in new_emails:
            # Avoid duplicates by gmail_id
            existing = await db.execute(
                select(Email).where(
                    Email.gmail_id == raw["gmail_id"],
                    Email.user_id == user.id,
                )
            )
            if existing.scalar_one_or_none() is not None:
                continue

            email = Email(
                user_id=user.id,
                gmail_id=raw.get("gmail_id"),
                from_addr=raw["from_addr"],
                to_addr=raw["to_addr"],
                subject=raw["subject"],
                snippet=raw.get("snippet"),
                body_preview=raw.get("body_preview"),
                received_at=raw.get("received_at", datetime.now(timezone.utc)),
            )
            db.add(email)
            synced_count += 1

        return {"message": f"Synced {synced_count} new emails.", "synced": synced_count}

    except Exception as exc:
        logger.error("Gmail sync failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Gmail sync failed: {exc}",
        )
