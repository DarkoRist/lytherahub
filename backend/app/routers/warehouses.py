"""Warehouses router."""

import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_workspace
from app.models.database import Warehouse, Workspace, get_db
from app.models.schemas import WarehouseCreate, WarehouseResponse, WarehouseUpdate

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/warehouses", tags=["warehouses"])


async def _get_warehouse_or_404(warehouse_id: str, workspace_id: str, db: AsyncSession) -> Warehouse:
    result = await db.execute(
        select(Warehouse).where(Warehouse.id == warehouse_id, Warehouse.workspace_id == workspace_id)
    )
    wh = result.scalar_one_or_none()
    if wh is None:
        raise HTTPException(status_code=404, detail="Warehouse not found")
    return wh


@router.get("", response_model=list[WarehouseResponse])
async def list_warehouses(
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Warehouse).where(Warehouse.workspace_id == workspace.id).order_by(Warehouse.name)
    )
    return result.scalars().all()


@router.post("", response_model=WarehouseResponse, status_code=status.HTTP_201_CREATED)
async def create_warehouse(
    payload: WarehouseCreate,
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    if payload.is_default:
        # Unset existing default
        result = await db.execute(
            select(Warehouse).where(Warehouse.workspace_id == workspace.id, Warehouse.is_default == True)
        )
        for wh in result.scalars().all():
            wh.is_default = False

    warehouse = Warehouse(workspace_id=workspace.id, **payload.model_dump())
    db.add(warehouse)
    await db.flush()
    return warehouse


@router.put("/{warehouse_id}", response_model=WarehouseResponse)
async def update_warehouse(
    warehouse_id: str,
    payload: WarehouseUpdate,
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    warehouse = await _get_warehouse_or_404(warehouse_id, workspace.id, db)
    update_data = payload.model_dump(exclude_unset=True)

    if update_data.get("is_default"):
        result = await db.execute(
            select(Warehouse).where(Warehouse.workspace_id == workspace.id, Warehouse.is_default == True)
        )
        for wh in result.scalars().all():
            wh.is_default = False

    for field, value in update_data.items():
        setattr(warehouse, field, value)
    return warehouse


@router.delete("/{warehouse_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_warehouse(
    warehouse_id: str,
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    warehouse = await _get_warehouse_or_404(warehouse_id, workspace.id, db)
    if warehouse.is_default:
        raise HTTPException(status_code=400, detail="Cannot delete the default warehouse")
    await db.delete(warehouse)
