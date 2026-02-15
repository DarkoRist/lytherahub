"""AI report generation — daily, weekly, and monthly business reports.

Gathers metrics from the database and uses ai_agent to produce natural-language
report content. Stores results in the ``reports`` table for later retrieval.
"""

import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database import (
    CalendarEvent,
    Client,
    Email,
    Invoice,
    Report,
    Task,
)
from app.services import ai_agent

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Metric helpers
# ---------------------------------------------------------------------------


async def _email_metrics(db: AsyncSession, user_id: str, start: datetime, end: datetime) -> dict:
    """Gather email metrics for a date range."""
    base = and_(Email.user_id == user_id, Email.received_at >= start, Email.received_at < end)
    total_q = select(func.count()).select_from(Email).where(base)
    unread_q = select(func.count()).select_from(Email).where(and_(base, Email.is_read == False))  # noqa: E712
    needs_reply_q = select(func.count()).select_from(Email).where(and_(base, Email.needs_reply == True))  # noqa: E712

    total = (await db.execute(total_q)).scalar() or 0
    unread = (await db.execute(unread_q)).scalar() or 0
    needs_reply = (await db.execute(needs_reply_q)).scalar() or 0

    return {"total": total, "unread": unread, "needs_reply": needs_reply}


async def _invoice_metrics(db: AsyncSession, user_id: str, start: datetime, end: datetime) -> dict:
    """Gather invoice metrics for a date range."""
    base = and_(Invoice.user_id == user_id, Invoice.issued_date >= start, Invoice.issued_date < end)

    total_q = select(func.count()).select_from(Invoice).where(base)
    revenue_q = select(func.coalesce(func.sum(Invoice.amount), 0.0)).select_from(Invoice).where(
        and_(base, Invoice.status == "paid")
    )
    overdue_q = select(func.count()).select_from(Invoice).where(and_(base, Invoice.status == "overdue"))
    outstanding_q = select(func.coalesce(func.sum(Invoice.amount), 0.0)).select_from(Invoice).where(
        and_(base, Invoice.status.in_(["sent", "overdue"]))
    )

    total = (await db.execute(total_q)).scalar() or 0
    revenue = float((await db.execute(revenue_q)).scalar() or 0)
    overdue = (await db.execute(overdue_q)).scalar() or 0
    outstanding = float((await db.execute(outstanding_q)).scalar() or 0)

    return {
        "total": total,
        "revenue": revenue,
        "overdue_count": overdue,
        "outstanding": outstanding,
    }


async def _client_metrics(db: AsyncSession, user_id: str, start: datetime, end: datetime) -> dict:
    """Gather client pipeline metrics."""
    new_q = select(func.count()).select_from(Client).where(
        and_(Client.user_id == user_id, Client.created_at >= start, Client.created_at < end)
    )
    active_q = select(func.count()).select_from(Client).where(
        and_(Client.user_id == user_id, Client.pipeline_stage.in_(["lead", "contacted", "proposal", "negotiation"]))
    )
    pipeline_value_q = select(func.coalesce(func.sum(Client.deal_value), 0.0)).select_from(Client).where(
        and_(Client.user_id == user_id, Client.pipeline_stage.in_(["lead", "contacted", "proposal", "negotiation"]))
    )

    new_clients = (await db.execute(new_q)).scalar() or 0
    active = (await db.execute(active_q)).scalar() or 0
    pipeline_value = float((await db.execute(pipeline_value_q)).scalar() or 0)

    return {"new_clients": new_clients, "active": active, "pipeline_value": pipeline_value}


async def _meeting_metrics(db: AsyncSession, user_id: str, start: datetime, end: datetime) -> dict:
    """Gather meeting metrics for a date range."""
    count_q = select(func.count()).select_from(CalendarEvent).where(
        and_(
            CalendarEvent.user_id == user_id,
            CalendarEvent.start_time >= start,
            CalendarEvent.start_time < end,
            CalendarEvent.is_meeting == True,  # noqa: E712
        )
    )
    meetings = (await db.execute(count_q)).scalar() or 0
    return {"meetings": meetings}


async def _task_metrics(db: AsyncSession, user_id: str, start: datetime, end: datetime) -> dict:
    """Gather task metrics for a date range."""
    completed_q = select(func.count()).select_from(Task).where(
        and_(Task.user_id == user_id, Task.status == "done", Task.updated_at >= start, Task.updated_at < end)
    )
    pending_q = select(func.count()).select_from(Task).where(
        and_(Task.user_id == user_id, Task.status.in_(["todo", "in_progress"]))
    )
    completed = (await db.execute(completed_q)).scalar() or 0
    pending = (await db.execute(pending_q)).scalar() or 0
    return {"completed": completed, "pending": pending}


# ---------------------------------------------------------------------------
# Report generation
# ---------------------------------------------------------------------------


async def generate_daily_report(db: AsyncSession, user_id: str) -> Report:
    """Generate a daily business report for the current user.

    Gathers yesterday's metrics, passes them through the AI agent, and
    persists the report.
    """
    now = datetime.now(timezone.utc)
    start = (now - timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
    end = now.replace(hour=0, minute=0, second=0, microsecond=0)

    email_m = await _email_metrics(db, user_id, start, end)
    invoice_m = await _invoice_metrics(db, user_id, start, end)
    client_m = await _client_metrics(db, user_id, start, end)
    meeting_m = await _meeting_metrics(db, user_id, start, end)
    task_m = await _task_metrics(db, user_id, start, end)

    # Use ai_agent for a nice briefing
    briefing = await ai_agent.generate_daily_briefing(
        email_count=email_m["total"],
        urgent_count=email_m["needs_reply"],
        today_meetings=meeting_m["meetings"],
        overdue_invoices=invoice_m["outstanding"],
        pending_tasks=task_m["pending"],
    )

    content = {
        "briefing": briefing,
        "metrics": {
            "emails": email_m,
            "invoices": invoice_m,
            "clients": client_m,
            "meetings": meeting_m,
            "tasks": task_m,
        },
    }

    report = Report(
        user_id=user_id,
        type="daily",
        title=f"Daily Report — {start.strftime('%d %b %Y')}",
        content=content,
        period_start=start,
        period_end=end,
    )
    db.add(report)
    await db.flush()
    return report


async def generate_weekly_report(db: AsyncSession, user_id: str) -> Report:
    """Generate a weekly business report covering the last 7 days."""
    now = datetime.now(timezone.utc)
    end = now.replace(hour=0, minute=0, second=0, microsecond=0)
    start = end - timedelta(days=7)

    email_m = await _email_metrics(db, user_id, start, end)
    invoice_m = await _invoice_metrics(db, user_id, start, end)
    client_m = await _client_metrics(db, user_id, start, end)
    meeting_m = await _meeting_metrics(db, user_id, start, end)
    task_m = await _task_metrics(db, user_id, start, end)

    week_data = {
        "emails_handled": email_m["total"],
        "revenue": invoice_m["revenue"],
        "invoices_sent": invoice_m["total"],
        "new_clients": client_m["new_clients"],
        "pipeline_value": client_m["pipeline_value"],
        "meetings": meeting_m["meetings"],
        "tasks_completed": task_m["completed"],
    }

    ai_report = await ai_agent.generate_weekly_report(week_data)

    content = {
        "ai_report": ai_report,
        "metrics": {
            "emails": email_m,
            "invoices": invoice_m,
            "clients": client_m,
            "meetings": meeting_m,
            "tasks": task_m,
        },
    }

    report = Report(
        user_id=user_id,
        type="weekly",
        title=f"Weekly Report — {start.strftime('%d %b')} to {end.strftime('%d %b %Y')}",
        content=content,
        period_start=start,
        period_end=end,
    )
    db.add(report)
    await db.flush()
    return report


async def generate_monthly_report(db: AsyncSession, user_id: str) -> Report:
    """Generate a monthly business health report for the last 30 days."""
    now = datetime.now(timezone.utc)
    end = now.replace(hour=0, minute=0, second=0, microsecond=0)
    start = end - timedelta(days=30)

    email_m = await _email_metrics(db, user_id, start, end)
    invoice_m = await _invoice_metrics(db, user_id, start, end)
    client_m = await _client_metrics(db, user_id, start, end)
    meeting_m = await _meeting_metrics(db, user_id, start, end)
    task_m = await _task_metrics(db, user_id, start, end)

    month_data = {
        "emails_handled": email_m["total"],
        "revenue": invoice_m["revenue"],
        "new_clients": client_m["new_clients"],
        "pipeline_value": client_m["pipeline_value"],
        "meetings": meeting_m["meetings"],
    }

    ai_report = await ai_agent.generate_monthly_report(month_data)

    content = {
        "ai_report": ai_report,
        "metrics": {
            "emails": email_m,
            "invoices": invoice_m,
            "clients": client_m,
            "meetings": meeting_m,
            "tasks": task_m,
        },
    }

    report = Report(
        user_id=user_id,
        type="monthly",
        title=f"Monthly Report — {start.strftime('%b %Y')}",
        content=content,
        period_start=start,
        period_end=end,
    )
    db.add(report)
    await db.flush()
    return report


# ---------------------------------------------------------------------------
# Report retrieval
# ---------------------------------------------------------------------------


async def list_reports(
    db: AsyncSession,
    user_id: str,
    *,
    report_type: Optional[str] = None,
    limit: int = 20,
    offset: int = 0,
) -> tuple[list[Report], int]:
    """List reports for a user, optionally filtered by type."""
    conditions = [Report.user_id == user_id]
    if report_type:
        conditions.append(Report.type == report_type)

    where = and_(*conditions)
    count_q = select(func.count()).select_from(Report).where(where)
    total = (await db.execute(count_q)).scalar() or 0

    data_q = (
        select(Report)
        .where(where)
        .order_by(Report.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    result = await db.execute(data_q)
    reports = list(result.scalars().all())

    return reports, total


async def get_report(db: AsyncSession, report_id: str, user_id: str) -> Optional[Report]:
    """Retrieve a single report by ID, scoped to the user."""
    result = await db.execute(
        select(Report).where(and_(Report.id == report_id, Report.user_id == user_id))
    )
    return result.scalar_one_or_none()


async def get_latest_briefing(db: AsyncSession, user_id: str) -> Optional[Report]:
    """Retrieve the most recent daily report for the user (used for the dashboard briefing)."""
    result = await db.execute(
        select(Report)
        .where(and_(Report.user_id == user_id, Report.type == "daily"))
        .order_by(Report.created_at.desc())
        .limit(1)
    )
    return result.scalar_one_or_none()
