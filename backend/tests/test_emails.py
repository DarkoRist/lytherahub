"""Tests for email router — CRUD, classification, summarization, reply drafts."""

import pytest
from datetime import datetime, timezone
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database import Email


@pytest.fixture
async def sample_emails(db_session: AsyncSession, test_user):
    """Create sample emails for testing."""
    uid = test_user.id
    now = datetime.now(timezone.utc)

    emails = [
        Email(
            id="e-test-1", user_id=uid, gmail_id="gmail-1",
            from_addr="hans@techvision.de", to_addr="test@lytherahub.ai",
            subject="Partnership Proposal", snippet="Let's discuss...",
            body_preview="Hi, let's discuss partnership terms.",
            category="client", ai_summary="Hans wants to discuss partnership.",
            is_read=False, is_starred=True, needs_reply=True,
            received_at=now,
        ),
        Email(
            id="e-test-2", user_id=uid, gmail_id="gmail-2",
            from_addr="noreply@stripe.com", to_addr="test@lytherahub.ai",
            subject="Payment received: €3,200", snippet="Payment confirmation...",
            body_preview="You've received a payment of €3,200.",
            category="invoice", ai_summary="Payment received from RetailMax.",
            is_read=True, is_starred=False, needs_reply=False,
            received_at=now,
        ),
        Email(
            id="e-test-3", user_id=uid, gmail_id="gmail-3",
            from_addr="newsletter@techcrunch.com", to_addr="test@lytherahub.ai",
            subject="TechCrunch Daily", snippet="Today's top stories...",
            category="newsletter", is_read=True, needs_reply=False,
            received_at=now,
        ),
    ]
    for e in emails:
        db_session.add(e)
    await db_session.commit()
    return emails


@pytest.mark.asyncio
class TestEmailList:
    async def test_list_emails(self, authenticated_client: AsyncClient, sample_emails):
        resp = await authenticated_client.get("/api/emails")
        assert resp.status_code == 200
        data = resp.json()
        assert "items" in data
        assert len(data["items"]) == 3

    async def test_list_emails_filter_category(self, authenticated_client: AsyncClient, sample_emails):
        resp = await authenticated_client.get("/api/emails?category=client")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["items"]) == 1
        assert data["items"][0]["category"] == "client"

    async def test_list_emails_pagination(self, authenticated_client: AsyncClient, sample_emails):
        resp = await authenticated_client.get("/api/emails?page=1&per_page=2")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["items"]) == 2
        assert data["total"] == 3


@pytest.mark.asyncio
class TestEmailStats:
    async def test_get_stats(self, authenticated_client: AsyncClient, sample_emails):
        resp = await authenticated_client.get("/api/emails/stats")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 3
        assert data["unread"] == 1
        assert data["needs_reply"] == 1
        assert "by_category" in data
        assert data["by_category"]["client"] == 1


@pytest.mark.asyncio
class TestEmailDetail:
    async def test_get_email(self, authenticated_client: AsyncClient, sample_emails):
        resp = await authenticated_client.get("/api/emails/e-test-1")
        assert resp.status_code == 200
        data = resp.json()
        assert data["subject"] == "Partnership Proposal"
        assert data["is_starred"] is True

    async def test_get_email_not_found(self, authenticated_client: AsyncClient, sample_emails):
        resp = await authenticated_client.get("/api/emails/nonexistent")
        assert resp.status_code == 404


@pytest.mark.asyncio
class TestEmailClassify:
    async def test_classify_email(self, authenticated_client: AsyncClient, sample_emails):
        resp = await authenticated_client.post("/api/emails/e-test-1/classify")
        assert resp.status_code == 200
        data = resp.json()
        assert "category" in data


@pytest.mark.asyncio
class TestEmailSummarize:
    async def test_summarize_email(self, authenticated_client: AsyncClient, sample_emails):
        resp = await authenticated_client.post("/api/emails/e-test-1/summarize")
        assert resp.status_code == 200
        data = resp.json()
        assert "summary" in data


@pytest.mark.asyncio
class TestEmailDraftReply:
    async def test_draft_reply(self, authenticated_client: AsyncClient, sample_emails):
        resp = await authenticated_client.post("/api/emails/e-test-1/draft-reply")
        assert resp.status_code == 200
        data = resp.json()
        assert "draft" in data
