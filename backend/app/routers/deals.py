"""Deals router — sales pipeline opportunities."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user, get_current_workspace
from app.models.database import Activity, Company, Contact, Deal, User, Workspace, get_db
from app.models.schemas import (
    DEAL_STAGE_PROBABILITY,
    DEAL_STAGES,
    DealCreate,
    DealPipelineColumn,
    DealResponse,
    DealStageUpdate,
    DealUpdate,
)

router = APIRouter(prefix="/deals", tags=["deals"])


async def _enrich(deal: Deal, db: AsyncSession) -> dict:
    company_name = None
    contact_name = None
    if deal.company_id:
        row = await db.execute(select(Company.company_name).where(Company.id == deal.company_id))
        company_name = row.scalar_one_or_none()
    if deal.contact_id:
        row = await db.execute(
            select(Contact.first_name, Contact.last_name).where(Contact.id == deal.contact_id)
        )
        r = row.one_or_none()
        if r:
            contact_name = f"{r.first_name} {r.last_name or ''}".strip()
    data = DealResponse.model_validate(deal).model_dump()
    data["company_name"] = company_name
    data["contact_name"] = contact_name
    return data


@router.get("", response_model=list[DealResponse])
async def list_deals(
    stage: str | None = Query(None),
    company_id: str | None = Query(None),
    search: str | None = Query(None),
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    q = select(Deal).where(Deal.workspace_id == workspace.id)
    if stage:
        q = q.where(Deal.stage == stage)
    if company_id:
        q = q.where(Deal.company_id == company_id)
    if search:
        q = q.where(Deal.title.ilike(f"%{search}%"))
    q = q.order_by(Deal.created_at.desc())
    result = await db.execute(q)
    deals = result.scalars().all()
    return [await _enrich(d, db) for d in deals]


@router.get("/pipeline", response_model=list[DealPipelineColumn])
async def get_pipeline(
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Deal).where(Deal.workspace_id == workspace.id).order_by(Deal.created_at.desc())
    )
    all_deals = result.scalars().all()

    enriched = [await _enrich(d, db) for d in all_deals]

    columns = []
    for stage in DEAL_STAGES:
        stage_deals = [d for d in enriched if d["stage"] == stage]
        total_value = sum(d["value"] or 0 for d in stage_deals)
        columns.append(
            DealPipelineColumn(
                stage=stage,
                deals=stage_deals,
                count=len(stage_deals),
                total_value=total_value,
            )
        )
    return columns


@router.get("/{deal_id}", response_model=DealResponse)
async def get_deal(
    deal_id: str,
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Deal).where(Deal.id == deal_id, Deal.workspace_id == workspace.id)
    )
    deal = result.scalar_one_or_none()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    return await _enrich(deal, db)


@router.post("", response_model=DealResponse, status_code=201)
async def create_deal(
    body: DealCreate,
    workspace: Workspace = Depends(get_current_workspace),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    data = body.model_dump()
    if data.get("probability") is None:
        data["probability"] = DEAL_STAGE_PROBABILITY.get(data.get("stage", "lead"), 10)
    data["owner_id"] = user.id
    deal = Deal(workspace_id=workspace.id, **data)
    db.add(deal)
    await db.flush()
    activity = Activity(
        workspace_id=workspace.id,
        user_id=user.id,
        entity_type="deal",
        entity_id=deal.id,
        activity_type="note",
        title=f"Deal created: {deal.title}",
    )
    db.add(activity)
    return await _enrich(deal, db)


@router.put("/{deal_id}", response_model=DealResponse)
async def update_deal(
    deal_id: str,
    body: DealUpdate,
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Deal).where(Deal.id == deal_id, Deal.workspace_id == workspace.id)
    )
    deal = result.scalar_one_or_none()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(deal, field, value)
    return await _enrich(deal, db)


@router.put("/{deal_id}/stage", response_model=DealResponse)
async def move_deal_stage(
    deal_id: str,
    body: DealStageUpdate,
    workspace: Workspace = Depends(get_current_workspace),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if body.stage not in DEAL_STAGES:
        raise HTTPException(status_code=400, detail=f"Invalid stage. Must be one of: {DEAL_STAGES}")
    result = await db.execute(
        select(Deal).where(Deal.id == deal_id, Deal.workspace_id == workspace.id)
    )
    deal = result.scalar_one_or_none()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    old_stage = deal.stage
    deal.stage = body.stage
    deal.probability = body.probability if body.probability is not None else DEAL_STAGE_PROBABILITY[body.stage]
    activity = Activity(
        workspace_id=workspace.id,
        user_id=user.id,
        entity_type="deal",
        entity_id=deal.id,
        activity_type="note",
        title=f"Stage changed: {old_stage} → {body.stage}",
    )
    db.add(activity)
    return await _enrich(deal, db)


@router.delete("/{deal_id}", status_code=204)
async def delete_deal(
    deal_id: str,
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Deal).where(Deal.id == deal_id, Deal.workspace_id == workspace.id)
    )
    deal = result.scalar_one_or_none()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    await db.delete(deal)
