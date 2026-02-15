"""Tests for invoice router — CRUD, stats, reminders, forecast."""

import pytest
from datetime import datetime, timedelta, timezone
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database import Client, Invoice


@pytest.fixture
async def sample_invoices(db_session: AsyncSession, test_user):
    """Create sample invoices with a client."""
    uid = test_user.id
    now = datetime.now(timezone.utc)

    client = Client(
        id="c-inv-1", user_id=uid, company_name="InvoiceCo",
        pipeline_stage="won", deal_value=50000,
    )
    db_session.add(client)
    await db_session.flush()

    invoices = [
        Invoice(
            id="inv-t1", user_id=uid, client_id="c-inv-1",
            invoice_number="INV-001", amount=5000, currency="EUR",
            status="paid", issued_date=now - timedelta(days=30),
            due_date=now - timedelta(days=15),
            paid_date=now - timedelta(days=16),
        ),
        Invoice(
            id="inv-t2", user_id=uid, client_id="c-inv-1",
            invoice_number="INV-002", amount=3000, currency="EUR",
            status="overdue", issued_date=now - timedelta(days=20),
            due_date=now - timedelta(days=5), reminder_count=2,
        ),
        Invoice(
            id="inv-t3", user_id=uid,
            invoice_number="INV-003", amount=8000, currency="EUR",
            status="sent", issued_date=now - timedelta(days=5),
            due_date=now + timedelta(days=10),
        ),
        Invoice(
            id="inv-t4", user_id=uid,
            invoice_number="INV-004", amount=2000, currency="EUR",
            status="draft", issued_date=now,
            due_date=now + timedelta(days=15),
        ),
    ]
    for inv in invoices:
        db_session.add(inv)
    await db_session.commit()
    return invoices


@pytest.mark.asyncio
class TestInvoiceList:
    async def test_list_invoices(self, authenticated_client: AsyncClient, sample_invoices):
        resp = await authenticated_client.get("/api/invoices")
        assert resp.status_code == 200
        data = resp.json()
        assert "items" in data
        assert len(data["items"]) == 4

    async def test_list_filter_status(self, authenticated_client: AsyncClient, sample_invoices):
        resp = await authenticated_client.get("/api/invoices?status=overdue")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["items"]) == 1
        assert data["items"][0]["status"] == "overdue"


@pytest.mark.asyncio
class TestInvoiceStats:
    async def test_get_stats(self, authenticated_client: AsyncClient, sample_invoices):
        resp = await authenticated_client.get("/api/invoices/stats")
        assert resp.status_code == 200
        data = resp.json()
        assert "total_outstanding" in data
        assert "total_overdue" in data
        assert data["total_overdue"] > 0


@pytest.mark.asyncio
class TestInvoiceCRUD:
    async def test_get_invoice(self, authenticated_client: AsyncClient, sample_invoices):
        resp = await authenticated_client.get("/api/invoices/inv-t1")
        assert resp.status_code == 200
        data = resp.json()
        assert data["invoice_number"] == "INV-001"
        assert data["status"] == "paid"

    async def test_get_invoice_not_found(self, authenticated_client: AsyncClient, sample_invoices):
        resp = await authenticated_client.get("/api/invoices/nonexistent")
        assert resp.status_code == 404

    async def test_create_invoice(self, authenticated_client: AsyncClient):
        now = datetime.now(timezone.utc)
        resp = await authenticated_client.post(
            "/api/invoices",
            json={
                "invoice_number": "INV-NEW",
                "amount": 7500,
                "currency": "EUR",
                "status": "draft",
                "issued_date": now.isoformat(),
                "due_date": (now + timedelta(days=14)).isoformat(),
            },
        )
        assert resp.status_code in (200, 201)
        data = resp.json()
        assert data["invoice_number"] == "INV-NEW"
        assert data["amount"] == 7500


@pytest.mark.asyncio
class TestInvoiceForecast:
    async def test_get_forecast(self, authenticated_client: AsyncClient, sample_invoices):
        resp = await authenticated_client.get("/api/invoices/forecast")
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, (dict, list))
