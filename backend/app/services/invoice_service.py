"""Invoice tracking service — CRUD, overdue detection, and dashboard stats.

Uses SQLAlchemy async queries against the ``Invoice`` model.  When
``settings.DEMO_MODE`` is ``True`` the service seeds and returns realistic
mock data without touching any external payment system.
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

from sqlalchemy import func, select, update, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.database import Invoice
from app.models.schemas import InvoiceCreate, InvoiceUpdate

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Demo / mock data
# ---------------------------------------------------------------------------

_DEMO_USER_ID = "demo-user-001"


def _demo_invoices() -> list[dict[str, Any]]:
    """Return fresh demo invoices with dates relative to today."""
    now = datetime.now(timezone.utc)
    return [
        {
            "id": "demo-inv-001",
            "user_id": _DEMO_USER_ID,
            "client_id": "demo-client-001",
            "invoice_number": "INV-2025-001",
            "amount": 4800.00,
            "currency": "EUR",
            "status": "paid",
            "issued_date": (now - timedelta(days=45)).isoformat(),
            "due_date": (now - timedelta(days=15)).isoformat(),
            "paid_date": (now - timedelta(days=18)).isoformat(),
            "reminder_count": 0,
            "source": "manual",
            "notes": "Website redesign Phase 1 — TechCorp",
            "created_at": (now - timedelta(days=45)).isoformat(),
        },
        {
            "id": "demo-inv-002",
            "user_id": _DEMO_USER_ID,
            "client_id": "demo-client-002",
            "invoice_number": "INV-2025-002",
            "amount": 2400.00,
            "currency": "EUR",
            "status": "paid",
            "issued_date": (now - timedelta(days=30)).isoformat(),
            "due_date": (now - timedelta(days=5)).isoformat(),
            "paid_date": (now - timedelta(days=3)).isoformat(),
            "reminder_count": 0,
            "source": "stripe",
            "notes": "Monthly retainer — Greenfield Solutions",
            "created_at": (now - timedelta(days=30)).isoformat(),
        },
        {
            "id": "demo-inv-003",
            "user_id": _DEMO_USER_ID,
            "client_id": "demo-client-003",
            "invoice_number": "INV-2025-003",
            "amount": 7500.00,
            "currency": "EUR",
            "status": "sent",
            "issued_date": (now - timedelta(days=10)).isoformat(),
            "due_date": (now + timedelta(days=20)).isoformat(),
            "paid_date": None,
            "reminder_count": 0,
            "source": "manual",
            "notes": "Brand identity package — DesignHaus",
            "created_at": (now - timedelta(days=10)).isoformat(),
        },
        {
            "id": "demo-inv-004",
            "user_id": _DEMO_USER_ID,
            "client_id": "demo-client-001",
            "invoice_number": "INV-2025-004",
            "amount": 3200.00,
            "currency": "EUR",
            "status": "overdue",
            "issued_date": (now - timedelta(days=40)).isoformat(),
            "due_date": (now - timedelta(days=10)).isoformat(),
            "paid_date": None,
            "reminder_count": 2,
            "source": "manual",
            "notes": "Website redesign Phase 2 — TechCorp (overdue)",
            "created_at": (now - timedelta(days=40)).isoformat(),
        },
        {
            "id": "demo-inv-005",
            "user_id": _DEMO_USER_ID,
            "client_id": "demo-client-004",
            "invoice_number": "INV-2025-005",
            "amount": 1500.00,
            "currency": "EUR",
            "status": "draft",
            "issued_date": now.isoformat(),
            "due_date": (now + timedelta(days=30)).isoformat(),
            "paid_date": None,
            "reminder_count": 0,
            "source": "manual",
            "notes": "Consulting session — NovaTech (draft)",
            "created_at": now.isoformat(),
        },
    ]


# ---------------------------------------------------------------------------
# Service
# ---------------------------------------------------------------------------


class InvoiceService:
    """Manages invoice CRUD, overdue detection, and dashboard statistics.

    Args:
        db: An async SQLAlchemy session.
    """

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    # ------------------------------------------------------------------
    # Create
    # ------------------------------------------------------------------

    async def create_invoice(self, user_id: str, data: InvoiceCreate) -> Invoice:
        """Create a new invoice for the given user.

        Args:
            user_id: The owner user's ID.
            data: Validated invoice creation payload.

        Returns:
            The persisted ``Invoice`` ORM instance.
        """
        if settings.DEMO_MODE:
            logger.info("DEMO: create_invoice for user %s", user_id)
            # Return a transient ORM-like dict for demo callers
            demo = _demo_invoices()[0].copy()
            demo.update({
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "invoice_number": data.invoice_number,
                "amount": data.amount,
                "currency": data.currency,
                "status": data.status,
                "issued_date": data.issued_date,
                "due_date": data.due_date,
                "client_id": data.client_id,
                "notes": data.notes,
                "created_at": datetime.now(timezone.utc),
            })
            return demo  # type: ignore[return-value]

        invoice = Invoice(
            user_id=user_id,
            client_id=data.client_id,
            invoice_number=data.invoice_number,
            amount=data.amount,
            currency=data.currency,
            status=data.status,
            issued_date=data.issued_date,
            due_date=data.due_date,
            notes=data.notes,
        )
        self.db.add(invoice)
        await self.db.flush()
        await self.db.refresh(invoice)
        return invoice

    # ------------------------------------------------------------------
    # Read
    # ------------------------------------------------------------------

    async def get_invoices(
        self,
        user_id: str,
        status: Optional[str] = None,
        client_id: Optional[str] = None,
    ) -> list[Invoice]:
        """List invoices for a user with optional filters.

        Args:
            user_id: Owner user ID (multi-tenant filter).
            status: Optional status filter (``draft``, ``sent``, ``paid``,
                ``overdue``, ``cancelled``).
            client_id: Optional filter by associated client.

        Returns:
            A list of ``Invoice`` rows ordered by issued date descending.
        """
        if settings.DEMO_MODE:
            invoices = _demo_invoices()
            if status:
                invoices = [i for i in invoices if i["status"] == status]
            if client_id:
                invoices = [i for i in invoices if i["client_id"] == client_id]
            return invoices  # type: ignore[return-value]

        stmt = select(Invoice).where(Invoice.user_id == user_id)
        if status:
            stmt = stmt.where(Invoice.status == status)
        if client_id:
            stmt = stmt.where(Invoice.client_id == client_id)
        stmt = stmt.order_by(Invoice.issued_date.desc())

        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_invoice(self, invoice_id: str, user_id: str) -> Optional[Invoice]:
        """Fetch a single invoice by ID, scoped to a user.

        Args:
            invoice_id: The invoice primary key.
            user_id: Owner user ID (multi-tenant check).

        Returns:
            The ``Invoice`` or ``None`` if not found.
        """
        if settings.DEMO_MODE:
            for inv in _demo_invoices():
                if inv["id"] == invoice_id:
                    return inv  # type: ignore[return-value]
            return None

        stmt = select(Invoice).where(Invoice.id == invoice_id, Invoice.user_id == user_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_overdue_invoices(self, user_id: str) -> list[Invoice]:
        """Return all invoices past their due date that are not paid or cancelled.

        Args:
            user_id: Owner user ID.

        Returns:
            A list of overdue ``Invoice`` rows.
        """
        if settings.DEMO_MODE:
            return [i for i in _demo_invoices() if i["status"] == "overdue"]  # type: ignore[misc]

        now = datetime.now(timezone.utc)
        stmt = (
            select(Invoice)
            .where(
                Invoice.user_id == user_id,
                Invoice.due_date < now,
                Invoice.status.notin_(["paid", "cancelled"]),
            )
            .order_by(Invoice.due_date.asc())
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    # ------------------------------------------------------------------
    # Dashboard stats
    # ------------------------------------------------------------------

    async def get_dashboard_stats(self, user_id: str) -> dict[str, Any]:
        """Compute invoice dashboard statistics.

        Returns a dict with keys:
            - ``total_outstanding``: Sum of unpaid, non-cancelled invoices.
            - ``total_overdue``: Sum of overdue invoices.
            - ``paid_this_month``: Sum of invoices paid in the current calendar month.
            - ``monthly_revenue``: Same as ``paid_this_month`` (useful alias).
            - ``invoice_count``: Total number of invoices.
            - ``overdue_count``: Number of overdue invoices.
        """
        if settings.DEMO_MODE:
            invoices = _demo_invoices()
            now = datetime.now(timezone.utc)
            month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

            outstanding = sum(
                i["amount"] for i in invoices if i["status"] in ("sent", "overdue", "draft")
            )
            overdue_total = sum(i["amount"] for i in invoices if i["status"] == "overdue")
            overdue_count = sum(1 for i in invoices if i["status"] == "overdue")
            paid_this_month = sum(
                i["amount"]
                for i in invoices
                if i["status"] == "paid" and i.get("paid_date") and i["paid_date"] >= month_start.isoformat()
            )
            return {
                "total_outstanding": outstanding,
                "total_overdue": overdue_total,
                "paid_this_month": paid_this_month,
                "monthly_revenue": paid_this_month,
                "invoice_count": len(invoices),
                "overdue_count": overdue_count,
            }

        now = datetime.now(timezone.utc)
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        # Total outstanding (sent + overdue + draft)
        outstanding_stmt = select(func.coalesce(func.sum(Invoice.amount), 0.0)).where(
            Invoice.user_id == user_id,
            Invoice.status.in_(["sent", "overdue", "draft"]),
        )
        outstanding_result = await self.db.execute(outstanding_stmt)
        total_outstanding = float(outstanding_result.scalar_one())

        # Total overdue amount + count
        overdue_amount_stmt = select(func.coalesce(func.sum(Invoice.amount), 0.0)).where(
            Invoice.user_id == user_id,
            Invoice.due_date < now,
            Invoice.status.notin_(["paid", "cancelled"]),
        )
        overdue_amount_result = await self.db.execute(overdue_amount_stmt)
        total_overdue = float(overdue_amount_result.scalar_one())

        overdue_count_stmt = select(func.count(Invoice.id)).where(
            Invoice.user_id == user_id,
            Invoice.due_date < now,
            Invoice.status.notin_(["paid", "cancelled"]),
        )
        overdue_count_result = await self.db.execute(overdue_count_stmt)
        overdue_count = int(overdue_count_result.scalar_one())

        # Paid this month
        paid_stmt = select(func.coalesce(func.sum(Invoice.amount), 0.0)).where(
            Invoice.user_id == user_id,
            Invoice.status == "paid",
            Invoice.paid_date >= month_start,
        )
        paid_result = await self.db.execute(paid_stmt)
        paid_this_month = float(paid_result.scalar_one())

        # Total invoice count
        count_stmt = select(func.count(Invoice.id)).where(Invoice.user_id == user_id)
        count_result = await self.db.execute(count_stmt)
        invoice_count = int(count_result.scalar_one())

        return {
            "total_outstanding": total_outstanding,
            "total_overdue": total_overdue,
            "paid_this_month": paid_this_month,
            "monthly_revenue": paid_this_month,
            "invoice_count": invoice_count,
            "overdue_count": overdue_count,
        }

    # ------------------------------------------------------------------
    # Update
    # ------------------------------------------------------------------

    async def update_invoice(
        self,
        invoice_id: str,
        user_id: str,
        updates: InvoiceUpdate,
    ) -> Optional[Invoice]:
        """Update fields on an existing invoice.

        Args:
            invoice_id: The invoice primary key.
            user_id: Owner user ID (multi-tenant check).
            updates: Validated update payload — only non-``None`` fields
                are applied.

        Returns:
            The updated ``Invoice`` or ``None`` if not found.
        """
        if settings.DEMO_MODE:
            logger.info("DEMO: update_invoice(%s)", invoice_id)
            for inv in _demo_invoices():
                if inv["id"] == invoice_id:
                    patch = updates.model_dump(exclude_none=True)
                    inv.update(patch)
                    return inv  # type: ignore[return-value]
            return None

        invoice = await self.get_invoice(invoice_id, user_id)
        if invoice is None:
            return None

        patch = updates.model_dump(exclude_none=True)
        if not patch:
            return invoice

        stmt = (
            update(Invoice)
            .where(Invoice.id == invoice_id, Invoice.user_id == user_id)
            .values(**patch)
        )
        await self.db.execute(stmt)
        await self.db.flush()
        await self.db.refresh(invoice)
        return invoice

    # ------------------------------------------------------------------
    # Delete
    # ------------------------------------------------------------------

    async def delete_invoice(self, invoice_id: str, user_id: str) -> bool:
        """Delete an invoice by ID.

        Args:
            invoice_id: The invoice primary key.
            user_id: Owner user ID (multi-tenant check).

        Returns:
            ``True`` if the row was deleted, ``False`` if not found.
        """
        if settings.DEMO_MODE:
            logger.info("DEMO: delete_invoice(%s)", invoice_id)
            return any(i["id"] == invoice_id for i in _demo_invoices())

        stmt = delete(Invoice).where(Invoice.id == invoice_id, Invoice.user_id == user_id)
        result = await self.db.execute(stmt)
        await self.db.flush()
        return result.rowcount > 0  # type: ignore[union-attr]
