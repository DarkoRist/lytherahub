"""Reports router — list, generate, view reports."""

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.models.database import Report, User, get_db
from app.models.schemas import ReportResponse
from app.services import ai_agent

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.get("", response_model=list[ReportResponse])
async def list_reports(
    report_type: str | None = None,
    limit: int = 20,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List past reports."""
    query = select(Report).where(Report.user_id == user.id)
    if report_type:
        query = query.where(Report.type == report_type)
    query = query.order_by(Report.created_at.desc()).limit(limit)
    result = await db.execute(query)
    return [ReportResponse.model_validate(r) for r in result.scalars().all()]


@router.get("/briefing")
async def get_todays_briefing(
    user: User = Depends(get_current_user),
):
    """Get today's AI-generated morning briefing."""
    briefing = await ai_agent.generate_daily_briefing(
        email_count=12, urgent_count=3, today_meetings=2,
        overdue_invoices=4200.0, pending_tasks=5,
        user_name=user.name.split()[0] if user.name else "there",
    )
    return briefing


@router.post("/generate/{report_type}")
async def generate_report(
    report_type: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Generate a report on demand (daily, weekly, monthly)."""
    now = datetime.now(timezone.utc)

    if report_type == "daily":
        data = await ai_agent.generate_daily_briefing(
            email_count=12, urgent_count=3, today_meetings=2,
            overdue_invoices=4200.0, pending_tasks=5,
            user_name=user.name.split()[0] if user.name else "there",
        )
        period_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        period_end = period_start + timedelta(days=1)
    elif report_type == "weekly":
        data = await ai_agent.generate_weekly_report({"emails_handled": 45, "revenue": 8500, "invoices_sent": 3})
        period_start = now - timedelta(days=now.weekday())
        period_end = period_start + timedelta(days=7)
    elif report_type == "monthly":
        data = await ai_agent.generate_monthly_report({"revenue": 32000, "new_clients": 4, "pipeline_value": 45000, "emails_handled": 180, "meetings": 24})
        period_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        period_end = (period_start + timedelta(days=32)).replace(day=1)
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid report type. Use: daily, weekly, monthly")

    report = Report(
        user_id=user.id,
        type=report_type,
        title=data.get("title", f"{report_type.capitalize()} Report"),
        content=data,
        period_start=period_start,
        period_end=period_end,
    )
    db.add(report)
    await db.flush()

    return ReportResponse.model_validate(report)


@router.get("/{report_id}", response_model=ReportResponse)
async def get_report(
    report_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """View a specific report."""
    result = await db.execute(
        select(Report).where(Report.id == report_id, Report.user_id == user.id)
    )
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
    return report
