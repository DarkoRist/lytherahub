"""Automations router — manage n8n workflows."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.models.database import Automation, User, get_db
from app.models.schemas import AutomationResponse, AutomationToggle

router = APIRouter(prefix="/api/automations", tags=["automations"])


@router.get("", response_model=list[AutomationResponse])
async def list_automations(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all automations for the current user."""
    result = await db.execute(
        select(Automation).where(Automation.user_id == user.id).order_by(Automation.created_at.desc())
    )
    return [AutomationResponse.model_validate(a) for a in result.scalars().all()]


@router.post("/{automation_id}/activate")
async def activate_automation(
    automation_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Activate an automation."""
    result = await db.execute(
        select(Automation).where(Automation.id == automation_id, Automation.user_id == user.id)
    )
    automation = result.scalar_one_or_none()
    if not automation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Automation not found")
    automation.is_active = True
    return {"message": f"Automation '{automation.name}' activated"}


@router.post("/{automation_id}/deactivate")
async def deactivate_automation(
    automation_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Deactivate an automation."""
    result = await db.execute(
        select(Automation).where(Automation.id == automation_id, Automation.user_id == user.id)
    )
    automation = result.scalar_one_or_none()
    if not automation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Automation not found")
    automation.is_active = False
    return {"message": f"Automation '{automation.name}' deactivated"}


@router.post("/{automation_id}/run")
async def run_automation(
    automation_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Manually trigger an automation."""
    from datetime import datetime, timezone

    result = await db.execute(
        select(Automation).where(Automation.id == automation_id, Automation.user_id == user.id)
    )
    automation = result.scalar_one_or_none()
    if not automation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Automation not found")

    automation.last_run = datetime.now(timezone.utc)
    automation.run_count += 1

    return {
        "message": f"Automation '{automation.name}' triggered successfully",
        "run_count": automation.run_count,
    }


@router.get("/{automation_id}/history")
async def get_automation_history(
    automation_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get execution history for an automation (demo data)."""
    result = await db.execute(
        select(Automation).where(Automation.id == automation_id, Automation.user_id == user.id)
    )
    automation = result.scalar_one_or_none()
    if not automation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Automation not found")

    # Demo execution history
    from datetime import datetime, timedelta, timezone
    now = datetime.now(timezone.utc)
    history = [
        {"run_at": (now - timedelta(hours=i * 6)).isoformat(), "status": "success", "duration_ms": 1200 + i * 100}
        for i in range(5)
    ]
    return {"automation_id": automation_id, "name": automation.name, "history": history}
