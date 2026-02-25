"""Inventory router — stock ledger, adjustments, levels."""

import logging
import math
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user, get_current_workspace
from app.models.database import (
    Product,
    StockMovement,
    User,
    Warehouse,
    Workspace,
    get_db,
)
from app.models.schemas import (
    PaginatedResponse,
    StockAdjustmentRequest,
    StockLevelResponse,
    StockMovementResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/inventory", tags=["inventory"])


@router.get("", response_model=list[StockLevelResponse])
async def get_stock_levels(
    warehouse_id: Optional[str] = Query(None),
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    """Current stock levels for all tracked products per warehouse."""
    products_result = await db.execute(
        select(Product).where(
            Product.workspace_id == workspace.id,
            Product.is_active == True,
            Product.track_inventory == True,
        )
    )
    products = products_result.scalars().all()

    wh_query = select(Warehouse).where(Warehouse.workspace_id == workspace.id)
    if warehouse_id:
        wh_query = wh_query.where(Warehouse.id == warehouse_id)
    wh_result = await db.execute(wh_query)
    warehouses = wh_result.scalars().all()

    from app.models.database import SalesOrder, SalesOrderItem

    levels = []
    for product in products:
        for wh in warehouses:
            on_hand_res = await db.execute(
                select(func.coalesce(func.sum(StockMovement.quantity_delta), 0)).where(
                    StockMovement.product_id == product.id,
                    StockMovement.warehouse_id == wh.id,
                )
            )
            on_hand = float(on_hand_res.scalar() or 0)

            reserved_res = await db.execute(
                select(func.coalesce(func.sum(SalesOrderItem.quantity - SalesOrderItem.fulfilled_quantity), 0))
                .join(SalesOrder, SalesOrderItem.order_id == SalesOrder.id)
                .where(
                    SalesOrderItem.product_id == product.id,
                    SalesOrder.workspace_id == workspace.id,
                    SalesOrder.status.in_(["confirmed", "partially_fulfilled"]),
                )
            )
            reserved = max(0.0, float(reserved_res.scalar() or 0))
            available = max(0.0, on_hand - reserved)

            levels.append(
                StockLevelResponse(
                    product_id=product.id,
                    product_name=product.name,
                    sku=product.sku,
                    warehouse_id=wh.id,
                    warehouse_name=wh.name,
                    on_hand=on_hand,
                    reserved=reserved,
                    available=available,
                    reorder_level=product.reorder_level,
                    is_low_stock=on_hand <= product.reorder_level,
                )
            )

    return levels


@router.get("/movements", response_model=PaginatedResponse)
async def list_movements(
    product_id: Optional[str] = Query(None),
    warehouse_id: Optional[str] = Query(None),
    movement_type: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    """Full stock movement ledger with optional filters."""
    query = select(StockMovement).where(StockMovement.workspace_id == workspace.id)

    if product_id:
        query = query.where(StockMovement.product_id == product_id)
    if warehouse_id:
        query = query.where(StockMovement.warehouse_id == warehouse_id)
    if movement_type:
        query = query.where(StockMovement.type == movement_type)

    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_result.scalar() or 0

    query = query.order_by(StockMovement.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    movements = result.scalars().all()

    # Enrich with product/warehouse names
    items = []
    for m in movements:
        r = StockMovementResponse.model_validate(m)
        p_res = await db.execute(select(Product.name).where(Product.id == m.product_id))
        r.product_name = p_res.scalar_one_or_none()
        wh_res = await db.execute(select(Warehouse.name).where(Warehouse.id == m.warehouse_id))
        r.warehouse_name = wh_res.scalar_one_or_none()
        items.append(r)

    return PaginatedResponse(
        items=items, total=total, page=page, page_size=page_size,
        pages=max(1, math.ceil(total / page_size)),
    )


@router.get("/movements/{product_id}", response_model=list[StockMovementResponse])
async def get_product_movements(
    product_id: str,
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    """All movements for a specific product."""
    result = await db.execute(
        select(StockMovement)
        .where(StockMovement.product_id == product_id, StockMovement.workspace_id == workspace.id)
        .order_by(StockMovement.created_at.desc())
    )
    movements = result.scalars().all()
    items = []
    for m in movements:
        r = StockMovementResponse.model_validate(m)
        p_res = await db.execute(select(Product.name).where(Product.id == m.product_id))
        r.product_name = p_res.scalar_one_or_none()
        wh_res = await db.execute(select(Warehouse.name).where(Warehouse.id == m.warehouse_id))
        r.warehouse_name = wh_res.scalar_one_or_none()
        items.append(r)
    return items


@router.post("/adjustment", response_model=StockMovementResponse, status_code=status.HTTP_201_CREATED)
async def create_adjustment(
    payload: StockAdjustmentRequest,
    workspace: Workspace = Depends(get_current_workspace),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Manual stock adjustment (positive = add, negative = remove)."""
    # Validate product and warehouse belong to workspace
    p_result = await db.execute(
        select(Product).where(Product.id == payload.product_id, Product.workspace_id == workspace.id)
    )
    if p_result.scalar_one_or_none() is None:
        raise HTTPException(status_code=404, detail="Product not found")

    wh_result = await db.execute(
        select(Warehouse).where(Warehouse.id == payload.warehouse_id, Warehouse.workspace_id == workspace.id)
    )
    if wh_result.scalar_one_or_none() is None:
        raise HTTPException(status_code=404, detail="Warehouse not found")

    movement = StockMovement(
        workspace_id=workspace.id,
        product_id=payload.product_id,
        warehouse_id=payload.warehouse_id,
        type="adjustment",
        quantity_delta=payload.quantity_delta,
        reference_type="manual",
        notes=payload.notes,
        created_by=user.id,
    )
    db.add(movement)
    await db.flush()

    r = StockMovementResponse.model_validate(movement)
    p_name = await db.execute(select(Product.name).where(Product.id == payload.product_id))
    r.product_name = p_name.scalar_one_or_none()
    wh_name = await db.execute(select(Warehouse.name).where(Warehouse.id == payload.warehouse_id))
    r.warehouse_name = wh_name.scalar_one_or_none()
    return r
