"""Onboarding router — first-time user setup flow."""

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.auth.dependencies import get_current_user
from app.models.database import User, get_db

router = APIRouter(prefix="/api/onboarding", tags=["onboarding"])


class OnboardingProfileUpdate(BaseModel):
    """Payload from step 1 — basic profile info."""
    business_name: Optional[str] = None
    business_type: Optional[str] = None
    timezone: Optional[str] = None


class OnboardingPreferences(BaseModel):
    """Payload from step 4 — notification preferences."""
    briefing_time: Optional[str] = None  # e.g. "08:00"
    email_notifications: bool = True
    slack_notifications: bool = False


@router.get("/status")
async def onboarding_status(user: User = Depends(get_current_user)):
    """Check whether onboarding has been completed."""
    return {
        "completed": user.onboarding_completed,
        "user_name": user.name,
        "user_email": user.email,
    }


@router.post("/profile")
async def save_profile(
    body: OnboardingProfileUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Step 1 — save basic profile info."""
    if body.timezone:
        user.timezone = body.timezone
    await db.flush()
    return {"status": "ok"}


@router.post("/preferences")
async def save_preferences(
    body: OnboardingPreferences,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Step 4 — save notification preferences."""
    # Preferences would be stored in a settings table in a full implementation.
    # For now just acknowledge.
    return {"status": "ok"}


@router.post("/complete")
async def complete_onboarding(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark onboarding as done."""
    user.onboarding_completed = True
    await db.flush()
    return {"status": "ok", "completed": True}


@router.post("/skip")
async def skip_onboarding(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Skip onboarding and go straight to dashboard."""
    user.onboarding_completed = True
    await db.flush()
    return {"status": "ok", "completed": True}
