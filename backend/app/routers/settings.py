"""Settings router — user preferences and integrations."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.models.database import User, get_db
from app.models.schemas import UserResponse, UserUpdate

router = APIRouter(prefix="/api/settings", tags=["settings"])


@router.get("", response_model=UserResponse)
async def get_settings(user: User = Depends(get_current_user)):
    """Get current user settings."""
    return user


@router.put("", response_model=UserResponse)
async def update_settings(
    updates: UserUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update user settings."""
    update_data = updates.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(user, key, value)
    return user


@router.get("/integrations")
async def get_integrations(user: User = Depends(get_current_user)):
    """Get integration connection statuses."""
    return {
        "integrations": [
            {
                "name": "Gmail",
                "key": "gmail",
                "connected": user.google_token is not None,
                "description": "Read, classify, and reply to emails",
            },
            {
                "name": "Google Calendar",
                "key": "calendar",
                "connected": user.google_token is not None,
                "description": "View events and generate meeting prep",
            },
            {
                "name": "Google Drive",
                "key": "drive",
                "connected": user.google_token is not None,
                "description": "Create client folders and upload docs",
            },
            {
                "name": "Slack",
                "key": "slack",
                "connected": user.slack_token is not None,
                "description": "Notifications, commands, channel summaries",
            },
            {
                "name": "Stripe",
                "key": "stripe",
                "connected": user.stripe_customer_id is not None,
                "description": "Subscription billing and payment tracking",
            },
            {
                "name": "n8n",
                "key": "n8n",
                "connected": True,  # Always available via Docker
                "description": "Workflow automation engine",
            },
        ]
    }
