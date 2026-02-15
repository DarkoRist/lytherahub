"""Billing router — Stripe subscription management."""

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.config import settings
from app.models.database import User, get_db

router = APIRouter(prefix="/api/billing", tags=["billing"])

PLANS = [
    {
        "id": "free",
        "name": "Free",
        "price": 0,
        "currency": "EUR",
        "interval": "month",
        "features": ["1 email account", "5 clients", "Basic reports", "3 automations"],
    },
    {
        "id": "pro",
        "name": "Pro",
        "price": 49,
        "currency": "EUR",
        "interval": "month",
        "features": ["Unlimited email accounts", "Unlimited clients", "AI reports", "Slack integration", "All automations", "Priority email classification"],
    },
    {
        "id": "business",
        "name": "Business",
        "price": 149,
        "currency": "EUR",
        "interval": "month",
        "features": ["Everything in Pro", "Team access", "Priority support", "Custom automations", "API access", "Dedicated account manager"],
    },
]


@router.get("/plans")
async def get_plans():
    """Get available subscription plans."""
    return {"plans": PLANS}


@router.get("/subscription")
async def get_subscription(user: User = Depends(get_current_user)):
    """Get current user's subscription status."""
    current_plan = next((p for p in PLANS if p["id"] == user.plan), PLANS[0])
    return {
        "plan": current_plan,
        "status": "active",
        "stripe_customer_id": user.stripe_customer_id,
    }


@router.post("/checkout")
async def create_checkout(
    plan_id: str = "pro",
    user: User = Depends(get_current_user),
):
    """Create a Stripe checkout session (demo returns mock URL)."""
    if settings.DEMO_MODE or not settings.STRIPE_SECRET_KEY:
        return {
            "checkout_url": f"https://checkout.stripe.com/demo?plan={plan_id}",
            "message": "Demo mode — Stripe checkout is simulated.",
        }

    from app.services.stripe_service import StripeService
    service = StripeService()
    session = service.create_checkout_session(user, plan_id)
    return {"checkout_url": session.get("url", ""), "session_id": session.get("id", "")}


@router.post("/cancel")
async def cancel_subscription(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Cancel the current subscription."""
    user.plan = "free"
    return {"message": "Subscription cancelled. You are now on the Free plan."}


@router.post("/webhook")
async def stripe_webhook(request: Request):
    """Handle Stripe webhook events."""
    if settings.DEMO_MODE:
        return {"received": True}

    body = await request.body()
    # In production: verify Stripe signature and process events
    return {"received": True}
