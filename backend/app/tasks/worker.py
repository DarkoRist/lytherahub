"""Celery app configuration."""

from celery import Celery
from celery.schedules import crontab

from app.config import settings

celery_app = Celery(
    "lytherahub",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
)

# Periodic task schedule
celery_app.conf.beat_schedule = {
    "sync-emails-every-5-min": {
        "task": "app.tasks.email_tasks.sync_all_user_emails",
        "schedule": 300.0,  # 5 minutes
    },
    "check-overdue-invoices-daily": {
        "task": "app.tasks.invoice_tasks.check_overdue_invoices",
        "schedule": crontab(hour=9, minute=0),
    },
    "generate-morning-briefings": {
        "task": "app.tasks.report_tasks.generate_morning_briefings",
        "schedule": crontab(hour=7, minute=30),
    },
    "generate-weekly-reports": {
        "task": "app.tasks.report_tasks.generate_weekly_reports",
        "schedule": crontab(hour=8, minute=0, day_of_week=1),  # Monday 8am
    },
    "run-alert-checks": {
        "task": "app.tasks.alert_tasks.run_alert_checks",
        "schedule": 1800.0,  # 30 minutes
    },
    "generate-meeting-preps-daily": {
        "task": "app.tasks.calendar_tasks.generate_meeting_preps",
        "schedule": crontab(hour=20, minute=0),  # 8pm daily
    },
}

celery_app.autodiscover_tasks(["app.tasks"])
