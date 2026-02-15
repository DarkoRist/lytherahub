"""Report generation background tasks."""

import logging

from app.tasks.worker import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(name="app.tasks.report_tasks.generate_morning_briefings")
def generate_morning_briefings():
    """Generate morning briefing for all users. Runs daily at 7:30am."""
    logger.info("Generating morning briefings for all users")
    # In production: iterate active users, generate daily briefing, store as Report


@celery_app.task(name="app.tasks.report_tasks.generate_weekly_reports")
def generate_weekly_reports():
    """Generate weekly reports for all users. Runs Monday 8am."""
    logger.info("Generating weekly reports for all users")
    # In production: iterate users, aggregate week data, generate via ai_agent


@celery_app.task(name="app.tasks.report_tasks.generate_monthly_reports")
def generate_monthly_reports():
    """Generate monthly reports for all users. Runs first of month."""
    logger.info("Generating monthly reports for all users")


@celery_app.task(name="app.tasks.report_tasks.generate_report_for_user")
def generate_report_for_user(user_id: str, report_type: str):
    """Generate a specific report type for a single user on demand."""
    logger.info(f"Generating {report_type} report for user {user_id}")
    # In production: gather data, call ai_agent, store Report in DB
