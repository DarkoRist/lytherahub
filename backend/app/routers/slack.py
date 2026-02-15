"""Slack router — bot events, slash commands, channels."""

from fastapi import APIRouter, Depends, Request

from app.auth.dependencies import get_current_user
from app.config import settings
from app.models.database import User

router = APIRouter(prefix="/api/slack", tags=["slack"])


@router.post("/events")
async def slack_events(request: Request):
    """Handle Slack event webhook (message events, app mentions)."""
    body = await request.json()

    # Slack URL verification challenge
    if body.get("type") == "url_verification":
        return {"challenge": body.get("challenge")}

    # In production: process events (messages, mentions) via slack_service
    return {"ok": True}


@router.post("/commands")
async def slack_commands(request: Request):
    """Handle Slack slash commands (/lytherahub briefing, /lytherahub tasks, etc.)."""
    form = await request.form()
    command_text = form.get("text", "")

    if settings.DEMO_MODE:
        if "briefing" in command_text:
            return {
                "response_type": "ephemeral",
                "text": "Good morning! You have 3 urgent emails, 2 meetings today, and EUR 4,200 in overdue invoices.",
            }
        if "tasks" in command_text:
            return {
                "response_type": "ephemeral",
                "text": "Your pending tasks:\n1. Reply to TechCorp contract\n2. Send proposal to DesignHaus\n3. Follow up on Invoice #1042",
            }
        return {
            "response_type": "ephemeral",
            "text": f"LytheraHub command: {command_text}. Available: briefing, tasks, invoices",
        }

    # In production: route to appropriate service
    return {"response_type": "ephemeral", "text": f"Processing: {command_text}"}


@router.get("/channels")
async def list_channels(user: User = Depends(get_current_user)):
    """List connected Slack channels."""
    if settings.DEMO_MODE:
        return {
            "channels": [
                {"id": "C001", "name": "general", "is_member": True},
                {"id": "C002", "name": "lytherahub-alerts", "is_member": True},
                {"id": "C003", "name": "sales", "is_member": False},
            ]
        }
    return {"channels": []}
