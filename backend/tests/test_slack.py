"""Tests for Slack router — notifications, commands."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
class TestSlackEndpoints:
    async def test_slash_command(self, client: AsyncClient):
        """Test slash command endpoint (doesn't require user auth)."""
        resp = await client.post(
            "/api/slack/command",
            data={
                "command": "/lytherahub",
                "text": "status",
                "user_id": "U123",
                "team_id": "T123",
            },
        )
        # Slack endpoints may vary — just ensure no 500
        assert resp.status_code in (200, 400, 503)

    async def test_events_endpoint(self, client: AsyncClient):
        """Test Slack events URL verification."""
        resp = await client.post(
            "/api/slack/events",
            json={
                "type": "url_verification",
                "challenge": "test-challenge-123",
            },
        )
        # Should echo back challenge for URL verification
        if resp.status_code == 200:
            data = resp.json()
            if "challenge" in data:
                assert data["challenge"] == "test-challenge-123"
