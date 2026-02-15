"""Tests for dashboard — stats, briefing, command bar, activity feed."""

import pytest
from datetime import datetime, timezone
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database import (
    Alert,
    CalendarEvent,
    Client,
    Email,
    Invoice,
    Task,
    ActivityLog,
)


@pytest.fixture
async def seeded_dashboard(db_session: AsyncSession, test_user):
    """Seed minimal data for dashboard stat tests."""
    uid = test_user.id
    now = datetime.now(timezone.utc)

    db_session.add(Email(
        id="e-t1", user_id=uid, from_addr="a@b.com", to_addr="t@t.com",
        subject="Test", received_at=now, is_read=False,
    ))
    db_session.add(Email(
        id="e-t2", user_id=uid, from_addr="a@b.com", to_addr="t@t.com",
        subject="Read", received_at=now, is_read=True,
    ))
    db_session.add(CalendarEvent(
        id="ev-t1", user_id=uid, title="Meeting",
        start_time=now, end_time=now, is_meeting=True,
    ))
    db_session.add(Invoice(
        id="inv-t1", user_id=uid, invoice_number="INV-T1",
        amount=1000, status="overdue", issued_date=now, due_date=now,
    ))
    db_session.add(Invoice(
        id="inv-t2", user_id=uid, invoice_number="INV-T2",
        amount=2000, status="sent", issued_date=now, due_date=now,
    ))
    db_session.add(Client(
        id="c-t1", user_id=uid, company_name="TestCo", pipeline_stage="won",
    ))
    db_session.add(Task(
        id="t-t1", user_id=uid, title="Do something", status="todo",
    ))
    db_session.add(Alert(
        id="al-t1", user_id=uid, type="reminder",
        title="Alert", message="Test alert", is_read=False,
    ))
    db_session.add(ActivityLog(
        id="act-t1", user_id=uid, entity_type="email",
        entity_id="e-t1", action="received", description="Test email received",
    ))
    await db_session.commit()


@pytest.mark.asyncio
class TestDashboardStats:
    async def test_get_stats(self, authenticated_client: AsyncClient, seeded_dashboard):
        resp = await authenticated_client.get("/api/dashboard/stats")
        assert resp.status_code == 200
        data = resp.json()
        assert data["unread_emails"] == 1
        assert data["today_meetings"] == 1
        assert data["outstanding_invoices"] == 3000.0
        assert data["overdue_invoices"] == 1
        assert data["active_clients"] == 1
        assert data["pending_tasks"] == 1
        assert data["unread_alerts"] == 1

    async def test_stats_require_auth(self, client: AsyncClient):
        resp = await client.get("/api/dashboard/stats")
        assert resp.status_code in (401, 403)


@pytest.mark.asyncio
class TestDashboardBriefing:
    async def test_get_briefing(self, authenticated_client: AsyncClient, seeded_dashboard):
        resp = await authenticated_client.get("/api/dashboard/briefing")
        assert resp.status_code == 200
        data = resp.json()
        # Briefing should return a dict (demo mode returns structured data)
        assert isinstance(data, dict)


@pytest.mark.asyncio
class TestDashboardActivity:
    async def test_get_activity(self, authenticated_client: AsyncClient, seeded_dashboard):
        resp = await authenticated_client.get("/api/dashboard/activity")
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        assert data[0]["entity_type"] == "email"

    async def test_activity_limit(self, authenticated_client: AsyncClient, seeded_dashboard):
        resp = await authenticated_client.get("/api/dashboard/activity?limit=1")
        assert resp.status_code == 200
        assert len(resp.json()) == 1


@pytest.mark.asyncio
class TestCommandBar:
    async def test_process_command(self, authenticated_client: AsyncClient):
        resp = await authenticated_client.post(
            "/api/dashboard/command",
            json={"command": "Show my overdue invoices"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "action" in data
        assert "message" in data
