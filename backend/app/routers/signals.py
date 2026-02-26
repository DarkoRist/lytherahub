"""Signals router — query-time business intelligence rules engine."""

from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_workspace
from app.models.database import (
    Company,
    Deal,
    Invoice,
    Product,
    PurchaseOrder,
    Signal,
    StockMovement,
    Warehouse,
    Workspace,
    generate_uuid,
    get_db,
)
from app.models.schemas import SignalResponse, SignalSummary

router = APIRouter(prefix="/api/signals", tags=["signals"])


# ---------------------------------------------------------------------------
# Signal generation rules
# ---------------------------------------------------------------------------


async def _generate_signals(workspace_id: str, db: AsyncSession) -> list[Signal]:
    now = datetime.utcnow()
    signals: list[Signal] = []

    # ── Rule 1: Overdue invoices ────────────────────────────────────────────
    result = await db.execute(
        select(Invoice).where(
            Invoice.user_id.in_(
                select(Company.workspace_id)  # just used to scope — filter via workspace-owned invoices
            )
        )
    )
    # We join via companies in workspace
    from app.models.database import User
    # Fetch invoices by checking company workspace
    inv_q = (
        select(Invoice)
        .join(Company, Invoice.company_id == Company.id, isouter=True)
        .where(
            Invoice.due_date < now,
            Invoice.status.in_(["draft", "sent"]),
            Company.workspace_id == workspace_id,
        )
    )
    inv_result = await db.execute(inv_q)
    overdue_invoices = inv_result.scalars().all()
    for inv in overdue_invoices:
        days_overdue = (now - inv.due_date).days
        signals.append(Signal(
            id=generate_uuid(),
            workspace_id=workspace_id,
            signal_type="overdue_invoice",
            severity="critical" if days_overdue > 14 else "warning",
            entity_type="invoice",
            entity_id=inv.id,
            title=f"Invoice {inv.invoice_number} overdue by {days_overdue} day{'s' if days_overdue != 1 else ''}",
            body=f"Amount: {inv.amount} {inv.currency}. Due: {inv.due_date.strftime('%d %b %Y')}",
        ))

    # ── Rule 2: Low stock ───────────────────────────────────────────────────
    products_q = select(Product).where(
        Product.workspace_id == workspace_id,
        Product.track_inventory == True,
        Product.is_active == True,
        Product.reorder_level > 0,
    )
    prod_result = await db.execute(products_q)
    products = prod_result.scalars().all()

    for product in products:
        stock_q = select(func.coalesce(func.sum(StockMovement.quantity_delta), 0)).where(
            StockMovement.product_id == product.id,
            StockMovement.workspace_id == workspace_id,
        )
        stock_result = await db.execute(stock_q)
        stock = stock_result.scalar() or 0.0
        if stock <= product.reorder_level:
            signals.append(Signal(
                id=generate_uuid(),
                workspace_id=workspace_id,
                signal_type="low_stock",
                severity="critical" if stock <= 0 else "warning",
                entity_type="product",
                entity_id=product.id,
                title=f"Low stock: {product.name}",
                body=f"On hand: {stock} {product.unit}. Reorder level: {product.reorder_level}.",
            ))

    # ── Rule 3: Stale deals (no update in 14+ days) ─────────────────────────
    stale_cutoff = now - timedelta(days=14)
    stale_deals_q = select(Deal).where(
        Deal.workspace_id == workspace_id,
        Deal.stage.notin_(["won", "lost"]),
        Deal.updated_at < stale_cutoff,
    )
    stale_result = await db.execute(stale_deals_q)
    stale_deals = stale_result.scalars().all()
    for deal in stale_deals:
        days_stale = (now - deal.updated_at).days
        signals.append(Signal(
            id=generate_uuid(),
            workspace_id=workspace_id,
            signal_type="stale_deal",
            severity="warning",
            entity_type="deal",
            entity_id=deal.id,
            title=f"Deal stale: {deal.title}",
            body=f"No activity in {days_stale} days. Stage: {deal.stage}.",
        ))

    # ── Rule 4: Late purchase order deliveries ──────────────────────────────
    late_po_q = select(PurchaseOrder).where(
        PurchaseOrder.workspace_id == workspace_id,
        PurchaseOrder.expected_date < now,
        PurchaseOrder.status.notin_(["received", "closed"]),
    )
    late_result = await db.execute(late_po_q)
    late_pos = late_result.scalars().all()
    for po in late_pos:
        days_late = (now - po.expected_date).days
        signals.append(Signal(
            id=generate_uuid(),
            workspace_id=workspace_id,
            signal_type="late_delivery",
            severity="warning",
            entity_type="purchase_order",
            entity_id=po.id,
            title=f"Late delivery: {po.order_number}",
            body=f"Expected {po.expected_date.strftime('%d %b %Y')} ({days_late} day{'s' if days_late != 1 else ''} overdue). Status: {po.status}.",
        ))

    # ── Rule 5: Stale companies in lead stage (30+ days) ────────────────────
    stale_co_cutoff = now - timedelta(days=30)
    stale_co_q = select(Company).where(
        Company.workspace_id == workspace_id,
        Company.pipeline_stage == "lead",
        Company.updated_at < stale_co_cutoff,
    )
    stale_co_result = await db.execute(stale_co_q)
    stale_cos = stale_co_result.scalars().all()
    for co in stale_cos:
        days_stale = (now - co.updated_at).days
        signals.append(Signal(
            id=generate_uuid(),
            workspace_id=workspace_id,
            signal_type="stale_company",
            severity="info",
            entity_type="company",
            entity_id=co.id,
            title=f"No follow-up: {co.company_name}",
            body=f"Still in lead stage after {days_stale} days. Consider reaching out.",
        ))

    return signals


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.get("", response_model=list[SignalResponse])
async def list_signals(
    include_dismissed: bool = False,
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    q = select(Signal).where(Signal.workspace_id == workspace.id)
    if not include_dismissed:
        q = q.where(Signal.is_dismissed == False)
    q = q.order_by(Signal.created_at.desc())
    result = await db.execute(q)
    return result.scalars().all()


@router.post("/refresh", response_model=list[SignalResponse])
async def refresh_signals(
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    """Re-run all rules and replace non-dismissed signals."""
    # Delete all non-dismissed signals
    await db.execute(
        delete(Signal).where(
            Signal.workspace_id == workspace.id,
            Signal.is_dismissed == False,
        )
    )
    await db.flush()

    # Generate fresh signals
    new_signals = await _generate_signals(workspace.id, db)
    for sig in new_signals:
        db.add(sig)
    await db.flush()

    result = await db.execute(
        select(Signal)
        .where(Signal.workspace_id == workspace.id, Signal.is_dismissed == False)
        .order_by(Signal.created_at.desc())
    )
    return result.scalars().all()


@router.get("/summary", response_model=SignalSummary)
async def signal_summary(
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Signal).where(Signal.workspace_id == workspace.id, Signal.is_dismissed == False)
    )
    sigs = result.scalars().all()
    return SignalSummary(
        total=len(sigs),
        critical=sum(1 for s in sigs if s.severity == "critical"),
        warning=sum(1 for s in sigs if s.severity == "warning"),
        info=sum(1 for s in sigs if s.severity == "info"),
        unread=sum(1 for s in sigs if not s.is_read),
    )


@router.post("/{signal_id}/read", response_model=SignalResponse)
async def mark_read(
    signal_id: str,
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Signal).where(Signal.id == signal_id, Signal.workspace_id == workspace.id)
    )
    signal = result.scalar_one_or_none()
    if not signal:
        raise HTTPException(status_code=404, detail="Signal not found")
    signal.is_read = True
    return signal


@router.post("/{signal_id}/dismiss", response_model=SignalResponse)
async def dismiss_signal(
    signal_id: str,
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Signal).where(Signal.id == signal_id, Signal.workspace_id == workspace.id)
    )
    signal = result.scalar_one_or_none()
    if not signal:
        raise HTTPException(status_code=404, detail="Signal not found")
    signal.is_dismissed = True
    signal.is_read = True
    return signal


@router.post("/dismiss-all", status_code=204)
async def dismiss_all(
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    await db.execute(
        delete(Signal).where(
            Signal.workspace_id == workspace.id,
            Signal.is_dismissed == False,
        )
    )
