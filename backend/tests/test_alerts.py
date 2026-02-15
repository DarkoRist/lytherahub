"""Tests for alerts router — creation, read/dismiss, WebSocket push."""

import pytest
from datetime import datetime, timezone
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database import Alert


@pytest.fixture
async def sample_alerts(db_session: AsyncSession, test_user):
    """Create sample alerts."""
    uid = test_user.id

    alerts = [
        Alert(
            id="al-t1", user_id=uid, type="overdue_invoice",
            title="Invoice overdue", message="INV-001 is 10 days overdue.",
            severity="critical", is_read=False,
            related_entity_type="invoice", related_entity_id="inv-001",
        ),
        Alert(
            id="al-t2", user_id=uid, type="no_reply",
            title="Email needs reply", message="Reply to Hans ASAP.",
            severity="warning", is_read=False,
        ),
        Alert(
            id="al-t3", user_id=uid, type="reminder",
            title="Meeting in 1 hour", message="TechVision call at 10 AM.",
            severity="info", is_read=True,
        ),
    ]
    for a in alerts:
        db_session.add(a)
    await db_session.commit()
    return alerts


@pytest.mark.asyncio
class TestAlertList:
    async def test_list_alerts(self, authenticated_client: AsyncClient, sample_alerts):
        resp = await authenticated_client.get("/api/alerts")
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)
        assert len(data) == 3

    async def test_list_unread_only(self, authenticated_client: AsyncClient, sample_alerts):
        resp = await authenticated_client.get("/api/alerts?unread_only=true")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 2
        assert all(not a["is_read"] for a in data)


@pytest.mark.asyncio
class TestAlertActions:
    async def test_mark_read(self, authenticated_client: AsyncClient, sample_alerts):
        resp = await authenticated_client.patch("/api/alerts/al-t1/read")
        assert resp.status_code == 200
        data = resp.json()
        assert data["is_read"] is True

    async def test_mark_all_read(self, authenticated_client: AsyncClient, sample_alerts):
        resp = await authenticated_client.post("/api/alerts/read-all")
        assert resp.status_code == 200

        # Verify all are read
        resp2 = await authenticated_client.get("/api/alerts?unread_only=true")
        assert resp2.status_code == 200
        assert len(resp2.json()) == 0

    async def test_dismiss_alert(self, authenticated_client: AsyncClient, sample_alerts):
        resp = await authenticated_client.delete("/api/alerts/al-t3")
        assert resp.status_code in (200, 204)
