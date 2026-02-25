"""Products router — catalog management."""

import logging
import math
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_workspace
from app.models.database import Product, StockMovement, Warehouse, Workspace, get_db
from app.models.schemas import (
    PaginatedResponse,
    ProductCreate,
    ProductResponse,
    ProductUpdate,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/products", tags=["products"])


async def _get_product_or_404(product_id: str, workspace_id: str, db: AsyncSession) -> Product:
    result = await db.execute(
        select(Product).where(Product.id == product_id, Product.workspace_id == workspace_id)
    )
    product = result.scalar_one_or_none()
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


async def _get_stock(product_id: str, workspace_id: str, db: AsyncSession) -> tuple[float, float]:
    """Return (on_hand, reserved) for a product across all warehouses."""
    on_hand_result = await db.execute(
        select(func.coalesce(func.sum(StockMovement.quantity_delta), 0)).where(
            StockMovement.product_id == product_id,
            StockMovement.workspace_id == workspace_id,
        )
    )
    on_hand = float(on_hand_result.scalar() or 0)

    # Reserved = sum of confirmed/partially_fulfilled sales order items
    # (imported inline to avoid circular imports)
    from app.models.database import SalesOrder, SalesOrderItem
    reserved_result = await db.execute(
        select(func.coalesce(func.sum(SalesOrderItem.quantity - SalesOrderItem.fulfilled_quantity), 0))
        .join(SalesOrder, SalesOrderItem.order_id == SalesOrder.id)
        .where(
            SalesOrderItem.product_id == product_id,
            SalesOrder.workspace_id == workspace_id,
            SalesOrder.status.in_(["confirmed", "partially_fulfilled"]),
        )
    )
    reserved = max(0.0, float(reserved_result.scalar() or 0))
    return on_hand, reserved


@router.get("/low-stock", response_model=list[ProductResponse])
async def get_low_stock(
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    """Return active products that are at or below their reorder level."""
    result = await db.execute(
        select(Product).where(
            Product.workspace_id == workspace.id,
            Product.is_active == True,
            Product.track_inventory == True,
        )
    )
    products = result.scalars().all()

    low_stock = []
    for p in products:
        on_hand, reserved = await _get_stock(p.id, workspace.id, db)
        if on_hand <= p.reorder_level:
            resp = ProductResponse.model_validate(p)
            resp.stock_on_hand = on_hand
            resp.stock_available = max(0.0, on_hand - reserved)
            low_stock.append(resp)
    return low_stock


@router.get("/{product_id}/stock", response_model=dict)
async def get_product_stock(
    product_id: str,
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    """Current stock per warehouse for a product."""
    await _get_product_or_404(product_id, workspace.id, db)

    # Per-warehouse breakdown
    warehouses_result = await db.execute(
        select(Warehouse).where(Warehouse.workspace_id == workspace.id)
    )
    warehouses = warehouses_result.scalars().all()

    breakdown = []
    for wh in warehouses:
        wh_on_hand_result = await db.execute(
            select(func.coalesce(func.sum(StockMovement.quantity_delta), 0)).where(
                StockMovement.product_id == product_id,
                StockMovement.warehouse_id == wh.id,
            )
        )
        wh_on_hand = float(wh_on_hand_result.scalar() or 0)
        breakdown.append({"warehouse_id": wh.id, "warehouse_name": wh.name, "on_hand": wh_on_hand})

    on_hand, reserved = await _get_stock(product_id, workspace.id, db)
    return {
        "product_id": product_id,
        "on_hand": on_hand,
        "reserved": reserved,
        "available": max(0.0, on_hand - reserved),
        "by_warehouse": breakdown,
    }


@router.get("", response_model=PaginatedResponse)
async def list_products(
    search: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    active_only: bool = Query(True),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    query = select(Product).where(Product.workspace_id == workspace.id)

    if active_only:
        query = query.where(Product.is_active == True)
    if category:
        query = query.where(Product.category.ilike(f"%{category}%"))
    if search:
        pattern = f"%{search}%"
        query = query.where(
            or_(Product.name.ilike(pattern), Product.sku.ilike(pattern), Product.description.ilike(pattern))
        )

    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_result.scalar() or 0

    query = query.order_by(Product.name.asc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    products = result.scalars().all()

    items = []
    for p in products:
        on_hand, reserved = await _get_stock(p.id, workspace.id, db)
        resp = ProductResponse.model_validate(p)
        resp.stock_on_hand = on_hand
        resp.stock_available = max(0.0, on_hand - reserved)
        items.append(resp)

    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        pages=max(1, math.ceil(total / page_size)),
    )


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    payload: ProductCreate,
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    product = Product(workspace_id=workspace.id, **payload.model_dump())
    db.add(product)
    await db.flush()
    resp = ProductResponse.model_validate(product)
    resp.stock_on_hand = 0.0
    resp.stock_available = 0.0
    return resp


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: str,
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    product = await _get_product_or_404(product_id, workspace.id, db)
    on_hand, reserved = await _get_stock(product_id, workspace.id, db)
    resp = ProductResponse.model_validate(product)
    resp.stock_on_hand = on_hand
    resp.stock_available = max(0.0, on_hand - reserved)
    return resp


@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: str,
    payload: ProductUpdate,
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    product = await _get_product_or_404(product_id, workspace.id, db)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(product, field, value)
    on_hand, reserved = await _get_stock(product_id, workspace.id, db)
    resp = ProductResponse.model_validate(product)
    resp.stock_on_hand = on_hand
    resp.stock_available = max(0.0, on_hand - reserved)
    return resp


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def deactivate_product(
    product_id: str,
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    """Soft-delete (deactivate) a product."""
    product = await _get_product_or_404(product_id, workspace.id, db)
    product.is_active = False
