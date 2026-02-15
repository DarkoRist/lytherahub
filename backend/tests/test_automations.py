"""Tests for automations router — list, toggle, execute."""

import pytest
from datetime import datetime, timezone
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database import Automation


@pytest.fixture
async def sample_automations(db_session: AsyncSession, test_user):
    """Create sample automations."""
    uid = test_user.id

    automations = [
        Automation(
            id="auto-t1", user_id=uid, name="Email Classification",
            description="Auto-classify incoming emails",
            trigger_type="event", is_active=True,
            run_count=847,
            last_run=datetime.now(timezone.utc),
        ),
        Automation(
            id="auto-t2", user_id=uid, name="Invoice Reminders",
            description="Send payment reminders for overdue invoices",
            trigger_type="scheduled", is_active=True,
            run_count=156,
        ),
        Automation(
            id="auto-t3", user_id=uid, name="Stale Lead Alerts",
            description="Alert on stale leads",
            trigger_type="scheduled", is_active=False,
            run_count=67,
        ),
    ]
    for a in automations:
        db_session.add(a)
    await db_session.commit()
    return automations


@pytest.mark.asyncio
class TestAutomationList:
    async def test_list_automations(self, authenticated_client: AsyncClient, sample_automations):
        resp = await authenticated_client.get("/api/automations")
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)
        assert len(data) == 3

    async def test_list_active_only(self, authenticated_client: AsyncClient, sample_automations):
        resp = await authenticated_client.get("/api/automations?active_only=true")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 2


@pytest.mark.asyncio
class TestAutomationToggle:
    async def test_toggle_on(self, authenticated_client: AsyncClient, sample_automations):
        resp = await authenticated_client.patch(
            "/api/automations/auto-t3/toggle",
            json={"is_active": True},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["is_active"] is True

    async def test_toggle_off(self, authenticated_client: AsyncClient, sample_automations):
        resp = await authenticated_client.patch(
            "/api/automations/auto-t1/toggle",
            json={"is_active": False},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["is_active"] is False


@pytest.mark.asyncio
class TestAutomationExecute:
    async def test_run_automation(self, authenticated_client: AsyncClient, sample_automations):
        resp = await authenticated_client.post("/api/automations/auto-t1/run")
        assert resp.status_code == 200
        data = resp.json()
        assert "run_count" in data or "message" in data
