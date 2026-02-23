"""Demo data seeder — loads JSON sample data into the database on startup."""

import json
import os
from datetime import datetime
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database import (
    ActivityLog,
    Alert,
    Automation,
    CalendarEvent,
    Client,
    Email,
    Invoice,
    Report,
    Task,
    User,
)

DEMO_DIR = Path(__file__).resolve().parent.parent / "demo"
DEMO_USER_ID = "demo-user-001"


def _load_json(filename: str) -> list | dict:
    filepath = DEMO_DIR / filename
    if not filepath.exists():
        print(f"  [demo] WARNING: {filepath} not found, skipping")
        return []
    with open(filepath, "r", encoding="utf-8") as f:
        return json.load(f)


def _parse_dt(val: str | None) -> datetime | None:
    if val is None:
        return None
    dt = datetime.fromisoformat(val.replace("Z", "+00:00"))
    return dt.replace(tzinfo=None)


async def seed_demo_data(db: AsyncSession) -> None:
    """Seed the database with demo data if DEMO_MODE is enabled."""
    # Check if demo user already has data
    result = await db.execute(select(Email).where(Email.user_id == DEMO_USER_ID).limit(1))
    if result.scalar_one_or_none() is not None:
        print("  [demo] Demo data already seeded, skipping")
        return

    print("  [demo] Seeding demo data...")

    # Ensure demo user exists
    result = await db.execute(select(User).where(User.id == DEMO_USER_ID))
    user = result.scalar_one_or_none()
    if user is None:
        user_data = _load_json("demo_user.json")
        user = User(
            id=user_data["id"],
            email=user_data["email"],
            name=user_data["name"],
            picture=user_data.get("picture"),
            plan=user_data.get("plan", "pro"),
            timezone=user_data.get("timezone", "Europe/Berlin"),
            onboarding_completed=user_data.get("onboarding_completed", True),
        )
        db.add(user)
        await db.flush()
        print("  [demo] Created demo user")

    # Seed clients
    clients = _load_json("demo_clients.json")
    for c in clients:
        db.add(Client(
            id=c["id"],
            user_id=DEMO_USER_ID,
            company_name=c["company_name"],
            contact_name=c.get("contact_name"),
            email=c.get("email"),
            phone=c.get("phone"),
            website=c.get("website"),
            industry=c.get("industry"),
            location=c.get("location"),
            pipeline_stage=c.get("pipeline_stage", "lead"),
            deal_value=c.get("deal_value"),
            notes=c.get("notes"),
            enrichment_data=c.get("enrichment_data"),
            last_contacted=_parse_dt(c.get("last_contacted")),
        ))
    await db.flush()
    print(f"  [demo] Seeded {len(clients)} clients")

    # Seed emails
    emails = _load_json("demo_emails.json")
    for e in emails:
        db.add(Email(
            id=e["id"],
            user_id=DEMO_USER_ID,
            gmail_id=e.get("gmail_id"),
            from_addr=e["from_addr"],
            to_addr=e["to_addr"],
            subject=e["subject"],
            snippet=e.get("snippet"),
            body_preview=e.get("body_preview"),
            category=e.get("category"),
            ai_summary=e.get("ai_summary"),
            is_read=e.get("is_read", False),
            is_starred=e.get("is_starred", False),
            needs_reply=e.get("needs_reply", False),
            reply_draft=e.get("reply_draft"),
            received_at=_parse_dt(e["received_at"]),
        ))
    await db.flush()
    print(f"  [demo] Seeded {len(emails)} emails")

    # Seed calendar events
    events = _load_json("demo_events.json")
    for ev in events:
        db.add(CalendarEvent(
            id=ev["id"],
            user_id=DEMO_USER_ID,
            google_event_id=ev.get("google_event_id"),
            title=ev["title"],
            description=ev.get("description"),
            start_time=_parse_dt(ev["start_time"]),
            end_time=_parse_dt(ev["end_time"]),
            location=ev.get("location"),
            attendees=ev.get("attendees"),
            prep_brief=ev.get("prep_brief"),
            action_items=ev.get("action_items"),
            is_meeting=ev.get("is_meeting", True),
        ))
    await db.flush()
    print(f"  [demo] Seeded {len(events)} calendar events")

    # Seed invoices
    invoices = _load_json("demo_invoices.json")
    for inv in invoices:
        db.add(Invoice(
            id=inv["id"],
            user_id=DEMO_USER_ID,
            client_id=inv.get("client_id"),
            invoice_number=inv["invoice_number"],
            amount=inv["amount"],
            currency=inv.get("currency", "EUR"),
            status=inv.get("status", "draft"),
            issued_date=_parse_dt(inv["issued_date"]),
            due_date=_parse_dt(inv["due_date"]),
            paid_date=_parse_dt(inv.get("paid_date")),
            reminder_count=inv.get("reminder_count", 0),
            source=inv.get("source", "manual"),
            notes=inv.get("notes"),
        ))
    await db.flush()
    print(f"  [demo] Seeded {len(invoices)} invoices")

    # Seed tasks
    tasks = _load_json("demo_tasks.json")
    for t in tasks:
        db.add(Task(
            id=t["id"],
            user_id=DEMO_USER_ID,
            client_id=t.get("client_id"),
            title=t["title"],
            description=t.get("description"),
            priority=t.get("priority", "medium"),
            status=t.get("status", "todo"),
            due_date=_parse_dt(t.get("due_date")),
            source=t.get("source", "manual"),
        ))
    await db.flush()
    print(f"  [demo] Seeded {len(tasks)} tasks")

    # Seed alerts
    alerts = _load_json("demo_alerts.json")
    for a in alerts:
        db.add(Alert(
            id=a["id"],
            user_id=DEMO_USER_ID,
            type=a["type"],
            title=a["title"],
            message=a["message"],
            severity=a.get("severity", "info"),
            is_read=a.get("is_read", False),
            related_entity_type=a.get("related_entity_type"),
            related_entity_id=a.get("related_entity_id"),
        ))
    await db.flush()
    print(f"  [demo] Seeded {len(alerts)} alerts")

    # Seed automations
    automations = _load_json("demo_automations.json")
    for au in automations:
        db.add(Automation(
            id=au["id"],
            user_id=DEMO_USER_ID,
            name=au["name"],
            description=au.get("description"),
            n8n_workflow_id=au.get("n8n_workflow_id"),
            trigger_type=au.get("trigger_type", "manual"),
            is_active=au.get("is_active", False),
            last_run=_parse_dt(au.get("last_run")),
            run_count=au.get("run_count", 0),
        ))
    await db.flush()
    print(f"  [demo] Seeded {len(automations)} automations")

    # Seed reports
    reports = _load_json("demo_reports.json")
    for r in reports:
        db.add(Report(
            id=r["id"],
            user_id=DEMO_USER_ID,
            type=r["type"],
            title=r["title"],
            content=r.get("content"),
            period_start=_parse_dt(r["period_start"]),
            period_end=_parse_dt(r["period_end"]),
        ))
    await db.flush()
    print(f"  [demo] Seeded {len(reports)} reports")

    # Seed activity log
    activities = _load_json("demo_activity.json")
    for ac in activities:
        db.add(ActivityLog(
            id=ac["id"],
            user_id=DEMO_USER_ID,
            entity_type=ac["entity_type"],
            entity_id=ac["entity_id"],
            action=ac["action"],
            description=ac["description"],
        ))
    await db.flush()
    print(f"  [demo] Seeded {len(activities)} activity log entries")

    await db.commit()
    print("  [demo] Demo data seeding complete!")
