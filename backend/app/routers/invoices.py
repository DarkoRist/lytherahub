"""Invoice router — tracking, reminders, stats, and cash-flow forecasting."""

import logging
import math
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.main import limiter
from app.models.database import Client, Invoice, User, get_db
from app.models.schemas import (
    CashFlowForecastResponse,
    InvoiceCreate,
    InvoiceResponse,
    InvoiceStatsResponse,
    InvoiceUpdate,
    PaginatedResponse,
)
from app.services import ai_agent

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/invoices", tags=["invoices"])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


async def _get_invoice_or_404(
    invoice_id: str, user_id: str, db: AsyncSession
) -> Invoice:
    """Fetch an invoice, raising 404 if not found or not owned."""
    result = await db.execute(
        select(Invoice).where(
            Invoice.id == invoice_id,
            Invoice.user_id == user_id,
        )
    )
    invoice = result.scalar_one_or_none()
    if invoice is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found",
        )
    return invoice


# ---------------------------------------------------------------------------
# GET /api/invoices/stats — dashboard numbers (before /{id} routes)
# ---------------------------------------------------------------------------


@router.get("/stats", response_model=InvoiceStatsResponse)
async def get_invoice_stats(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return invoice dashboard statistics for the current user."""
    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    base = select(Invoice).where(Invoice.user_id == user.id)

    # Total outstanding (sent + overdue)
    outstanding_result = await db.execute(
        select(func.coalesce(func.sum(Invoice.amount), 0.0)).where(
            Invoice.user_id == user.id,
            Invoice.status.in_(["sent", "overdue"]),
        )
    )
    total_outstanding = float(outstanding_result.scalar() or 0.0)

    # Total overdue amount
    overdue_result = await db.execute(
        select(func.coalesce(func.sum(Invoice.amount), 0.0)).where(
            Invoice.user_id == user.id,
            Invoice.status == "overdue",
        )
    )
    total_overdue = float(overdue_result.scalar() or 0.0)

    # Paid this month
    paid_month_result = await db.execute(
        select(func.coalesce(func.sum(Invoice.amount), 0.0)).where(
            Invoice.user_id == user.id,
            Invoice.status == "paid",
            Invoice.paid_date >= month_start,
        )
    )
    paid_this_month = float(paid_month_result.scalar() or 0.0)

    # Monthly revenue (all invoices issued this month regardless of status)
    monthly_rev_result = await db.execute(
        select(func.coalesce(func.sum(Invoice.amount), 0.0)).where(
            Invoice.user_id == user.id,
            Invoice.issued_date >= month_start,
        )
    )
    monthly_revenue = float(monthly_rev_result.scalar() or 0.0)

    # Total invoice count
    count_result = await db.execute(
        select(func.count()).select_from(base.subquery())
    )
    invoice_count = count_result.scalar() or 0

    # Overdue count
    overdue_count_result = await db.execute(
        select(func.count()).where(
            Invoice.user_id == user.id,
            Invoice.status == "overdue",
        )
    )
    overdue_count = overdue_count_result.scalar() or 0

    return InvoiceStatsResponse(
        total_outstanding=total_outstanding,
        total_overdue=total_overdue,
        paid_this_month=paid_this_month,
        monthly_revenue=monthly_revenue,
        invoice_count=invoice_count,
        overdue_count=overdue_count,
    )


# ---------------------------------------------------------------------------
# GET /api/invoices/forecast — 30-day cash flow forecast
# ---------------------------------------------------------------------------


@router.get("/forecast", response_model=list[CashFlowForecastResponse])
async def get_cashflow_forecast(
    days: int = Query(30, ge=7, le=90, description="Forecast window in days"),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return a cash-flow forecast based on outstanding invoices."""
    now = datetime.now(timezone.utc)
    end = now + timedelta(days=days)

    result = await db.execute(
        select(Invoice).where(
            Invoice.user_id == user.id,
            Invoice.status.in_(["sent", "overdue"]),
            Invoice.due_date <= end,
        )
    )
    invoices = result.scalars().all()

    invoices_data = [
        {
            "amount": inv.amount,
            "due_date": inv.due_date.strftime("%Y-%m-%d") if inv.due_date else "",
        }
        for inv in invoices
    ]

    forecast = await ai_agent.forecast_cashflow(invoices_data, days=days)
    return [CashFlowForecastResponse(**entry) for entry in forecast]


# ---------------------------------------------------------------------------
# GET /api/invoices — list invoices (filterable)
# ---------------------------------------------------------------------------


@router.get("", response_model=PaginatedResponse)
@limiter.limit("100/minute")
async def list_invoices(
    request: Request,
    status_filter: str | None = Query(None, alias="status", description="Filter by status"),
    client_id: str | None = Query(None, description="Filter by client ID"),
    from_date: str | None = Query(None, description="Issued after YYYY-MM-DD"),
    to_date: str | None = Query(None, description="Issued before YYYY-MM-DD"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List invoices with optional filters for status, client, and date range."""
    query = select(Invoice).where(Invoice.user_id == user.id)

    if status_filter:
        query = query.where(Invoice.status == status_filter)
    if client_id:
        query = query.where(Invoice.client_id == client_id)
    if from_date:
        try:
            from_dt = datetime.strptime(from_date, "%Y-%m-%d").replace(tzinfo=timezone.utc)
            query = query.where(Invoice.issued_date >= from_dt)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid from_date format. Use YYYY-MM-DD.",
            )
    if to_date:
        try:
            to_dt = datetime.strptime(to_date, "%Y-%m-%d").replace(tzinfo=timezone.utc) + timedelta(days=1)
            query = query.where(Invoice.issued_date < to_dt)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid to_date format. Use YYYY-MM-DD.",
            )

    # Count
    count_result = await db.execute(
        select(func.count()).select_from(query.subquery())
    )
    total = count_result.scalar() or 0

    # Paginate — newest first
    query = query.order_by(Invoice.issued_date.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)

    result = await db.execute(query)
    invoices = result.scalars().all()

    return PaginatedResponse(
        items=[InvoiceResponse.model_validate(inv) for inv in invoices],
        total=total,
        page=page,
        page_size=page_size,
        pages=max(1, math.ceil(total / page_size)),
    )


# ---------------------------------------------------------------------------
# POST /api/invoices — create invoice
# ---------------------------------------------------------------------------


@router.post("", response_model=InvoiceResponse, status_code=status.HTTP_201_CREATED)
async def create_invoice(
    payload: InvoiceCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new invoice."""
    # Validate client ownership if client_id provided
    if payload.client_id:
        client_result = await db.execute(
            select(Client).where(
                Client.id == payload.client_id,
                Client.user_id == user.id,
            )
        )
        if client_result.scalar_one_or_none() is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Client not found",
            )

    invoice = Invoice(
        user_id=user.id,
        client_id=payload.client_id,
        invoice_number=payload.invoice_number,
        amount=payload.amount,
        currency=payload.currency,
        status=payload.status,
        issued_date=payload.issued_date,
        due_date=payload.due_date,
        notes=payload.notes,
    )
    db.add(invoice)
    await db.flush()
    return invoice


# ---------------------------------------------------------------------------
# GET /api/invoices/{id} — invoice detail
# ---------------------------------------------------------------------------


@router.get("/{invoice_id}", response_model=InvoiceResponse)
async def get_invoice(
    invoice_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve a single invoice by ID."""
    invoice = await _get_invoice_or_404(invoice_id, user.id, db)
    return invoice


# ---------------------------------------------------------------------------
# PUT /api/invoices/{id} — update invoice (mark paid, change status, etc.)
# ---------------------------------------------------------------------------


@router.put("/{invoice_id}", response_model=InvoiceResponse)
async def update_invoice(
    invoice_id: str,
    payload: InvoiceUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update an invoice's mutable fields."""
    invoice = await _get_invoice_or_404(invoice_id, user.id, db)

    update_data = payload.model_dump(exclude_unset=True)

    # If marking as paid, auto-set paid_date if not provided
    if update_data.get("status") == "paid" and not update_data.get("paid_date") and not invoice.paid_date:
        update_data["paid_date"] = datetime.now(timezone.utc)

    for field, value in update_data.items():
        setattr(invoice, field, value)

    return invoice


# ---------------------------------------------------------------------------
# DELETE /api/invoices/{id}
# ---------------------------------------------------------------------------


@router.delete("/{invoice_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_invoice(
    invoice_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete an invoice. Only drafts and cancelled invoices can be deleted."""
    invoice = await _get_invoice_or_404(invoice_id, user.id, db)

    if invoice.status not in ("draft", "cancelled"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only draft or cancelled invoices can be deleted",
        )

    await db.delete(invoice)


# ---------------------------------------------------------------------------
# POST /api/invoices/{id}/remind — send payment reminder
# ---------------------------------------------------------------------------


@router.post("/{invoice_id}/remind")
async def send_reminder(
    invoice_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Generate and (optionally) send an AI payment reminder for an overdue invoice."""
    invoice = await _get_invoice_or_404(invoice_id, user.id, db)

    if invoice.status not in ("sent", "overdue"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reminders can only be sent for sent or overdue invoices",
        )

    # Determine client name — filter by user_id for defense in depth
    client_name = "Valued Customer"
    if invoice.client_id:
        client_result = await db.execute(
            select(Client).where(
                Client.id == invoice.client_id,
                Client.user_id == user.id,
            )
        )
        client = client_result.scalar_one_or_none()
        if client:
            client_name = client.contact_name or client.company_name

    days_overdue = max(0, (datetime.now(timezone.utc) - invoice.due_date).days)
    reminder_number = invoice.reminder_count + 1

    reminder_text = await ai_agent.generate_reminder_email(
        client_name=client_name,
        invoice_number=invoice.invoice_number,
        amount=invoice.amount,
        days_overdue=days_overdue,
        reminder_number=reminder_number,
    )

    # Update reminder count and mark overdue if past due date
    invoice.reminder_count = reminder_number
    if invoice.status == "sent" and days_overdue > 0:
        invoice.status = "overdue"

    return {
        "id": invoice.id,
        "invoice_number": invoice.invoice_number,
        "reminder_number": reminder_number,
        "reminder_text": reminder_text,
        "days_overdue": days_overdue,
    }
