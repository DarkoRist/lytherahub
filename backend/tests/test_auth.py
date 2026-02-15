"""Tests for authentication — OAuth flow, JWT tokens, demo login."""

import pytest
import pytest_asyncio
from httpx import AsyncClient

from app.auth.jwt_handler import create_access_token, create_refresh_token, verify_token


# ---------------------------------------------------------------------------
# JWT token tests
# ---------------------------------------------------------------------------


class TestJWT:
    def test_create_access_token(self):
        token = create_access_token("user-123", "user@test.com")
        payload = verify_token(token)
        assert payload is not None
        assert payload["sub"] == "user-123"
        assert payload["email"] == "user@test.com"
        assert payload["type"] == "access"

    def test_create_refresh_token(self):
        token = create_refresh_token("user-123")
        payload = verify_token(token)
        assert payload is not None
        assert payload["sub"] == "user-123"
        assert payload["type"] == "refresh"

    def test_verify_invalid_token(self):
        payload = verify_token("invalid.token.here")
        assert payload is None

    def test_verify_tampered_token(self):
        token = create_access_token("user-123", "user@test.com")
        tampered = token[:-5] + "XXXXX"
        payload = verify_token(tampered)
        assert payload is None


# ---------------------------------------------------------------------------
# Auth endpoint tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
class TestAuthEndpoints:
    async def test_demo_login(self, client: AsyncClient):
        resp = await client.get("/api/auth/demo")
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"
        assert data["user"]["email"] == "demo@lytherahub.ai"

    async def test_demo_login_creates_user(self, client: AsyncClient):
        resp = await client.get("/api/auth/demo")
        assert resp.status_code == 200
        user = resp.json()["user"]
        assert user["name"] == "Darko (Demo)"
        assert user["plan"] == "pro"

    async def test_get_me_authenticated(self, authenticated_client: AsyncClient):
        resp = await authenticated_client.get("/api/auth/me")
        assert resp.status_code == 200
        data = resp.json()
        assert data["email"] == "test@lytherahub.ai"
        assert data["name"] == "Test User"

    async def test_get_me_unauthenticated(self, client: AsyncClient):
        resp = await client.get("/api/auth/me")
        assert resp.status_code in (401, 403)

    async def test_logout(self, authenticated_client: AsyncClient):
        resp = await authenticated_client.post("/api/auth/logout")
        assert resp.status_code == 200
        assert resp.json()["message"] == "Logged out successfully"

    async def test_google_login_not_configured(self, client: AsyncClient):
        resp = await client.get("/api/auth/google", follow_redirects=False)
        assert resp.status_code == 503

    async def test_refresh_token(self, client: AsyncClient):
        # First get a demo login to have a valid user
        demo_resp = await client.get("/api/auth/demo")
        refresh = demo_resp.json()["refresh_token"]

        resp = await client.post(
            "/api/auth/refresh", params={"refresh_token": refresh}
        )
        assert resp.status_code == 200
        assert "access_token" in resp.json()

    async def test_refresh_with_access_token_fails(self, authenticated_client: AsyncClient):
        from app.auth.jwt_handler import create_access_token
        bad_refresh = create_access_token("test-user-001", "test@lytherahub.ai")
        resp = await authenticated_client.post(
            "/api/auth/refresh", params={"refresh_token": bad_refresh}
        )
        assert resp.status_code == 401
