"""Activities router — timeline entries for companies, deals, contacts."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user, get_current_workspace
from app.models.database import Activity, User, Workspace, get_db
from app.models.schemas import ActivityCreate, ActivityResponse

router = APIRouter(prefix="/api/activities", tags=["activities"])

VALID_ENTITY_TYPES = {"company", "deal", "contact"}
VALID_ACTIVITY_TYPES = {"note", "call", "email", "meeting", "task"}


@router.get("", response_model=list[ActivityResponse])
async def list_activities(
    entity_type: str = Query(...),
    entity_id: str = Query(...),
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Activity)
        .where(
            Activity.workspace_id == workspace.id,
            Activity.entity_type == entity_type,
            Activity.entity_id == entity_id,
        )
        .order_by(Activity.created_at.desc())
    )
    activities = result.scalars().all()

    # Enrich with user names in a single query
    user_ids = list({a.user_id for a in activities})
    user_names: dict[str, str] = {}
    if user_ids:
        from app.models.database import User as UserModel
        rows = await db.execute(select(UserModel.id, UserModel.name).where(UserModel.id.in_(user_ids)))
        user_names = {r.id: r.name for r in rows}

    enriched = []
    for a in activities:
        data = ActivityResponse.model_validate(a).model_dump()
        data["user_name"] = user_names.get(a.user_id)
        enriched.append(data)
    return enriched


@router.post("", response_model=ActivityResponse, status_code=201)
async def create_activity(
    body: ActivityCreate,
    workspace: Workspace = Depends(get_current_workspace),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if body.entity_type not in VALID_ENTITY_TYPES:
        raise HTTPException(status_code=400, detail=f"entity_type must be one of {sorted(VALID_ENTITY_TYPES)}")
    if body.activity_type not in VALID_ACTIVITY_TYPES:
        raise HTTPException(status_code=400, detail=f"activity_type must be one of {sorted(VALID_ACTIVITY_TYPES)}")

    activity = Activity(
        workspace_id=workspace.id,
        user_id=user.id,
        **body.model_dump(),
    )
    db.add(activity)
    await db.flush()

    data = ActivityResponse.model_validate(activity).model_dump()
    data["user_name"] = user.name
    return data


@router.delete("/{activity_id}", status_code=204)
async def delete_activity(
    activity_id: str,
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Activity).where(Activity.id == activity_id, Activity.workspace_id == workspace.id)
    )
    activity = result.scalar_one_or_none()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    await db.delete(activity)
