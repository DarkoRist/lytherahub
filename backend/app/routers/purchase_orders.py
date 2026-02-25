"""Purchase Orders router — supplier orders and stock receiving."""

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
    PurchaseOrder,
    PurchaseOrderItem,
    StockMovement,
    User,
    Warehouse,
    Workspace,
    get_db,
)
from app.models.schemas import (
    PaginatedResponse,
    PurchaseOrderCreate,
    PurchaseOrderItemResponse,
    PurchaseOrderResponse,
    PurchaseOrderUpdate,
    ReceiveItemsRequest,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/purchase-orders", tags=["purchase-orders"])


async def _get_order_or_404(order_id: str, workspace_id: str, db: AsyncSession) -> PurchaseOrder:
    result = await db.execute(
        select(PurchaseOrder).where(PurchaseOrder.id == order_id, PurchaseOrder.workspace_id == workspace_id)
    )
    order = result.scalar_one_or_none()
    if order is None:
        raise HTTPException(status_code=404, detail="Purchase order not found")
    return order


async def _next_order_number(workspace_id: str, db: AsyncSession) -> str:
    result = await db.execute(
        select(func.count()).select_from(PurchaseOrder).where(PurchaseOrder.workspace_id == workspace_id)
    )
    count = (result.scalar() or 0) + 1
    return f"PO-{count:04d}"


async def _build_response(order: PurchaseOrder, db: AsyncSession) -> PurchaseOrderResponse:
    items_result = await db.execute(
        select(PurchaseOrderItem).where(PurchaseOrderItem.order_id == order.id)
    )
    items = items_result.scalars().all()

    item_responses = []
    for item in items:
        p_res = await db.execute(select(Product).where(Product.id == item.product_id))
        product = p_res.scalar_one_or_none()
        item_responses.append(
            PurchaseOrderItemResponse(
                id=item.id,
                product_id=item.product_id,
                quantity_ordered=item.quantity_ordered,
                quantity_received=item.quantity_received,
                unit_cost=item.unit_cost,
                product_name=product.name if product else None,
                product_sku=product.sku if product else None,
                subtotal=round(item.quantity_ordered * item.unit_cost, 2),
            )
        )

    supplier_name = None
    if order.supplier_id:
        s_res = await db.execute(select(Company.company_name).where(Company.id == order.supplier_id))
        supplier_name = s_res.scalar_one_or_none()

    resp = PurchaseOrderResponse.model_validate(order)
    resp.items = item_responses
    resp.supplier_name = supplier_name
    return resp


@router.get("", response_model=PaginatedResponse)
async def list_purchase_orders(
    status_filter: Optional[str] = Query(None, alias="status"),
    supplier_id: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    query = select(PurchaseOrder).where(PurchaseOrder.workspace_id == workspace.id)

    if status_filter:
        query = query.where(PurchaseOrder.status == status_filter)
    if supplier_id:
        query = query.where(PurchaseOrder.supplier_id == supplier_id)

    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_result.scalar() or 0

    query = query.order_by(PurchaseOrder.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    orders = result.scalars().all()

    items = [await _build_response(o, db) for o in orders]
    return PaginatedResponse(
        items=items, total=total, page=page, page_size=page_size,
        pages=max(1, math.ceil(total / page_size)),
    )


@router.post("", response_model=PurchaseOrderResponse, status_code=status.HTTP_201_CREATED)
async def create_purchase_order(
    payload: PurchaseOrderCreate,
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    if payload.supplier_id:
        s_res = await db.execute(
            select(Company).where(
                Company.id == payload.supplier_id,
                Company.workspace_id == workspace.id,
                Company.company_type.in_(["supplier", "both"]),
            )
        )
        if s_res.scalar_one_or_none() is None:
            raise HTTPException(status_code=400, detail="Supplier not found or not a supplier-type company")

    order_number = await _next_order_number(workspace.id, db)
    order = PurchaseOrder(
        workspace_id=workspace.id,
        order_number=order_number,
        supplier_id=payload.supplier_id,
        currency=payload.currency,
        expected_date=payload.expected_date,
        notes=payload.notes,
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
        if p_res.scalar_one_or_none() is None:
            raise HTTPException(status_code=400, detail=f"Product {item_data.product_id} not found")

        item = PurchaseOrderItem(
            order_id=order.id,
            product_id=item_data.product_id,
            quantity_ordered=item_data.quantity_ordered,
            quantity_received=0.0,
            unit_cost=item_data.unit_cost,
        )
        db.add(item)
        total += item_data.quantity_ordered * item_data.unit_cost

    order.total_amount = round(total, 2)
    await db.flush()
    return await _build_response(order, db)


@router.get("/{order_id}", response_model=PurchaseOrderResponse)
async def get_purchase_order(
    order_id: str,
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    order = await _get_order_or_404(order_id, workspace.id, db)
    return await _build_response(order, db)


@router.put("/{order_id}", response_model=PurchaseOrderResponse)
async def update_purchase_order(
    order_id: str,
    payload: PurchaseOrderUpdate,
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    order = await _get_order_or_404(order_id, workspace.id, db)
    if order.status not in ("draft",):
        raise HTTPException(status_code=400, detail="Only draft orders can be edited")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(order, field, value)
    return await _build_response(order, db)


@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_purchase_order(
    order_id: str,
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    order = await _get_order_or_404(order_id, workspace.id, db)
    if order.status not in ("draft",):
        raise HTTPException(status_code=400, detail="Only draft orders can be deleted")
    await db.delete(order)


@router.post("/{order_id}/send", response_model=PurchaseOrderResponse)
async def send_purchase_order(
    order_id: str,
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    order = await _get_order_or_404(order_id, workspace.id, db)
    if order.status != "draft":
        raise HTTPException(status_code=400, detail="Only draft orders can be sent")
    order.status = "sent"
    return await _build_response(order, db)


@router.post("/{order_id}/receive", response_model=PurchaseOrderResponse)
async def receive_items(
    order_id: str,
    payload: ReceiveItemsRequest,
    workspace: Workspace = Depends(get_current_workspace),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Receive stock from a purchase order. Creates positive StockMovements."""
    order = await _get_order_or_404(order_id, workspace.id, db)
    if order.status not in ("sent", "partially_received"):
        raise HTTPException(status_code=400, detail="Order must be sent before receiving")

    wh_result = await db.execute(
        select(Warehouse).where(Warehouse.id == payload.warehouse_id, Warehouse.workspace_id == workspace.id)
    )
    if wh_result.scalar_one_or_none() is None:
        raise HTTPException(status_code=404, detail="Warehouse not found")

    items_result = await db.execute(
        select(PurchaseOrderItem).where(PurchaseOrderItem.order_id == order.id)
    )
    items = {item.id: item for item in items_result.scalars().all()}

    all_received = True
    for entry in payload.items:
        item = items.get(entry["item_id"])
        if item is None:
            continue
        qty = float(entry["quantity_received"])
        qty = max(0.0, min(qty, item.quantity_ordered - item.quantity_received))

        if qty > 0:
            movement = StockMovement(
                workspace_id=workspace.id,
                product_id=item.product_id,
                warehouse_id=payload.warehouse_id,
                type="purchase",
                quantity_delta=qty,
                reference_type="purchase_order",
                reference_id=order.id,
                created_by=user.id,
            )
            db.add(movement)
            item.quantity_received += qty

        if item.quantity_received < item.quantity_ordered:
            all_received = False

    order.status = "received" if all_received else "partially_received"
    await db.flush()
    return await _build_response(order, db)
