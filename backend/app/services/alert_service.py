"""Smart alert engine — creates, queries, and manages business alerts.

Scans invoices, emails, calendar events, and client activity to generate
actionable alerts. Uses SQLAlchemy async sessions for all database access.
"""

import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

from sqlalchemy import and_, delete, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database import (
    Alert,
    CalendarEvent,
    Client,
    Email,
    Invoice,
)

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# CRUD operations
# ---------------------------------------------------------------------------


async def create_alert(
    db: AsyncSession,
    user_id: str,
    *,
    alert_type: str,
    title: str,
    message: str,
    severity: str = "info",
    related_entity_type: Optional[str] = None,
    related_entity_id: Optional[str] = None,
) -> Alert:
    """Create a new alert and persist it to the database.

    Args:
        db: Async database session.
        user_id: Owner of the alert.
        alert_type: E.g. overdue_invoice, no_reply, missed_meeting, anomaly, reminder.
        title: Short alert title.
        message: Detailed alert body.
        severity: info / warning / critical.
        related_entity_type: Optional link to another entity (invoice, email, etc.).
        related_entity_id: Optional entity ID.

    Returns:
        The created Alert ORM instance.
    """
    alert = Alert(
        user_id=user_id,
        type=alert_type,
        title=title,
        message=message,
        severity=severity,
        related_entity_type=related_entity_type,
        related_entity_id=related_entity_id,
    )
    db.add(alert)
    await db.flush()
    return alert


async def list_alerts(
    db: AsyncSession,
    user_id: str,
    *,
    severity: Optional[str] = None,
    alert_type: Optional[str] = None,
    is_read: Optional[bool] = None,
    limit: int = 50,
    offset: int = 0,
) -> tuple[list[Alert], int]:
    """Query alerts for a user with optional filters.

    Returns:
        Tuple of (list of alerts, total count).
    """
    conditions = [Alert.user_id == user_id]
    if severity:
        conditions.append(Alert.severity == severity)
    if alert_type:
        conditions.append(Alert.type == alert_type)
    if is_read is not None:
        conditions.append(Alert.is_read == is_read)

    where_clause = and_(*conditions)

    count_q = select(func.count()).select_from(Alert).where(where_clause)
    count_result = await db.execute(count_q)
    total = count_result.scalar() or 0

    data_q = (
        select(Alert)
        .where(where_clause)
        .order_by(Alert.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    result = await db.execute(data_q)
    alerts = list(result.scalars().all())

    return alerts, total


async def get_alert(db: AsyncSession, alert_id: str, user_id: str) -> Optional[Alert]:
    """Retrieve a single alert by ID, scoped to the user."""
    result = await db.execute(
        select(Alert).where(and_(Alert.id == alert_id, Alert.user_id == user_id))
    )
    return result.scalar_one_or_none()


async def mark_read(db: AsyncSession, alert_id: str, user_id: str) -> Optional[Alert]:
    """Mark a single alert as read."""
    alert = await get_alert(db, alert_id, user_id)
    if alert:
        alert.is_read = True
        await db.flush()
    return alert


async def mark_all_read(db: AsyncSession, user_id: str) -> int:
    """Mark all alerts as read for a user. Returns the number of alerts updated."""
    stmt = (
        update(Alert)
        .where(and_(Alert.user_id == user_id, Alert.is_read == False))  # noqa: E712
        .values(is_read=True)
    )
    result = await db.execute(stmt)
    await db.flush()
    return result.rowcount


async def dismiss_alert(db: AsyncSession, alert_id: str, user_id: str) -> bool:
    """Delete (dismiss) an alert. Returns True if an alert was deleted."""
    stmt = delete(Alert).where(and_(Alert.id == alert_id, Alert.user_id == user_id))
    result = await db.execute(stmt)
    await db.flush()
    return result.rowcount > 0


async def get_unread_counts(db: AsyncSession, user_id: str) -> dict:
    """Return a breakdown of unread alert counts by severity."""
    result = await db.execute(
        select(Alert.severity, func.count())
        .where(and_(Alert.user_id == user_id, Alert.is_read == False))  # noqa: E712
        .group_by(Alert.severity)
    )
    counts = {row[0]: row[1] for row in result.all()}
    return {
        "unread": sum(counts.values()),
        "critical": counts.get("critical", 0),
        "warning": counts.get("warning", 0),
        "info": counts.get("info", 0),
    }


# ---------------------------------------------------------------------------
# Alert generation — scan business data for actionable items
# ---------------------------------------------------------------------------


async def scan_overdue_invoices(db: AsyncSession, user_id: str) -> list[Alert]:
    """Generate alerts for invoices that are past due."""
    now = datetime.now(timezone.utc)
    result = await db.execute(
        select(Invoice).where(
            and_(
                Invoice.user_id == user_id,
                Invoice.status.in_(["sent", "overdue"]),
                Invoice.due_date < now,
            )
        )
    )
    invoices = result.scalars().all()
    created: list[Alert] = []

    for inv in invoices:
        days_overdue = (now - inv.due_date.replace(tzinfo=timezone.utc)).days
        if days_overdue <= 0:
            continue

        if days_overdue > 14:
            severity = "critical"
        elif days_overdue > 7:
            severity = "warning"
        else:
            severity = "info"

        # Avoid duplicating existing unread alerts for same invoice
        existing = await db.execute(
            select(Alert).where(
                and_(
                    Alert.user_id == user_id,
                    Alert.type == "overdue_invoice",
                    Alert.related_entity_id == inv.id,
                    Alert.is_read == False,  # noqa: E712
                )
            )
        )
        if existing.scalar_one_or_none():
            continue

        alert = await create_alert(
            db,
            user_id,
            alert_type="overdue_invoice",
            title=f"Invoice {inv.invoice_number} is {days_overdue} days overdue",
            message=(
                f"Invoice {inv.invoice_number} for EUR {inv.amount:,.2f} was due on "
                f"{inv.due_date.strftime('%d %b %Y')}. Consider sending a reminder."
            ),
            severity=severity,
            related_entity_type="invoice",
            related_entity_id=inv.id,
        )
        created.append(alert)

    return created


async def scan_unanswered_emails(db: AsyncSession, user_id: str, hours: int = 48) -> list[Alert]:
    """Generate alerts for emails that need a reply but haven't been answered."""
    cutoff = datetime.now(timezone.utc) - timedelta(hours=hours)
    result = await db.execute(
        select(Email).where(
            and_(
                Email.user_id == user_id,
                Email.needs_reply == True,  # noqa: E712
                Email.reply_draft.is_(None),
                Email.received_at < cutoff,
            )
        )
    )
    emails = result.scalars().all()
    created: list[Alert] = []

    for em in emails:
        existing = await db.execute(
            select(Alert).where(
                and_(
                    Alert.user_id == user_id,
                    Alert.type == "no_reply",
                    Alert.related_entity_id == em.id,
                    Alert.is_read == False,  # noqa: E712
                )
            )
        )
        if existing.scalar_one_or_none():
            continue

        alert = await create_alert(
            db,
            user_id,
            alert_type="no_reply",
            title=f"No reply sent to: {em.subject[:60]}",
            message=(
                f"Email from {em.from_addr} received on "
                f"{em.received_at.strftime('%d %b %Y %H:%M')} still needs a reply."
            ),
            severity="warning",
            related_entity_type="email",
            related_entity_id=em.id,
        )
        created.append(alert)

    return created


async def scan_stale_leads(db: AsyncSession, user_id: str, days: int = 14) -> list[Alert]:
    """Generate alerts for pipeline leads that haven't been contacted recently."""
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    result = await db.execute(
        select(Client).where(
            and_(
                Client.user_id == user_id,
                Client.pipeline_stage.in_(["lead", "contacted", "proposal"]),
                (Client.last_contacted < cutoff) | Client.last_contacted.is_(None),
            )
        )
    )
    clients = result.scalars().all()
    created: list[Alert] = []

    for client in clients:
        existing = await db.execute(
            select(Alert).where(
                and_(
                    Alert.user_id == user_id,
                    Alert.type == "reminder",
                    Alert.related_entity_id == client.id,
                    Alert.is_read == False,  # noqa: E712
                )
            )
        )
        if existing.scalar_one_or_none():
            continue

        last = (
            client.last_contacted.strftime("%d %b %Y")
            if client.last_contacted
            else "never"
        )
        alert = await create_alert(
            db,
            user_id,
            alert_type="reminder",
            title=f"Follow up with {client.company_name}",
            message=(
                f"{client.company_name} ({client.pipeline_stage}) was last contacted {last}. "
                f"Consider reaching out to keep the deal moving."
            ),
            severity="info",
            related_entity_type="client",
            related_entity_id=client.id,
        )
        created.append(alert)

    return created


async def scan_upcoming_meetings(db: AsyncSession, user_id: str, hours: int = 2) -> list[Alert]:
    """Generate alerts for meetings happening within the next N hours."""
    now = datetime.now(timezone.utc)
    window = now + timedelta(hours=hours)
    result = await db.execute(
        select(CalendarEvent).where(
            and_(
                CalendarEvent.user_id == user_id,
                CalendarEvent.start_time > now,
                CalendarEvent.start_time <= window,
                CalendarEvent.is_meeting == True,  # noqa: E712
            )
        )
    )
    events = result.scalars().all()
    created: list[Alert] = []

    for event in events:
        existing = await db.execute(
            select(Alert).where(
                and_(
                    Alert.user_id == user_id,
                    Alert.type == "reminder",
                    Alert.related_entity_id == event.id,
                    Alert.is_read == False,  # noqa: E712
                )
            )
        )
        if existing.scalar_one_or_none():
            continue

        minutes_until = int((event.start_time.replace(tzinfo=timezone.utc) - now).total_seconds() / 60)
        alert = await create_alert(
            db,
            user_id,
            alert_type="reminder",
            title=f"Meeting in {minutes_until} min: {event.title[:50]}",
            message=(
                f"'{event.title}' starts at {event.start_time.strftime('%H:%M')}."
                + (f" Location: {event.location}" if event.location else "")
            ),
            severity="info",
            related_entity_type="event",
            related_entity_id=event.id,
        )
        created.append(alert)

    return created


async def run_full_scan(db: AsyncSession, user_id: str) -> dict:
    """Run all alert scanners and return a summary of alerts generated."""
    overdue = await scan_overdue_invoices(db, user_id)
    unanswered = await scan_unanswered_emails(db, user_id)
    stale = await scan_stale_leads(db, user_id)
    meetings = await scan_upcoming_meetings(db, user_id)

    return {
        "overdue_invoices": len(overdue),
        "unanswered_emails": len(unanswered),
        "stale_leads": len(stale),
        "upcoming_meetings": len(meetings),
        "total_new_alerts": len(overdue) + len(unanswered) + len(stale) + len(meetings),
    }
