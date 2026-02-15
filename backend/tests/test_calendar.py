"""Tests for calendar router — events CRUD, prep briefs, free slots."""

import pytest
from datetime import datetime, timedelta, timezone
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database import CalendarEvent


@pytest.fixture
async def sample_events(db_session: AsyncSession, test_user):
    """Create sample calendar events."""
    uid = test_user.id
    now = datetime.now(timezone.utc)

    events = [
        CalendarEvent(
            id="ev-test-1", user_id=uid, google_event_id="gcal-1",
            title="Team Standup", description="Weekly sync",
            start_time=now + timedelta(hours=1),
            end_time=now + timedelta(hours=1, minutes=30),
            location="Zoom", is_meeting=True,
            attendees=[{"email": "team@test.com", "name": "Team", "status": "accepted"}],
        ),
        CalendarEvent(
            id="ev-test-2", user_id=uid, google_event_id="gcal-2",
            title="Focus Time", description="Deep work block",
            start_time=now + timedelta(hours=3),
            end_time=now + timedelta(hours=5),
            is_meeting=False,
        ),
        CalendarEvent(
            id="ev-test-3", user_id=uid, google_event_id="gcal-3",
            title="Client Call", description="Call with Hans",
            start_time=now + timedelta(days=1),
            end_time=now + timedelta(days=1, minutes=45),
            location="Phone", is_meeting=True,
            prep_brief="Background: TechVision partnership.\nTalking Points: Annual contract terms.",
        ),
    ]
    for ev in events:
        db_session.add(ev)
    await db_session.commit()
    return events


@pytest.mark.asyncio
class TestCalendarEvents:
    async def test_list_events(self, authenticated_client: AsyncClient, sample_events):
        resp = await authenticated_client.get("/api/calendar/events")
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)
        assert len(data) >= 2  # At least today's events

    async def test_get_event(self, authenticated_client: AsyncClient, sample_events):
        resp = await authenticated_client.get("/api/calendar/events/ev-test-1")
        assert resp.status_code == 200
        data = resp.json()
        assert data["title"] == "Team Standup"
        assert data["is_meeting"] is True

    async def test_get_event_not_found(self, authenticated_client: AsyncClient, sample_events):
        resp = await authenticated_client.get("/api/calendar/events/nonexistent")
        assert resp.status_code == 404

    async def test_create_event(self, authenticated_client: AsyncClient):
        now = datetime.now(timezone.utc)
        resp = await authenticated_client.post(
            "/api/calendar/events",
            json={
                "title": "New Meeting",
                "start_time": (now + timedelta(days=2)).isoformat(),
                "end_time": (now + timedelta(days=2, hours=1)).isoformat(),
                "is_meeting": True,
            },
        )
        assert resp.status_code in (200, 201)
        data = resp.json()
        assert data["title"] == "New Meeting"


@pytest.mark.asyncio
class TestMeetingPrep:
    async def test_get_prep_brief(self, authenticated_client: AsyncClient, sample_events):
        resp = await authenticated_client.get("/api/calendar/events/ev-test-3/prep")
        assert resp.status_code == 200
        data = resp.json()
        assert "prep_brief" in data or "brief" in data

    async def test_generate_prep_brief(self, authenticated_client: AsyncClient, sample_events):
        resp = await authenticated_client.post("/api/calendar/events/ev-test-1/prep")
        assert resp.status_code == 200
