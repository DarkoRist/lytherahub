"""Tests for reports router — generation, listing."""

import pytest
from datetime import datetime, timedelta, timezone
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database import Report


@pytest.fixture
async def sample_reports(db_session: AsyncSession, test_user):
    """Create sample reports."""
    uid = test_user.id
    now = datetime.now(timezone.utc)

    reports = [
        Report(
            id="rpt-t1", user_id=uid, type="daily",
            title="Daily Briefing — Today",
            content={"summary": "Busy day ahead.", "metrics": {"emails_received": 10}},
            period_start=now.replace(hour=0, minute=0, second=0),
            period_end=now.replace(hour=23, minute=59, second=59),
        ),
        Report(
            id="rpt-t2", user_id=uid, type="weekly",
            title="Weekly Report",
            content={"summary": "Strong week.", "revenue": {"total": 13200}},
            period_start=now - timedelta(days=7),
            period_end=now,
        ),
        Report(
            id="rpt-t3", user_id=uid, type="monthly",
            title="Monthly Report — January",
            content={"summary": "Record month.", "revenue": {"total": 41300}},
            period_start=now - timedelta(days=31),
            period_end=now - timedelta(days=1),
        ),
    ]
    for r in reports:
        db_session.add(r)
    await db_session.commit()
    return reports


@pytest.mark.asyncio
class TestReportList:
    async def test_list_reports(self, authenticated_client: AsyncClient, sample_reports):
        resp = await authenticated_client.get("/api/reports")
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)
        assert len(data) == 3

    async def test_list_filter_type(self, authenticated_client: AsyncClient, sample_reports):
        resp = await authenticated_client.get("/api/reports?type=weekly")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) >= 1
        assert data[0]["type"] == "weekly"


@pytest.mark.asyncio
class TestReportDetail:
    async def test_get_report(self, authenticated_client: AsyncClient, sample_reports):
        resp = await authenticated_client.get("/api/reports/rpt-t1")
        assert resp.status_code == 200
        data = resp.json()
        assert data["type"] == "daily"
        assert "content" in data

    async def test_get_report_not_found(self, authenticated_client: AsyncClient, sample_reports):
        resp = await authenticated_client.get("/api/reports/nonexistent")
        assert resp.status_code == 404


@pytest.mark.asyncio
class TestReportGeneration:
    async def test_generate_daily_report(self, authenticated_client: AsyncClient):
        resp = await authenticated_client.post(
            "/api/reports/generate",
            json={"type": "daily"},
        )
        assert resp.status_code in (200, 201)
        data = resp.json()
        assert data["type"] == "daily"
