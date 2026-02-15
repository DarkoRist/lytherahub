"""Calendar-related background tasks."""

import logging

from app.tasks.worker import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(name="app.tasks.calendar_tasks.generate_meeting_preps")
def generate_meeting_preps():
    """Auto-generate meeting prep briefs for tomorrow's meetings. Runs daily at 8pm."""
    logger.info("Generating meeting prep briefs for tomorrow's meetings")
    # In production: query tomorrow's events, generate AI prep for each
    # Demo mode: no-op (demo data has pre-generated preps)


@celery_app.task(name="app.tasks.calendar_tasks.generate_meeting_prep")
def generate_meeting_prep_task(event_id: str):
    """Generate meeting prep for a single event."""
    logger.info(f"Generating meeting prep for event {event_id}")
    # In production: fetch event + client data, call ai_agent.generate_meeting_prep
