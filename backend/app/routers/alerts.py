"""Alerts router — list, read, dismiss alerts."""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.models.database import Alert, User, get_db
from app.models.schemas import AlertCountResponse, AlertResponse

router = APIRouter(prefix="/api/alerts", tags=["alerts"])


@router.get("/count", response_model=AlertCountResponse)
async def get_alert_counts(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get unread alert counts by severity."""
    uid = user.id
    base = select(Alert).where(Alert.user_id == uid, Alert.is_read == False)  # noqa: E712

    unread = (await db.execute(
        select(func.count()).select_from(base.subquery())
    )).scalar() or 0

    critical = (await db.execute(
        select(func.count()).select_from(base.where(Alert.severity == "critical").subquery())
    )).scalar() or 0

    warning = (await db.execute(
        select(func.count()).select_from(
            select(Alert).where(Alert.user_id == uid, Alert.is_read == False, Alert.severity == "warning").subquery()  # noqa: E712
        )
    )).scalar() or 0

    info = (await db.execute(
        select(func.count()).select_from(
            select(Alert).where(Alert.user_id == uid, Alert.is_read == False, Alert.severity == "info").subquery()  # noqa: E712
        )
    )).scalar() or 0

    return AlertCountResponse(unread=unread, critical=critical, warning=warning, info=info)


@router.get("", response_model=list[AlertResponse])
async def list_alerts(
    severity: str | None = Query(None),
    alert_type: str | None = Query(None, alias="type"),
    is_read: bool | None = Query(None),
    limit: int = Query(50, ge=1, le=200),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List alerts with optional filters."""
    query = select(Alert).where(Alert.user_id == user.id)
    if severity:
        query = query.where(Alert.severity == severity)
    if alert_type:
        query = query.where(Alert.type == alert_type)
    if is_read is not None:
        query = query.where(Alert.is_read == is_read)

    query = query.order_by(Alert.created_at.desc()).limit(limit)
    result = await db.execute(query)
    return [AlertResponse.model_validate(a) for a in result.scalars().all()]


@router.put("/{alert_id}/read")
async def mark_alert_read(
    alert_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark a single alert as read."""
    result = await db.execute(
        select(Alert).where(Alert.id == alert_id, Alert.user_id == user.id)
    )
    alert = result.scalar_one_or_none()
    if not alert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found")
    alert.is_read = True
    return {"message": "Alert marked as read"}


@router.put("/read-all")
async def mark_all_read(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark all alerts as read."""
    await db.execute(
        update(Alert).where(Alert.user_id == user.id, Alert.is_read == False).values(is_read=True)  # noqa: E712
    )
    return {"message": "All alerts marked as read"}


@router.delete("/{alert_id}")
async def dismiss_alert(
    alert_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Dismiss (delete) an alert."""
    result = await db.execute(
        select(Alert).where(Alert.id == alert_id, Alert.user_id == user.id)
    )
    alert = result.scalar_one_or_none()
    if not alert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found")
    await db.delete(alert)
    return {"message": "Alert dismissed"}
