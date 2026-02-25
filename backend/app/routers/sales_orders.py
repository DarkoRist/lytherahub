"""Sales Orders router — creation, confirmation, fulfillment."""

import logging
import math
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user, get_current_workspace
from app.models.database import (
    Company,
    Product,
    SalesOrder,
    SalesOrderItem,
    StockMovement,
    User,
    Warehouse,
    Workspace,
    get_db,
)
from app.models.schemas import (
    FulfillOrderRequest,
    PaginatedResponse,
    SalesOrderCreate,
    SalesOrderItemResponse,
    SalesOrderResponse,
    SalesOrderUpdate,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/sales-orders", tags=["sales-orders"])

SO_STATUSES = ["draft", "confirmed", "partially_fulfilled", "fulfilled", "cancelled"]


async def _get_order_or_404(order_id: str, workspace_id: str, db: AsyncSession) -> SalesOrder:
    result = await db.execute(
        select(SalesOrder).where(SalesOrder.id == order_id, SalesOrder.workspace_id == workspace_id)
    )
    order = result.scalar_one_or_none()
    if order is None:
        raise HTTPException(status_code=404, detail="Sales order not found")
    return order


async def _next_order_number(workspace_id: str, db: AsyncSession) -> str:
    result = await db.execute(
        select(func.count()).select_from(SalesOrder).where(SalesOrder.workspace_id == workspace_id)
    )
    count = (result.scalar() or 0) + 1
    return f"SO-{count:04d}"


async def _build_response(order: SalesOrder, db: AsyncSession) -> SalesOrderResponse:
    items_result = await db.execute(
        select(SalesOrderItem).where(SalesOrderItem.order_id == order.id)
    )
    items = items_result.scalars().all()

    item_responses = []
    for item in items:
        p_res = await db.execute(select(Product).where(Product.id == item.product_id))
        product = p_res.scalar_one_or_none()
        subtotal = item.quantity * item.unit_price * (1 - item.discount / 100)
        item_responses.append(
            SalesOrderItemResponse(
                id=item.id,
                product_id=item.product_id,
                quantity=item.quantity,
                unit_price=item.unit_price,
                discount=item.discount,
                fulfilled_quantity=item.fulfilled_quantity,
                product_name=product.name if product else None,
                product_sku=product.sku if product else None,
                subtotal=round(subtotal, 2),
            )
        )

    company_name = None
    if order.company_id:
        c_res = await db.execute(select(Company.company_name).where(Company.id == order.company_id))
        company_name = c_res.scalar_one_or_none()

    resp = SalesOrderResponse.model_validate(order)
    resp.items = item_responses
    resp.company_name = company_name
    return resp


@router.get("", response_model=PaginatedResponse)
async def list_sales_orders(
    status_filter: Optional[str] = Query(None, alias="status"),
    company_id: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    query = select(SalesOrder).where(SalesOrder.workspace_id == workspace.id)

    if status_filter:
        query = query.where(SalesOrder.status == status_filter)
    if company_id:
        query = query.where(SalesOrder.company_id == company_id)

    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_result.scalar() or 0

    query = query.order_by(SalesOrder.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    orders = result.scalars().all()

    items = [await _build_response(o, db) for o in orders]
    return PaginatedResponse(
        items=items, total=total, page=page, page_size=page_size,
        pages=max(1, math.ceil(total / page_size)),
    )


@router.post("", response_model=SalesOrderResponse, status_code=status.HTTP_201_CREATED)
async def create_sales_order(
    payload: SalesOrderCreate,
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    order_number = await _next_order_number(workspace.id, db)

    order = SalesOrder(
        workspace_id=workspace.id,
        order_number=order_number,
        company_id=payload.company_id,
        deal_id=payload.deal_id,
        currency=payload.currency,
        notes=payload.notes,
        due_date=payload.due_date,
        status="draft",
        total_amount=0.0,
    )
    db.add(order)
    await db.flush()

    total = 0.0
    for item_data in payload.items:
        p_res = await db.execute(
            select(Product).where(Product.id == item_data.product_id, Product.workspace_id == workspace.id)
        )
        product = p_res.scalar_one_or_none()
        if product is None:
            raise HTTPException(status_code=400, detail=f"Product {item_data.product_id} not found")

        item = SalesOrderItem(
            order_id=order.id,
            product_id=item_data.product_id,
            quantity=item_data.quantity,
            unit_price=item_data.unit_price,
            discount=item_data.discount,
            fulfilled_quantity=0.0,
        )
        db.add(item)
        total += item_data.quantity * item_data.unit_price * (1 - item_data.discount / 100)

    order.total_amount = round(total, 2)
    await db.flush()
    return await _build_response(order, db)


@router.get("/{order_id}", response_model=SalesOrderResponse)
async def get_sales_order(
    order_id: str,
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    order = await _get_order_or_404(order_id, workspace.id, db)
    return await _build_response(order, db)


@router.put("/{order_id}", response_model=SalesOrderResponse)
async def update_sales_order(
    order_id: str,
    payload: SalesOrderUpdate,
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    order = await _get_order_or_404(order_id, workspace.id, db)
    if order.status != "draft":
        raise HTTPException(status_code=400, detail="Only draft orders can be edited")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(order, field, value)
    return await _build_response(order, db)


@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_sales_order(
    order_id: str,
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    order = await _get_order_or_404(order_id, workspace.id, db)
    if order.status == "fulfilled":
        raise HTTPException(status_code=400, detail="Cannot cancel a fulfilled order")
    order.status = "cancelled"


@router.post("/{order_id}/confirm", response_model=SalesOrderResponse)
async def confirm_sales_order(
    order_id: str,
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    order = await _get_order_or_404(order_id, workspace.id, db)
    if order.status != "draft":
        raise HTTPException(status_code=400, detail="Only draft orders can be confirmed")
    order.status = "confirmed"
    return await _build_response(order, db)


@router.post("/{order_id}/fulfill", response_model=SalesOrderResponse)
async def fulfill_sales_order(
    order_id: str,
    payload: FulfillOrderRequest,
    workspace: Workspace = Depends(get_current_workspace),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Fulfill order (fully or partially). Creates stock movements."""
    order = await _get_order_or_404(order_id, workspace.id, db)
    if order.status not in ("confirmed", "partially_fulfilled"):
        raise HTTPException(status_code=400, detail="Order must be confirmed before fulfillment")

    # Validate warehouse
    wh_result = await db.execute(
        select(Warehouse).where(Warehouse.id == payload.warehouse_id, Warehouse.workspace_id == workspace.id)
    )
    if wh_result.scalar_one_or_none() is None:
        raise HTTPException(status_code=404, detail="Warehouse not found")

    items_result = await db.execute(
        select(SalesOrderItem).where(SalesOrderItem.order_id == order.id)
    )
    items = items_result.scalars().all()

    # Build qty map from request (or default: fulfill all remaining)
    qty_map: dict[str, float] = {}
    if payload.items:
        for entry in payload.items:
            qty_map[entry["item_id"]] = float(entry["quantity"])

    all_fulfilled = True
    for item in items:
        qty_to_fulfill = qty_map.get(item.id, item.quantity - item.fulfilled_quantity) if qty_map else (item.quantity - item.fulfilled_quantity)
        qty_to_fulfill = max(0.0, min(qty_to_fulfill, item.quantity - item.fulfilled_quantity))

        if qty_to_fulfill > 0:
            movement = StockMovement(
                workspace_id=workspace.id,
                product_id=item.product_id,
                warehouse_id=payload.warehouse_id,
                type="sale",
                quantity_delta=-qty_to_fulfill,
                reference_type="sales_order",
                reference_id=order.id,
                created_by=user.id,
            )
            db.add(movement)
            item.fulfilled_quantity += qty_to_fulfill

        if item.fulfilled_quantity < item.quantity:
            all_fulfilled = False

    order.status = "fulfilled" if all_fulfilled else "partially_fulfilled"
    await db.flush()
    return await _build_response(order, db)
