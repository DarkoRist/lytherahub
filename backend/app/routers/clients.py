"""Client/CRM router — pipeline management, AI enrichment, and stale-lead detection."""

import logging
import math
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.main import limiter
from app.models.database import Client, User, get_db
from app.models.schemas import (
    ClientCreate,
    ClientResponse,
    ClientUpdate,
    PaginatedResponse,
    PipelineResponse,
    PipelineStageUpdate,
)
from app.services import ai_agent

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/clients", tags=["clients"])

# Valid pipeline stages in order
PIPELINE_STAGES = ["lead", "contacted", "proposal", "negotiation", "won", "lost"]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


async def _get_client_or_404(
    client_id: str, user_id: str, db: AsyncSession
) -> Client:
    """Fetch a client, raising 404 if not found or not owned."""
    result = await db.execute(
        select(Client).where(
            Client.id == client_id,
            Client.user_id == user_id,
        )
    )
    client = result.scalar_one_or_none()
    if client is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found",
        )
    return client


# ---------------------------------------------------------------------------
# GET /api/clients/pipeline — pipeline view data (before /{id} routes)
# ---------------------------------------------------------------------------


@router.get("/pipeline", response_model=list[PipelineResponse])
async def get_pipeline(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return clients grouped by pipeline stage with totals."""
    pipeline: list[PipelineResponse] = []

    for stage in PIPELINE_STAGES:
        result = await db.execute(
            select(Client)
            .where(Client.user_id == user.id, Client.pipeline_stage == stage)
            .order_by(Client.updated_at.desc())
        )
        clients = result.scalars().all()
        total_value = sum(c.deal_value or 0.0 for c in clients)

        pipeline.append(
            PipelineResponse(
                stage=stage,
                clients=[ClientResponse.model_validate(c) for c in clients],
                count=len(clients),
                total_value=total_value,
            )
        )

    return pipeline


# ---------------------------------------------------------------------------
# GET /api/clients/stale — stale leads (no contact in 14+ days)
# ---------------------------------------------------------------------------


@router.get("/stale", response_model=list[ClientResponse])
async def get_stale_leads(
    days: int = Query(14, ge=1, le=90, description="Days since last contact"),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return clients who have not been contacted within the specified window."""
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)

    result = await db.execute(
        select(Client)
        .where(
            Client.user_id == user.id,
            Client.pipeline_stage.notin_(["won", "lost"]),
            or_(
                Client.last_contacted.is_(None),
                Client.last_contacted < cutoff,
            ),
        )
        .order_by(Client.last_contacted.asc().nullsfirst())
    )
    clients = result.scalars().all()
    return [ClientResponse.model_validate(c) for c in clients]


# ---------------------------------------------------------------------------
# GET /api/clients — list clients (filterable)
# ---------------------------------------------------------------------------


@router.get("", response_model=PaginatedResponse)
@limiter.limit("100/minute")
async def list_clients(
    request: Request,
    stage: str | None = Query(None, description="Filter by pipeline stage"),
    industry: str | None = Query(None, description="Filter by industry"),
    search: str | None = Query(None, description="Search company name, contact name, or email"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List clients with optional filters for stage, industry, and free-text search."""
    query = select(Client).where(Client.user_id == user.id)

    if stage:
        if stage not in PIPELINE_STAGES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid stage. Must be one of: {', '.join(PIPELINE_STAGES)}",
            )
        query = query.where(Client.pipeline_stage == stage)

    if industry:
        query = query.where(Client.industry.ilike(f"%{industry}%"))

    if search:
        pattern = f"%{search}%"
        query = query.where(
            or_(
                Client.company_name.ilike(pattern),
                Client.contact_name.ilike(pattern),
                Client.email.ilike(pattern),
            )
        )

    # Count
    count_result = await db.execute(
        select(func.count()).select_from(query.subquery())
    )
    total = count_result.scalar() or 0

    # Paginate — most recently updated first
    query = query.order_by(Client.updated_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)

    result = await db.execute(query)
    clients = result.scalars().all()

    return PaginatedResponse(
        items=[ClientResponse.model_validate(c) for c in clients],
        total=total,
        page=page,
        page_size=page_size,
        pages=max(1, math.ceil(total / page_size)),
    )


# ---------------------------------------------------------------------------
# POST /api/clients — create client
# ---------------------------------------------------------------------------


@router.post("", response_model=ClientResponse, status_code=status.HTTP_201_CREATED)
async def create_client(
    payload: ClientCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new client in the CRM."""
    if payload.pipeline_stage not in PIPELINE_STAGES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid pipeline_stage. Must be one of: {', '.join(PIPELINE_STAGES)}",
        )

    client = Client(
        user_id=user.id,
        company_name=payload.company_name,
        contact_name=payload.contact_name,
        email=payload.email,
        phone=payload.phone,
        website=payload.website,
        industry=payload.industry,
        location=payload.location,
        pipeline_stage=payload.pipeline_stage,
        deal_value=payload.deal_value,
        notes=payload.notes,
    )
    db.add(client)
    await db.flush()
    return client


# ---------------------------------------------------------------------------
# GET /api/clients/{id} — client detail
# ---------------------------------------------------------------------------


@router.get("/{client_id}", response_model=ClientResponse)
async def get_client(
    client_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve a single client by ID."""
    client = await _get_client_or_404(client_id, user.id, db)
    return client


# ---------------------------------------------------------------------------
# PUT /api/clients/{id} — update client
# ---------------------------------------------------------------------------


@router.put("/{client_id}", response_model=ClientResponse)
async def update_client(
    client_id: str,
    payload: ClientUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a client's mutable fields."""
    client = await _get_client_or_404(client_id, user.id, db)

    update_data = payload.model_dump(exclude_unset=True)

    # Validate pipeline_stage if being changed
    if "pipeline_stage" in update_data and update_data["pipeline_stage"] not in PIPELINE_STAGES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid pipeline_stage. Must be one of: {', '.join(PIPELINE_STAGES)}",
        )

    for field, value in update_data.items():
        setattr(client, field, value)

    return client


# ---------------------------------------------------------------------------
# DELETE /api/clients/{id}
# ---------------------------------------------------------------------------


@router.delete("/{client_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_client(
    client_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a client and all related records (invoices, tasks via cascade)."""
    client = await _get_client_or_404(client_id, user.id, db)
    await db.delete(client)


# ---------------------------------------------------------------------------
# POST /api/clients/{id}/enrich — AI enrichment
# ---------------------------------------------------------------------------


@router.post("/{client_id}/enrich", response_model=ClientResponse)
async def enrich_client(
    client_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Trigger AI enrichment for a client — fills in industry, size, description."""
    client = await _get_client_or_404(client_id, user.id, db)

    enrichment = await ai_agent.enrich_client(
        company_name=client.company_name,
        website=client.website,
    )
    client.enrichment_data = enrichment

    # Auto-fill industry if empty and enrichment returned it
    if not client.industry and enrichment.get("industry"):
        client.industry = enrichment["industry"]

    return client


# ---------------------------------------------------------------------------
# PUT /api/clients/{id}/stage — move client in pipeline
# ---------------------------------------------------------------------------


@router.put("/{client_id}/stage", response_model=ClientResponse)
async def update_client_stage(
    client_id: str,
    payload: PipelineStageUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Move a client to a different pipeline stage."""
    if payload.pipeline_stage not in PIPELINE_STAGES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid pipeline_stage. Must be one of: {', '.join(PIPELINE_STAGES)}",
        )

    client = await _get_client_or_404(client_id, user.id, db)
    client.pipeline_stage = payload.pipeline_stage

    # Update last_contacted timestamp when stage changes
    client.last_contacted = datetime.now(timezone.utc)

    return client
