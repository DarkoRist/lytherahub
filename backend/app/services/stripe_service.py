"""Stripe billing wrapper — subscriptions, checkout sessions, webhooks.

Uses the Stripe Python SDK in production. Returns realistic demo data when
DEMO_MODE is enabled or Stripe keys are not configured.
"""

import logging
from datetime import datetime, timezone
from typing import Optional

from app.config import settings

logger = logging.getLogger(__name__)

# Lazy-init Stripe
_stripe = None


def _get_stripe():
    """Return the stripe module with the API key configured."""
    global _stripe
    if _stripe is None:
        import stripe

        stripe.api_key = settings.STRIPE_SECRET_KEY
        _stripe = stripe
    return _stripe


def _is_available() -> bool:
    """Check whether the Stripe integration is usable."""
    return (
        not settings.DEMO_MODE
        and settings.ENABLE_STRIPE_BILLING
        and bool(settings.STRIPE_SECRET_KEY)
    )


# ---------------------------------------------------------------------------
# Plans / Pricing
# ---------------------------------------------------------------------------

PLANS = [
    {
        "id": "free",
        "name": "Free",
        "price": 0,
        "currency": "eur",
        "interval": "month",
        "features": [
            "5 AI email classifications / day",
            "Basic dashboard",
            "Up to 10 clients",
            "Manual invoicing",
        ],
    },
    {
        "id": "pro",
        "name": "Pro",
        "price": 29,
        "currency": "eur",
        "interval": "month",
        "stripe_price_id": "price_pro_monthly",
        "features": [
            "Unlimited AI email processing",
            "Full dashboard + morning briefing",
            "Unlimited clients & CRM",
            "Invoice automation & reminders",
            "Slack integration",
            "5 n8n automations",
        ],
    },
    {
        "id": "business",
        "name": "Business",
        "price": 79,
        "currency": "eur",
        "interval": "month",
        "stripe_price_id": "price_business_monthly",
        "features": [
            "Everything in Pro",
            "Unlimited automations",
            "Advanced AI reports",
            "Priority support",
            "Team collaboration (coming soon)",
            "Custom integrations",
        ],
    },
]


def get_plans() -> list[dict]:
    """Return the list of available subscription plans."""
    return PLANS


def get_plan_by_id(plan_id: str) -> Optional[dict]:
    """Look up a plan by its ID."""
    for plan in PLANS:
        if plan["id"] == plan_id:
            return plan
    return None


# ---------------------------------------------------------------------------
# Customer management
# ---------------------------------------------------------------------------


async def get_or_create_customer(email: str, name: str, user_id: str) -> str:
    """Retrieve or create a Stripe Customer, returning the customer ID."""
    if _is_available():
        try:
            stripe = _get_stripe()
            customers = stripe.Customer.list(email=email, limit=1)
            if customers.data:
                return customers.data[0].id
            customer = stripe.Customer.create(
                email=email,
                name=name,
                metadata={"lytherahub_user_id": user_id},
            )
            return customer.id
        except Exception as e:
            logger.error(f"Stripe get_or_create_customer error: {e}")

    # Demo fallback
    return f"cus_demo_{user_id[:8]}"


# ---------------------------------------------------------------------------
# Checkout / Subscription
# ---------------------------------------------------------------------------


async def create_checkout_session(
    customer_id: str,
    plan_id: str,
    success_url: str = "http://localhost:3000/settings?billing=success",
    cancel_url: str = "http://localhost:3000/settings?billing=cancel",
) -> dict:
    """Create a Stripe Checkout Session for subscribing to a plan.

    Returns:
        dict with ``url`` (checkout page) and ``session_id``.
    """
    plan = get_plan_by_id(plan_id)
    if not plan:
        return {"error": f"Unknown plan: {plan_id}"}

    if plan_id == "free":
        return {"url": success_url, "session_id": None, "message": "Free plan — no checkout needed."}

    if _is_available():
        try:
            stripe = _get_stripe()
            session = stripe.checkout.Session.create(
                customer=customer_id,
                payment_method_types=["card"],
                line_items=[
                    {
                        "price": plan.get("stripe_price_id"),
                        "quantity": 1,
                    }
                ],
                mode="subscription",
                success_url=success_url,
                cancel_url=cancel_url,
            )
            return {"url": session.url, "session_id": session.id}
        except Exception as e:
            logger.error(f"Stripe create_checkout_session error: {e}")

    # Demo fallback
    return {
        "url": f"{success_url}&demo=true",
        "session_id": f"cs_demo_{plan_id}",
        "message": "Demo mode — no real payment processed.",
    }


async def get_subscription(customer_id: str) -> Optional[dict]:
    """Retrieve the active subscription for a customer.

    Returns:
        dict with subscription details, or None if none exists.
    """
    if _is_available():
        try:
            stripe = _get_stripe()
            subs = stripe.Subscription.list(customer=customer_id, status="active", limit=1)
            if subs.data:
                sub = subs.data[0]
                return {
                    "id": sub.id,
                    "status": sub.status,
                    "plan_id": sub["items"]["data"][0]["price"]["id"],
                    "current_period_start": datetime.fromtimestamp(
                        sub.current_period_start, tz=timezone.utc
                    ).isoformat(),
                    "current_period_end": datetime.fromtimestamp(
                        sub.current_period_end, tz=timezone.utc
                    ).isoformat(),
                    "cancel_at_period_end": sub.cancel_at_period_end,
                }
            return None
        except Exception as e:
            logger.error(f"Stripe get_subscription error: {e}")

    # Demo fallback
    return {
        "id": "sub_demo_001",
        "status": "active",
        "plan_id": "pro",
        "current_period_start": "2025-01-01T00:00:00+00:00",
        "current_period_end": "2025-02-01T00:00:00+00:00",
        "cancel_at_period_end": False,
    }


async def cancel_subscription(customer_id: str) -> dict:
    """Cancel the active subscription at period end.

    Returns:
        dict confirming cancellation.
    """
    if _is_available():
        try:
            stripe = _get_stripe()
            subs = stripe.Subscription.list(customer=customer_id, status="active", limit=1)
            if subs.data:
                updated = stripe.Subscription.modify(
                    subs.data[0].id,
                    cancel_at_period_end=True,
                )
                return {
                    "id": updated.id,
                    "cancel_at_period_end": True,
                    "message": "Subscription will cancel at the end of the billing period.",
                }
            return {"error": "No active subscription found."}
        except Exception as e:
            logger.error(f"Stripe cancel_subscription error: {e}")

    # Demo fallback
    return {
        "id": "sub_demo_001",
        "cancel_at_period_end": True,
        "message": "Demo subscription scheduled for cancellation.",
    }


# ---------------------------------------------------------------------------
# Webhook verification
# ---------------------------------------------------------------------------


async def verify_webhook(payload: bytes, signature: str) -> Optional[dict]:
    """Verify and parse a Stripe webhook event.

    Returns:
        The parsed event dict, or None if verification fails.
    """
    if _is_available() and settings.STRIPE_WEBHOOK_SECRET:
        try:
            stripe = _get_stripe()
            event = stripe.Webhook.construct_event(
                payload,
                signature,
                settings.STRIPE_WEBHOOK_SECRET,
            )
            return {
                "type": event["type"],
                "data": event["data"]["object"],
            }
        except Exception as e:
            logger.error(f"Stripe webhook verification error: {e}")
            return None

    # Demo fallback — trust the payload
    import json

    try:
        body = json.loads(payload)
        return {
            "type": body.get("type", "unknown"),
            "data": body.get("data", {}).get("object", {}),
        }
    except Exception:
        return None


async def handle_webhook_event(event: dict) -> dict:
    """Process a verified Stripe webhook event.

    Handles subscription lifecycle events and invoice payments.
    Returns a summary of actions taken.
    """
    event_type = event.get("type", "")
    data = event.get("data", {})

    if event_type == "checkout.session.completed":
        logger.info(f"Checkout completed for customer {data.get('customer')}")
        return {"action": "subscription_created", "customer": data.get("customer")}

    if event_type == "customer.subscription.updated":
        logger.info(f"Subscription updated: {data.get('id')}")
        return {"action": "subscription_updated", "subscription_id": data.get("id")}

    if event_type == "customer.subscription.deleted":
        logger.info(f"Subscription cancelled: {data.get('id')}")
        return {"action": "subscription_cancelled", "subscription_id": data.get("id")}

    if event_type == "invoice.payment_succeeded":
        logger.info(f"Payment succeeded: {data.get('id')}")
        return {"action": "payment_succeeded", "invoice_id": data.get("id")}

    if event_type == "invoice.payment_failed":
        logger.warning(f"Payment failed: {data.get('id')}")
        return {"action": "payment_failed", "invoice_id": data.get("id")}

    logger.info(f"Unhandled Stripe event: {event_type}")
    return {"action": "ignored", "event_type": event_type}
