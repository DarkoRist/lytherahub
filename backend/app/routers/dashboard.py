"""Dashboard router — briefing, stats, command bar, activity feed."""

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.models.database import (
    ActivityLog,
    Alert,
    CalendarEvent,
    Client,
    Email,
    Invoice,
    Task,
    User,
    get_db,
)
from app.models.schemas import (
    ActivityLogResponse,
    CommandBarRequest,
    CommandBarResponse,
    DashboardStatsResponse,
)
from app.services import ai_agent

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/stats", response_model=DashboardStatsResponse)
async def get_dashboard_stats(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get dashboard statistics for the current user."""
    uid = user.id
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0, tzinfo=None)
    today_end = today_start + timedelta(days=1)

    unread = (await db.execute(
        select(func.count()).select_from(
            select(Email).where(Email.user_id == uid, Email.is_read == False).subquery()  # noqa: E712
        )
    )).scalar() or 0

    meetings = (await db.execute(
        select(func.count()).select_from(
            select(CalendarEvent).where(
                CalendarEvent.user_id == uid,
                CalendarEvent.start_time >= today_start,
                CalendarEvent.start_time < today_end,
            ).subquery()
        )
    )).scalar() or 0

    outstanding = (await db.execute(
        select(func.coalesce(func.sum(Invoice.amount), 0)).where(
            Invoice.user_id == uid,
            Invoice.status.in_(["sent", "overdue"]),
        )
    )).scalar() or 0

    overdue = (await db.execute(
        select(func.count()).select_from(
            select(Invoice).where(Invoice.user_id == uid, Invoice.status == "overdue").subquery()
        )
    )).scalar() or 0

    clients = (await db.execute(
        select(func.count()).select_from(
            select(Client).where(
                Client.user_id == uid,
                Client.pipeline_stage.notin_(["lost"]),
            ).subquery()
        )
    )).scalar() or 0

    tasks = (await db.execute(
        select(func.count()).select_from(
            select(Task).where(Task.user_id == uid, Task.status != "done").subquery()
        )
    )).scalar() or 0

    alerts = (await db.execute(
        select(func.count()).select_from(
            select(Alert).where(Alert.user_id == uid, Alert.is_read == False).subquery()  # noqa: E712
        )
    )).scalar() or 0

    return DashboardStatsResponse(
        unread_emails=unread,
        today_meetings=meetings,
        outstanding_invoices=float(outstanding),
        overdue_invoices=overdue,
        active_clients=clients,
        pending_tasks=tasks,
        unread_alerts=alerts,
    )


@router.get("/briefing")
async def get_morning_briefing(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Generate the AI morning briefing."""
    uid = user.id

    email_count = (await db.execute(
        select(func.count()).select_from(
            select(Email).where(Email.user_id == uid, Email.is_read == False).subquery()  # noqa: E712
        )
    )).scalar() or 0

    urgent_count = (await db.execute(
        select(func.count()).select_from(
            select(Email).where(Email.user_id == uid, Email.category == "urgent").subquery()
        )
    )).scalar() or 0

    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0, tzinfo=None)
    today_end = today_start + timedelta(days=1)
    meetings = (await db.execute(
        select(func.count()).select_from(
            select(CalendarEvent).where(
                CalendarEvent.user_id == uid,
                CalendarEvent.start_time >= today_start,
                CalendarEvent.start_time < today_end,
            ).subquery()
        )
    )).scalar() or 0

    overdue_total = (await db.execute(
        select(func.coalesce(func.sum(Invoice.amount), 0)).where(
            Invoice.user_id == uid, Invoice.status == "overdue"
        )
    )).scalar() or 0

    pending_tasks = (await db.execute(
        select(func.count()).select_from(
            select(Task).where(Task.user_id == uid, Task.status != "done").subquery()
        )
    )).scalar() or 0

    briefing = await ai_agent.generate_daily_briefing(
        email_count=email_count,
        urgent_count=urgent_count,
        today_meetings=meetings,
        overdue_invoices=float(overdue_total),
        pending_tasks=pending_tasks,
        user_name=user.name.split()[0] if user.name else "there",
    )
    return briefing


@router.post("/command", response_model=CommandBarResponse)
async def process_command(
    body: CommandBarRequest,
    user: User = Depends(get_current_user),
):
    """Process a natural language command."""
    result = await ai_agent.parse_command(body.command)
    return CommandBarResponse(
        action=result.get("action", "unknown"),
        message=result.get("message", ""),
        data=result.get("params"),
        suggestions=result.get("suggestions"),
    )


@router.get("/activity")
async def get_activity_feed(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    limit: int = 20,
):
    """Get recent activity feed."""
    result = await db.execute(
        select(ActivityLog)
        .where(ActivityLog.user_id == user.id)
        .order_by(ActivityLog.created_at.desc())
        .limit(limit)
    )
    logs = result.scalars().all()
    return [ActivityLogResponse.model_validate(log) for log in logs]
