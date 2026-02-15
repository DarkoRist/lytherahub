"""Invoice-related background tasks."""

import logging

from app.tasks.worker import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(name="app.tasks.invoice_tasks.check_overdue_invoices")
def check_overdue_invoices():
    """Daily check: find overdue invoices, create alerts, auto-send reminders at day 7/14/30."""
    logger.info("Checking for overdue invoices")
    # In production: query invoices past due_date, create Alert records,
    # send reminders at escalating intervals


@celery_app.task(name="app.tasks.invoice_tasks.send_payment_reminder")
def send_payment_reminder(invoice_id: str):
    """Send a payment reminder for a specific invoice."""
    logger.info(f"Sending payment reminder for invoice {invoice_id}")
    # In production: fetch invoice + client, generate reminder via ai_agent,
    # send via gmail_service


@celery_app.task(name="app.tasks.invoice_tasks.generate_monthly_revenue_report")
def generate_monthly_revenue_report():
    """Generate monthly revenue report. Runs first of month."""
    logger.info("Generating monthly revenue report")
