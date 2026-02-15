"""Calendar router — AI-enhanced calendar with meeting prep and free-slot finder."""

import logging
from datetime import datetime, time, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.models.database import CalendarEvent, User, get_db
from app.models.schemas import (
    CalendarEventCreate,
    CalendarEventResponse,
    CalendarEventUpdate,
    FreeSlotResponse,
)
from app.services import ai_agent

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/calendar", tags=["calendar"])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


async def _get_event_or_404(
    event_id: str, user_id: str, db: AsyncSession
) -> CalendarEvent:
    """Fetch a calendar event, raising 404 if not found or not owned."""
    result = await db.execute(
        select(CalendarEvent).where(
            CalendarEvent.id == event_id,
            CalendarEvent.user_id == user_id,
        )
    )
    event = result.scalar_one_or_none()
    if event is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Calendar event not found",
        )
    return event


# ---------------------------------------------------------------------------
# GET /api/calendar/today — today's schedule
# ---------------------------------------------------------------------------


@router.get("/today", response_model=list[CalendarEventResponse])
async def get_today_schedule(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return all events for today, ordered by start time."""
    now = datetime.now(timezone.utc)
    start_of_day = datetime.combine(now.date(), time.min, tzinfo=timezone.utc)
    end_of_day = datetime.combine(now.date(), time.max, tzinfo=timezone.utc)

    result = await db.execute(
        select(CalendarEvent)
        .where(
            CalendarEvent.user_id == user.id,
            CalendarEvent.start_time >= start_of_day,
            CalendarEvent.start_time <= end_of_day,
        )
        .order_by(CalendarEvent.start_time)
    )
    events = result.scalars().all()
    return [CalendarEventResponse.model_validate(e) for e in events]


# ---------------------------------------------------------------------------
# GET /api/calendar/free-slots — find available times
# ---------------------------------------------------------------------------


@router.get("/free-slots", response_model=list[FreeSlotResponse])
async def find_free_slots(
    date: str = Query(..., description="Date in YYYY-MM-DD format"),
    duration_minutes: int = Query(30, ge=15, le=480, description="Desired slot length"),
    work_start: int = Query(9, ge=0, le=23, description="Work day start hour"),
    work_end: int = Query(17, ge=1, le=24, description="Work day end hour"),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Find free time slots on a given date based on existing events."""
    try:
        target_date = datetime.strptime(date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date format. Use YYYY-MM-DD.",
        )

    day_start = datetime.combine(target_date, time(work_start, 0), tzinfo=timezone.utc)
    day_end = datetime.combine(target_date, time(work_end, 0), tzinfo=timezone.utc)

    result = await db.execute(
        select(CalendarEvent)
        .where(
            CalendarEvent.user_id == user.id,
            CalendarEvent.start_time >= day_start,
            CalendarEvent.end_time <= day_end,
        )
        .order_by(CalendarEvent.start_time)
    )
    events = result.scalars().all()

    # Build list of busy intervals
    busy = [(e.start_time, e.end_time) for e in events]

    # Walk through the working day and collect gaps
    free_slots: list[FreeSlotResponse] = []
    cursor = day_start
    duration = timedelta(minutes=duration_minutes)

    for busy_start, busy_end in busy:
        if busy_start > cursor:
            gap = busy_start - cursor
            if gap >= duration:
                free_slots.append(
                    FreeSlotResponse(
                        start=cursor,
                        end=busy_start,
                        duration_minutes=int(gap.total_seconds() / 60),
                    )
                )
        cursor = max(cursor, busy_end)

    # Remaining gap after last event
    if cursor < day_end and (day_end - cursor) >= duration:
        gap = day_end - cursor
        free_slots.append(
            FreeSlotResponse(
                start=cursor,
                end=day_end,
                duration_minutes=int(gap.total_seconds() / 60),
            )
        )

    return free_slots


# ---------------------------------------------------------------------------
# GET /api/calendar/events — list events in a date range
# ---------------------------------------------------------------------------


@router.get("/events", response_model=list[CalendarEventResponse])
async def list_events(
    start: str | None = Query(None, description="Range start YYYY-MM-DD"),
    end: str | None = Query(None, description="Range end YYYY-MM-DD"),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List calendar events, optionally filtered to a date range."""
    query = select(CalendarEvent).where(CalendarEvent.user_id == user.id)

    if start:
        try:
            start_dt = datetime.strptime(start, "%Y-%m-%d").replace(tzinfo=timezone.utc)
            query = query.where(CalendarEvent.start_time >= start_dt)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid start date format. Use YYYY-MM-DD.",
            )

    if end:
        try:
            end_dt = (
                datetime.strptime(end, "%Y-%m-%d").replace(tzinfo=timezone.utc)
                + timedelta(days=1)
            )
            query = query.where(CalendarEvent.start_time < end_dt)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid end date format. Use YYYY-MM-DD.",
            )

    query = query.order_by(CalendarEvent.start_time)
    result = await db.execute(query)
    events = result.scalars().all()
    return [CalendarEventResponse.model_validate(e) for e in events]


# ---------------------------------------------------------------------------
# GET /api/calendar/events/{id} — event detail
# ---------------------------------------------------------------------------


@router.get("/events/{event_id}", response_model=CalendarEventResponse)
async def get_event(
    event_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve a single calendar event by ID."""
    event = await _get_event_or_404(event_id, user.id, db)
    return event


# ---------------------------------------------------------------------------
# POST /api/calendar/events — create new event
# ---------------------------------------------------------------------------


@router.post("/events", response_model=CalendarEventResponse, status_code=status.HTTP_201_CREATED)
async def create_event(
    payload: CalendarEventCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new calendar event."""
    if payload.end_time <= payload.start_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="end_time must be after start_time",
        )

    event = CalendarEvent(
        user_id=user.id,
        google_event_id=payload.google_event_id,
        title=payload.title,
        description=payload.description,
        start_time=payload.start_time,
        end_time=payload.end_time,
        location=payload.location,
        attendees=payload.attendees,
        is_meeting=payload.is_meeting,
    )
    db.add(event)
    await db.flush()

    # Optionally sync to Google Calendar when configured
    from app.config import settings

    if not settings.DEMO_MODE and user.google_token:
        try:
            from app.services import calendar_service

            google_id = await calendar_service.create_event(user, event)
            if google_id:
                event.google_event_id = google_id
        except Exception as exc:
            logger.warning("Google Calendar sync failed for new event: %s", exc)

    return event


# ---------------------------------------------------------------------------
# PUT /api/calendar/events/{id} — update event
# ---------------------------------------------------------------------------


@router.put("/events/{event_id}", response_model=CalendarEventResponse)
async def update_event(
    event_id: str,
    payload: CalendarEventUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a calendar event's mutable fields."""
    event = await _get_event_or_404(event_id, user.id, db)

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(event, field, value)

    # Validate time range if both times present after update
    if event.end_time <= event.start_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="end_time must be after start_time",
        )

    # Optionally sync update to Google Calendar
    from app.config import settings

    if not settings.DEMO_MODE and user.google_token and event.google_event_id:
        try:
            from app.services import calendar_service

            await calendar_service.update_event(user, event)
        except Exception as exc:
            logger.warning("Google Calendar update sync failed: %s", exc)

    return event


# ---------------------------------------------------------------------------
# POST /api/calendar/events/{id}/prep — generate AI meeting prep
# ---------------------------------------------------------------------------


@router.post("/events/{event_id}/prep")
async def generate_meeting_prep(
    event_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Generate an AI meeting preparation brief for an event."""
    event = await _get_event_or_404(event_id, user.id, db)

    if not event.is_meeting:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Meeting prep is only available for meeting-type events",
        )

    prep_brief = await ai_agent.generate_meeting_prep(
        event_title=event.title,
        attendees=event.attendees or [],
        client_history=None,
        recent_emails=None,
    )
    event.prep_brief = prep_brief

    return {
        "id": event.id,
        "title": event.title,
        "prep_brief": prep_brief,
    }
