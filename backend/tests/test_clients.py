"""Tests for client/CRM router — CRUD, pipeline, enrichment, stale leads."""

import pytest
from datetime import datetime, timedelta, timezone
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database import Client


@pytest.fixture
async def sample_clients(db_session: AsyncSession, test_user):
    """Create sample clients across pipeline stages."""
    uid = test_user.id
    now = datetime.now(timezone.utc)

    clients = [
        Client(
            id="c-t1", user_id=uid, company_name="TechVision GmbH",
            contact_name="Hans Mueller", email="hans@techvision.de",
            industry="SaaS", pipeline_stage="negotiation", deal_value=45000,
            last_contacted=now - timedelta(days=1),
        ),
        Client(
            id="c-t2", user_id=uid, company_name="CloudFirst AG",
            contact_name="Anna Schmidt", email="anna@cloudfirst.ch",
            pipeline_stage="won", deal_value=32000,
            last_contacted=now - timedelta(days=3),
        ),
        Client(
            id="c-t3", user_id=uid, company_name="StaleLeadCo",
            contact_name="Stale User", email="stale@test.com",
            pipeline_stage="lead", deal_value=10000,
            last_contacted=now - timedelta(days=14),
        ),
        Client(
            id="c-t4", user_id=uid, company_name="LostDeal Inc",
            pipeline_stage="lost", deal_value=20000,
        ),
    ]
    for c in clients:
        db_session.add(c)
    await db_session.commit()
    return clients


@pytest.mark.asyncio
class TestClientList:
    async def test_list_clients(self, authenticated_client: AsyncClient, sample_clients):
        resp = await authenticated_client.get("/api/clients")
        assert resp.status_code == 200
        data = resp.json()
        assert "items" in data
        assert len(data["items"]) == 4

    async def test_list_search(self, authenticated_client: AsyncClient, sample_clients):
        resp = await authenticated_client.get("/api/clients?search=TechVision")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["items"]) >= 1
        assert "TechVision" in data["items"][0]["company_name"]


@pytest.mark.asyncio
class TestClientPipeline:
    async def test_get_pipeline(self, authenticated_client: AsyncClient, sample_clients):
        resp = await authenticated_client.get("/api/clients/pipeline")
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)
        # Should have all 6 pipeline stages
        stages = [s["stage"] for s in data]
        assert "lead" in stages
        assert "won" in stages
        assert "lost" in stages

    async def test_update_pipeline_stage(self, authenticated_client: AsyncClient, sample_clients):
        resp = await authenticated_client.patch(
            "/api/clients/c-t1/stage",
            json={"pipeline_stage": "won"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["pipeline_stage"] == "won"


@pytest.mark.asyncio
class TestClientCRUD:
    async def test_get_client(self, authenticated_client: AsyncClient, sample_clients):
        resp = await authenticated_client.get("/api/clients/c-t1")
        assert resp.status_code == 200
        data = resp.json()
        assert data["company_name"] == "TechVision GmbH"
        assert data["pipeline_stage"] == "negotiation"

    async def test_get_client_not_found(self, authenticated_client: AsyncClient, sample_clients):
        resp = await authenticated_client.get("/api/clients/nonexistent")
        assert resp.status_code == 404

    async def test_create_client(self, authenticated_client: AsyncClient):
        resp = await authenticated_client.post(
            "/api/clients",
            json={
                "company_name": "NewCo GmbH",
                "contact_name": "Jane Doe",
                "email": "jane@newco.de",
                "pipeline_stage": "lead",
                "deal_value": 15000,
            },
        )
        assert resp.status_code in (200, 201)
        data = resp.json()
        assert data["company_name"] == "NewCo GmbH"

    async def test_update_client(self, authenticated_client: AsyncClient, sample_clients):
        resp = await authenticated_client.put(
            "/api/clients/c-t1",
            json={
                "company_name": "TechVision GmbH Updated",
                "deal_value": 50000,
            },
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["company_name"] == "TechVision GmbH Updated"
        assert data["deal_value"] == 50000

    async def test_delete_client(self, authenticated_client: AsyncClient, sample_clients):
        resp = await authenticated_client.delete("/api/clients/c-t4")
        assert resp.status_code in (200, 204)


@pytest.mark.asyncio
class TestStaleLeads:
    async def test_stale_leads(self, authenticated_client: AsyncClient, sample_clients):
        resp = await authenticated_client.get("/api/clients/stale")
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)
        # StaleLeadCo was contacted 14 days ago in lead stage
        stale_names = [c["company_name"] for c in data]
        assert "StaleLeadCo" in stale_names


@pytest.mark.asyncio
class TestClientEnrichment:
    async def test_enrich_client(self, authenticated_client: AsyncClient, sample_clients):
        resp = await authenticated_client.post("/api/clients/c-t1/enrich")
        assert resp.status_code == 200
        data = resp.json()
        assert "enrichment_data" in data
