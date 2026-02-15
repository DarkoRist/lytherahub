"""Background email sync and classification tasks."""

import asyncio
import logging

from app.tasks.worker import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(name="app.tasks.email_tasks.sync_user_emails")
def sync_user_emails(user_id: str):
    """Sync emails for a single user: fetch from Gmail, classify, summarize."""
    logger.info(f"Syncing emails for user {user_id}")
    # In production: fetch Gmail emails, classify with AI, store in DB
    # Demo mode: no-op (demo data is pre-loaded)


@celery_app.task(name="app.tasks.email_tasks.sync_all_user_emails")
def sync_all_user_emails():
    """Sync emails for all active users. Runs every 5 minutes."""
    logger.info("Starting email sync for all users")
    # In production: iterate users with Gmail tokens and sync each
    # Demo mode: no-op


@celery_app.task(name="app.tasks.email_tasks.classify_email")
def classify_email_task(email_id: str):
    """Classify a single email using AI."""
    logger.info(f"Classifying email {email_id}")
    # In production: fetch email from DB, call ai_agent.classify_email, update DB
