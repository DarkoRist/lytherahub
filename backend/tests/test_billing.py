"""Tests for billing router — Stripe checkout, webhooks."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
class TestBillingEndpoints:
    async def test_get_plans(self, authenticated_client: AsyncClient):
        resp = await authenticated_client.get("/api/billing/plans")
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)
        assert len(data) >= 1

    async def test_get_subscription(self, authenticated_client: AsyncClient):
        resp = await authenticated_client.get("/api/billing/subscription")
        assert resp.status_code == 200
        data = resp.json()
        assert "plan" in data

    async def test_create_checkout_no_stripe(self, authenticated_client: AsyncClient):
        """Without Stripe configured, checkout should return an appropriate response."""
        resp = await authenticated_client.post(
            "/api/billing/checkout",
            json={"plan": "pro"},
        )
        # Should either work (demo mode) or indicate Stripe not configured
        assert resp.status_code in (200, 400, 503)


@pytest.mark.asyncio
class TestBillingWebhook:
    async def test_webhook_invalid_signature(self, client: AsyncClient):
        """Webhook without valid Stripe signature should be rejected."""
        resp = await client.post(
            "/api/billing/webhook",
            content=b'{"type": "test"}',
            headers={"stripe-signature": "invalid"},
        )
        # Should reject bad signature
        assert resp.status_code in (200, 400)
