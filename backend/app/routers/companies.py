"""Companies router — CRM backbone (replaces /api/clients).
/api/clients is kept as an alias in main.py via include_router prefix override.
"""

import logging
import math
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user, get_current_workspace
from app.models.database import Company, User, Workspace, get_db
from app.models.schemas import (
    CompanyCreate,
    CompanyResponse,
    CompanyUpdate,
    PaginatedResponse,
    PipelineResponse,
    PipelineStageUpdate,
)
from app.services import ai_agent

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/companies", tags=["companies"])

PIPELINE_STAGES = ["lead", "contacted", "proposal", "negotiation", "won", "lost"]
COMPANY_TYPES = ["customer", "supplier", "both"]


async def _get_company_or_404(company_id: str, workspace_id: str, db: AsyncSession) -> Company:
    result = await db.execute(
        select(Company).where(
            Company.id == company_id,
            Company.workspace_id == workspace_id,
        )
    )
    company = result.scalar_one_or_none()
    if company is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Company not found")
    return company


@router.get("/pipeline", response_model=list[PipelineResponse])
async def get_pipeline(
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    """Return companies grouped by pipeline stage."""
    pipeline = []
    for stage in PIPELINE_STAGES:
        result = await db.execute(
            select(Company)
            .where(Company.workspace_id == workspace.id, Company.pipeline_stage == stage)
            .order_by(Company.updated_at.desc())
        )
        companies = result.scalars().all()
        total_value = sum(c.deal_value or 0.0 for c in companies)
        pipeline.append(
            PipelineResponse(
                stage=stage,
                clients=[CompanyResponse.model_validate(c) for c in companies],
                count=len(companies),
                total_value=total_value,
            )
        )
    return pipeline


@router.get("/stale", response_model=list[CompanyResponse])
async def get_stale_leads(
    days: int = Query(14, ge=1, le=90),
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    """Return customer companies not contacted within the specified window."""
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    result = await db.execute(
        select(Company).where(
            Company.workspace_id == workspace.id,
            Company.company_type.in_(["customer", "both"]),
            Company.pipeline_stage.notin_(["won", "lost"]),
            or_(
                Company.last_contacted.is_(None),
                Company.last_contacted < cutoff,
            ),
        ).order_by(Company.last_contacted.asc().nullsfirst())
    )
    return result.scalars().all()


@router.get("", response_model=PaginatedResponse)
async def list_companies(
    company_type: str | None = Query(None, description="Filter by type: customer/supplier/both"),
    stage: str | None = Query(None),
    search: str | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    query = select(Company).where(Company.workspace_id == workspace.id)

    if company_type:
        if company_type not in COMPANY_TYPES:
            raise HTTPException(status_code=400, detail=f"Invalid company_type")
        query = query.where(Company.company_type == company_type)

    if stage:
        if stage not in PIPELINE_STAGES:
            raise HTTPException(status_code=400, detail=f"Invalid stage")
        query = query.where(Company.pipeline_stage == stage)

    if search:
        pattern = f"%{search}%"
        query = query.where(
            or_(
                Company.company_name.ilike(pattern),
                Company.contact_name.ilike(pattern),
                Company.email.ilike(pattern),
            )
        )

    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_result.scalar() or 0

    query = query.order_by(Company.updated_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    companies = result.scalars().all()

    return PaginatedResponse(
        items=[CompanyResponse.model_validate(c) for c in companies],
        total=total,
        page=page,
        page_size=page_size,
        pages=max(1, math.ceil(total / page_size)),
    )


@router.post("", response_model=CompanyResponse, status_code=status.HTTP_201_CREATED)
async def create_company(
    payload: CompanyCreate,
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    if payload.pipeline_stage not in PIPELINE_STAGES:
        raise HTTPException(status_code=400, detail=f"Invalid pipeline_stage")
    if payload.company_type not in COMPANY_TYPES:
        raise HTTPException(status_code=400, detail=f"Invalid company_type")

    company = Company(workspace_id=workspace.id, **payload.model_dump())
    db.add(company)
    await db.flush()
    return company


@router.get("/{company_id}", response_model=CompanyResponse)
async def get_company(
    company_id: str,
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    return await _get_company_or_404(company_id, workspace.id, db)


@router.put("/{company_id}", response_model=CompanyResponse)
async def update_company(
    company_id: str,
    payload: CompanyUpdate,
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    company = await _get_company_or_404(company_id, workspace.id, db)
    update_data = payload.model_dump(exclude_unset=True)

    if "pipeline_stage" in update_data and update_data["pipeline_stage"] not in PIPELINE_STAGES:
        raise HTTPException(status_code=400, detail="Invalid pipeline_stage")
    if "company_type" in update_data and update_data["company_type"] not in COMPANY_TYPES:
        raise HTTPException(status_code=400, detail="Invalid company_type")

    for field, value in update_data.items():
        setattr(company, field, value)
    return company


@router.delete("/{company_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_company(
    company_id: str,
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    company = await _get_company_or_404(company_id, workspace.id, db)
    await db.delete(company)


@router.post("/{company_id}/enrich", response_model=CompanyResponse)
async def enrich_company(
    company_id: str,
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    company = await _get_company_or_404(company_id, workspace.id, db)
    enrichment = await ai_agent.enrich_client(
        company_name=company.company_name,
        website=company.website,
    )
    company.enrichment_data = enrichment
    if not company.industry and enrichment.get("industry"):
        company.industry = enrichment["industry"]
    return company


@router.put("/{company_id}/stage", response_model=CompanyResponse)
async def update_company_stage(
    company_id: str,
    payload: PipelineStageUpdate,
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    if payload.pipeline_stage not in PIPELINE_STAGES:
        raise HTTPException(status_code=400, detail="Invalid pipeline_stage")
    company = await _get_company_or_404(company_id, workspace.id, db)
    company.pipeline_stage = payload.pipeline_stage
    company.last_contacted = datetime.now(timezone.utc)
    return company
