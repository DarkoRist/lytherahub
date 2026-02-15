"""Alert monitoring background tasks."""

import logging

from app.tasks.worker import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(name="app.tasks.alert_tasks.run_alert_checks")
def run_alert_checks():
    """Run all alert checks for all users. Runs every 30 minutes."""
    logger.info("Running alert checks for all users")
    # In production: iterate users, run each check, create alerts, push via WebSocket + Slack


@celery_app.task(name="app.tasks.alert_tasks.check_user_alerts")
def check_user_alerts(user_id: str):
    """Run all alert checks for a specific user."""
    logger.info(f"Checking alerts for user {user_id}")
    # In production: call alert_service methods:
    # - check_overdue_invoices
    # - check_stale_leads
    # - check_upcoming_meetings (unprepared)
    # - check_unanswered_emails (3+ days)
    # - detect_anomalies
