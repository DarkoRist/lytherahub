"""Google Calendar wrapper — reads, creates, updates events and finds free slots.

Uses google-api-python-client for real Calendar interactions.  When
``settings.DEMO_MODE`` is ``True`` every method returns realistic mock
data so the dashboard works without any Google credentials.
"""

from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials

from app.config import settings

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Demo / mock data
# ---------------------------------------------------------------------------

def _demo_events() -> list[dict[str, Any]]:
    """Generate fresh demo events relative to *now* so dates always look current."""
    now = datetime.now(timezone.utc)
    today_9am = now.replace(hour=9, minute=0, second=0, microsecond=0)
    if today_9am < now:
        today_9am += timedelta(days=1)

    return [
        {
            "google_event_id": "demo_evt_001",
            "title": "Weekly Team Standup",
            "description": "Review sprint progress and blockers.",
            "start_time": today_9am.isoformat(),
            "end_time": (today_9am + timedelta(minutes=30)).isoformat(),
            "location": "Google Meet",
            "attendees": [
                {"email": "mark.johnson@greenfield.com", "name": "Mark Johnson", "status": "accepted"},
                {"email": "lisa.park@techcorp.io", "name": "Lisa Park", "status": "accepted"},
            ],
            "is_meeting": True,
        },
        {
            "google_event_id": "demo_evt_002",
            "title": "Client Call — TechCorp Q1 Renewal",
            "description": "Discuss contract terms and pricing adjustments for Q1.",
            "start_time": (today_9am + timedelta(hours=2)).isoformat(),
            "end_time": (today_9am + timedelta(hours=3)).isoformat(),
            "location": "Zoom — https://zoom.us/j/123456789",
            "attendees": [
                {"email": "sarah.chen@techcorp.io", "name": "Sarah Chen", "status": "accepted"},
            ],
            "is_meeting": True,
        },
        {
            "google_event_id": "demo_evt_003",
            "title": "Lunch Break",
            "description": None,
            "start_time": (today_9am + timedelta(hours=3, minutes=30)).isoformat(),
            "end_time": (today_9am + timedelta(hours=4, minutes=30)).isoformat(),
            "location": None,
            "attendees": None,
            "is_meeting": False,
        },
        {
            "google_event_id": "demo_evt_004",
            "title": "Design Review — DesignHaus Proposal",
            "description": "Walk through wireframes and timeline for the website redesign proposal.",
            "start_time": (today_9am + timedelta(hours=5)).isoformat(),
            "end_time": (today_9am + timedelta(hours=6)).isoformat(),
            "location": "Conference Room B",
            "attendees": [
                {"email": "anna.schmidt@designhaus.de", "name": "Anna Schmidt", "status": "tentative"},
                {"email": "tom.meyer@designhaus.de", "name": "Tom Meyer", "status": "needsAction"},
            ],
            "is_meeting": True,
        },
        {
            "google_event_id": "demo_evt_005",
            "title": "Revenue Forecast Prep",
            "description": "Prepare monthly revenue numbers and cash-flow projections.",
            "start_time": (today_9am + timedelta(days=1, hours=1)).isoformat(),
            "end_time": (today_9am + timedelta(days=1, hours=2)).isoformat(),
            "location": None,
            "attendees": None,
            "is_meeting": False,
        },
        {
            "google_event_id": "demo_evt_006",
            "title": "Greenfield Solutions — Project Kickoff",
            "description": "Kick off the new consulting engagement with Greenfield.",
            "start_time": (today_9am + timedelta(days=2, hours=0)).isoformat(),
            "end_time": (today_9am + timedelta(days=2, hours=1, minutes=30)).isoformat(),
            "location": "Google Meet",
            "attendees": [
                {"email": "mark.johnson@greenfield.com", "name": "Mark Johnson", "status": "accepted"},
                {"email": "julia.weber@greenfield.com", "name": "Julia Weber", "status": "accepted"},
            ],
            "is_meeting": True,
        },
    ]


# ---------------------------------------------------------------------------
# Service
# ---------------------------------------------------------------------------


class CalendarService:
    """Wraps the Google Calendar API for event management.

    Args:
        google_token: A dictionary containing the user's OAuth2 token
            fields.  Ignored in demo mode.
    """

    def __init__(self, google_token: Optional[dict[str, str]] = None) -> None:
        self._service = None

        if settings.DEMO_MODE or google_token is None:
            logger.info("CalendarService running in DEMO mode.")
            return

        try:
            credentials = Credentials(
                token=google_token.get("token"),
                refresh_token=google_token.get("refresh_token"),
                token_uri=google_token.get("token_uri", "https://oauth2.googleapis.com/token"),
                client_id=google_token.get("client_id", settings.GOOGLE_CLIENT_ID),
                client_secret=google_token.get("client_secret", settings.GOOGLE_CLIENT_SECRET),
            )
            self._service = build("calendar", "v3", credentials=credentials)
            logger.info("CalendarService initialized with live Google token.")
        except Exception as exc:
            logger.error("Failed to build Calendar service: %s — falling back to demo mode.", exc)

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    @property
    def _is_demo(self) -> bool:
        return self._service is None

    @staticmethod
    def _parse_event(event: dict) -> dict[str, Any]:
        """Normalise a Google Calendar event resource into a flat dict."""
        start_raw = event.get("start", {})
        end_raw = event.get("end", {})

        # Google returns either dateTime (timed) or date (all-day)
        start_str = start_raw.get("dateTime") or start_raw.get("date", "")
        end_str = end_raw.get("dateTime") or end_raw.get("date", "")

        attendees_raw = event.get("attendees", [])
        attendees = [
            {
                "email": a.get("email", ""),
                "name": a.get("displayName", a.get("email", "")),
                "status": a.get("responseStatus", "needsAction"),
            }
            for a in attendees_raw
        ] if attendees_raw else None

        return {
            "google_event_id": event.get("id", ""),
            "title": event.get("summary", "(No title)"),
            "description": event.get("description"),
            "start_time": start_str,
            "end_time": end_str,
            "location": event.get("location"),
            "attendees": attendees,
            "is_meeting": bool(attendees),
        }

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def fetch_events(self, days_ahead: int = 7) -> list[dict[str, Any]]:
        """Fetch upcoming calendar events.

        Args:
            days_ahead: How many days into the future to look.

        Returns:
            A list of parsed event dictionaries, ordered by start time.
        """
        if self._is_demo:
            events = _demo_events()
            cutoff = (datetime.now(timezone.utc) + timedelta(days=days_ahead)).isoformat()
            return [e for e in events if e["start_time"] <= cutoff]

        try:
            now = datetime.now(timezone.utc)
            time_min = now.isoformat()
            time_max = (now + timedelta(days=days_ahead)).isoformat()

            response = (
                self._service.events()
                .list(
                    calendarId="primary",
                    timeMin=time_min,
                    timeMax=time_max,
                    maxResults=100,
                    singleEvents=True,
                    orderBy="startTime",
                )
                .execute()
            )
            return [self._parse_event(e) for e in response.get("items", [])]
        except Exception as exc:
            logger.error("fetch_events failed: %s", exc)
            return []

    def get_event(self, event_id: str) -> Optional[dict[str, Any]]:
        """Fetch a single event by its Google Calendar event ID.

        Args:
            event_id: The Google Calendar event identifier.

        Returns:
            Parsed event dict or ``None`` if not found.
        """
        if self._is_demo:
            for event in _demo_events():
                if event["google_event_id"] == event_id:
                    return event
            return None

        try:
            event = (
                self._service.events()
                .get(calendarId="primary", eventId=event_id)
                .execute()
            )
            return self._parse_event(event)
        except Exception as exc:
            logger.error("get_event(%s) failed: %s", event_id, exc)
            return None

    def create_event(
        self,
        title: str,
        start: datetime,
        end: datetime,
        attendees: Optional[list[str]] = None,
        description: Optional[str] = None,
        location: Optional[str] = None,
    ) -> Optional[dict[str, Any]]:
        """Create a new calendar event.

        Args:
            title: Event summary / title.
            start: Start datetime (timezone-aware).
            end: End datetime (timezone-aware).
            attendees: Optional list of attendee email addresses.
            description: Optional event description.
            location: Optional event location.

        Returns:
            The created event dict or ``None`` on failure.
        """
        if self._is_demo:
            logger.info("DEMO: create_event(title=%s)", title)
            return {
                "google_event_id": f"demo_new_{datetime.now(timezone.utc).timestamp():.0f}",
                "title": title,
                "description": description,
                "start_time": start.isoformat(),
                "end_time": end.isoformat(),
                "location": location,
                "attendees": [{"email": a, "name": a, "status": "needsAction"} for a in (attendees or [])],
                "is_meeting": bool(attendees),
            }

        try:
            body: dict[str, Any] = {
                "summary": title,
                "start": {"dateTime": start.isoformat(), "timeZone": "UTC"},
                "end": {"dateTime": end.isoformat(), "timeZone": "UTC"},
            }
            if description:
                body["description"] = description
            if location:
                body["location"] = location
            if attendees:
                body["attendees"] = [{"email": email} for email in attendees]
                body["conferenceData"] = None  # let Google auto-create if configured

            created = (
                self._service.events()
                .insert(calendarId="primary", body=body, sendUpdates="all")
                .execute()
            )
            return self._parse_event(created)
        except Exception as exc:
            logger.error("create_event failed: %s", exc)
            return None

    def update_event(
        self,
        event_id: str,
        updates: dict[str, Any],
    ) -> Optional[dict[str, Any]]:
        """Update an existing calendar event.

        Args:
            event_id: The Google Calendar event identifier.
            updates: A dict of fields to update.  Recognised keys:
                ``title``, ``description``, ``start`` (datetime),
                ``end`` (datetime), ``location``, ``attendees`` (list of emails).

        Returns:
            The updated event dict or ``None`` on failure.
        """
        if self._is_demo:
            logger.info("DEMO: update_event(%s)", event_id)
            event = self.get_event(event_id)
            if event:
                event.update({
                    "title": updates.get("title", event["title"]),
                    "description": updates.get("description", event.get("description")),
                    "start_time": updates["start"].isoformat() if "start" in updates else event["start_time"],
                    "end_time": updates["end"].isoformat() if "end" in updates else event["end_time"],
                    "location": updates.get("location", event.get("location")),
                })
            return event

        try:
            # Fetch current event first
            existing = (
                self._service.events()
                .get(calendarId="primary", eventId=event_id)
                .execute()
            )

            if "title" in updates:
                existing["summary"] = updates["title"]
            if "description" in updates:
                existing["description"] = updates["description"]
            if "location" in updates:
                existing["location"] = updates["location"]
            if "start" in updates:
                existing["start"] = {"dateTime": updates["start"].isoformat(), "timeZone": "UTC"}
            if "end" in updates:
                existing["end"] = {"dateTime": updates["end"].isoformat(), "timeZone": "UTC"}
            if "attendees" in updates:
                existing["attendees"] = [{"email": email} for email in updates["attendees"]]

            updated = (
                self._service.events()
                .update(calendarId="primary", eventId=event_id, body=existing, sendUpdates="all")
                .execute()
            )
            return self._parse_event(updated)
        except Exception as exc:
            logger.error("update_event(%s) failed: %s", event_id, exc)
            return None

    def find_free_slots(
        self,
        duration_minutes: int = 30,
        days_ahead: int = 7,
        work_start_hour: int = 9,
        work_end_hour: int = 17,
    ) -> list[dict[str, Any]]:
        """Find available time slots in the user's calendar.

        Looks through the next ``days_ahead`` days during working hours
        (``work_start_hour`` to ``work_end_hour`` UTC) and returns gaps
        that are at least ``duration_minutes`` long.

        Args:
            duration_minutes: Minimum slot length in minutes.
            days_ahead: How many days ahead to search.
            work_start_hour: Start of working hours (UTC, 0-23).
            work_end_hour: End of working hours (UTC, 0-23).

        Returns:
            A list of ``{"start": str, "end": str, "duration_minutes": int}`` dicts.
        """
        events = self.fetch_events(days_ahead=days_ahead)

        # Parse event times into (start, end) datetime pairs
        busy: list[tuple[datetime, datetime]] = []
        for evt in events:
            try:
                s = datetime.fromisoformat(evt["start_time"])
                e = datetime.fromisoformat(evt["end_time"])
                # Ensure timezone-aware
                if s.tzinfo is None:
                    s = s.replace(tzinfo=timezone.utc)
                if e.tzinfo is None:
                    e = e.replace(tzinfo=timezone.utc)
                busy.append((s, e))
            except (ValueError, KeyError):
                continue

        busy.sort(key=lambda x: x[0])

        now = datetime.now(timezone.utc)
        slots: list[dict[str, Any]] = []
        min_duration = timedelta(minutes=duration_minutes)

        for day_offset in range(days_ahead):
            day = now + timedelta(days=day_offset)
            day_start = day.replace(hour=work_start_hour, minute=0, second=0, microsecond=0)
            day_end = day.replace(hour=work_end_hour, minute=0, second=0, microsecond=0)

            # Skip if the work day has already passed
            if day_end <= now:
                continue
            # Clamp start to now if partially through the day
            if day_start < now:
                day_start = now.replace(second=0, microsecond=0) + timedelta(minutes=1)

            # Collect busy periods that overlap this work day
            day_busy = [
                (max(s, day_start), min(e, day_end))
                for s, e in busy
                if s < day_end and e > day_start
            ]
            day_busy.sort(key=lambda x: x[0])

            cursor = day_start
            for bs, be in day_busy:
                if bs > cursor:
                    gap = bs - cursor
                    if gap >= min_duration:
                        slots.append({
                            "start": cursor.isoformat(),
                            "end": bs.isoformat(),
                            "duration_minutes": int(gap.total_seconds() / 60),
                        })
                cursor = max(cursor, be)

            # Remaining time after last event
            if cursor < day_end:
                gap = day_end - cursor
                if gap >= min_duration:
                    slots.append({
                        "start": cursor.isoformat(),
                        "end": day_end.isoformat(),
                        "duration_minutes": int(gap.total_seconds() / 60),
                    })

        return slots
