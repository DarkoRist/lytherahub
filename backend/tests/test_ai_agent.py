"""Tests for AI agent service — all AI methods with demo fallback responses."""

import pytest

from app.services.ai_agent import (
    classify_email,
    summarize_email,
    draft_reply,
    generate_daily_briefing,
    parse_command,
)


@pytest.mark.asyncio
class TestEmailClassification:
    async def test_classify_invoice_email(self):
        result = await classify_email(
            subject="Invoice #1234 Payment Reminder",
            body="Please pay the outstanding invoice of €5,000.",
            from_addr="billing@company.com",
        )
        assert "category" in result
        assert result["category"] in ("invoice", "urgent", "client", "newsletter", "spam", "other")
        assert "needs_reply" in result

    async def test_classify_urgent_email(self):
        result = await classify_email(
            subject="URGENT: Server is down",
            body="Our production server is not responding. Please check ASAP.",
            from_addr="ops@company.com",
        )
        assert result["category"] == "urgent"
        assert result["needs_reply"] is True

    async def test_classify_newsletter(self):
        result = await classify_email(
            subject="TechCrunch Newsletter — Weekly Digest",
            body="This week in tech... Click to unsubscribe at the bottom.",
            from_addr="newsletter@techcrunch.com",
        )
        assert result["category"] == "newsletter"
        assert result["needs_reply"] is False


@pytest.mark.asyncio
class TestEmailSummarization:
    async def test_summarize_email(self):
        result = await summarize_email(
            subject="Partnership Proposal",
            body="Hi, we'd like to discuss a partnership for our cloud services.",
        )
        assert isinstance(result, str)
        assert len(result) > 0


@pytest.mark.asyncio
class TestDraftReply:
    async def test_draft_reply(self):
        result = await draft_reply(
            subject="Meeting Request",
            body="Can we schedule a call for next week?",
            from_name="Hans Mueller",
            user_name="Darko",
        )
        assert isinstance(result, str)
        assert len(result) > 0


@pytest.mark.asyncio
class TestDailyBriefing:
    async def test_generate_briefing(self):
        result = await generate_daily_briefing(
            email_count=12,
            urgent_count=2,
            today_meetings=3,
            overdue_invoices=8500.0,
            pending_tasks=6,
            user_name="Darko",
        )
        assert isinstance(result, dict)
        assert "greeting" in result or "summary" in result or "priorities" in result


@pytest.mark.asyncio
class TestCommandBar:
    async def test_parse_command(self):
        result = await parse_command("Show me overdue invoices")
        assert isinstance(result, dict)
        assert "action" in result or "message" in result

    async def test_parse_unknown_command(self):
        result = await parse_command("What is the meaning of life?")
        assert isinstance(result, dict)
