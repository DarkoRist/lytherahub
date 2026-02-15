"""Gmail API wrapper — fetches, sends, drafts, and searches emails.

Uses google-api-python-client for real Gmail interactions.  When
``settings.DEMO_MODE`` is ``True`` every method returns realistic mock
data so the whole frontend works without any Google credentials.
"""

from __future__ import annotations

import base64
import logging
from datetime import datetime, timedelta, timezone
from email.mime.text import MIMEText
from typing import Any, Optional

from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials

from app.config import settings

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Demo / mock data
# ---------------------------------------------------------------------------

_DEMO_EMAILS: list[dict[str, Any]] = [
    {
        "gmail_id": "demo_001",
        "from_addr": "sarah.chen@techcorp.io",
        "to_addr": "you@lytherahub.ai",
        "subject": "Q1 Contract Renewal — Signature Needed",
        "snippet": "Hi, please review the attached contract renewal for Q1. We'd love to continue our partnership...",
        "body_preview": (
            "Hi,\n\nPlease review the attached contract renewal for Q1. "
            "We'd love to continue our partnership and have adjusted the "
            "pricing per our last conversation.\n\nLooking forward to your "
            "reply.\n\nBest,\nSarah Chen\nTechCorp"
        ),
        "is_read": False,
        "is_starred": True,
        "received_at": (datetime.now(timezone.utc) - timedelta(hours=1)).isoformat(),
        "labels": ["INBOX", "IMPORTANT"],
    },
    {
        "gmail_id": "demo_002",
        "from_addr": "invoices@stripe.com",
        "to_addr": "you@lytherahub.ai",
        "subject": "Invoice #4821 — Payment Received",
        "snippet": "Payment of EUR 2,400.00 has been received for invoice #4821...",
        "body_preview": (
            "Payment of EUR 2,400.00 has been received for invoice #4821.\n\n"
            "Client: Greenfield Solutions\nDate: Today\n\n"
            "View details in your Stripe dashboard."
        ),
        "is_read": True,
        "is_starred": False,
        "received_at": (datetime.now(timezone.utc) - timedelta(hours=3)).isoformat(),
        "labels": ["INBOX"],
    },
    {
        "gmail_id": "demo_003",
        "from_addr": "mark.johnson@greenfield.com",
        "to_addr": "you@lytherahub.ai",
        "subject": "Meeting Follow-up — Action Items",
        "snippet": "Thanks for the productive meeting today. Here are the action items we discussed...",
        "body_preview": (
            "Thanks for the productive meeting today. Here are the action "
            "items we discussed:\n\n1. Finalize proposal by Friday\n"
            "2. Send updated wireframes\n3. Schedule follow-up for next "
            "Tuesday\n\nBest regards,\nMark Johnson"
        ),
        "is_read": False,
        "is_starred": False,
        "received_at": (datetime.now(timezone.utc) - timedelta(hours=5)).isoformat(),
        "labels": ["INBOX"],
    },
    {
        "gmail_id": "demo_004",
        "from_addr": "newsletter@producthunt.com",
        "to_addr": "you@lytherahub.ai",
        "subject": "Top Products of the Week",
        "snippet": "Check out this week's trending products on Product Hunt...",
        "body_preview": (
            "This week's top launches:\n\n"
            "1. AIWriter Pro - AI-powered copywriting\n"
            "2. DesignFlow - Collaborative design tool\n"
            "3. MetricsMate - Analytics dashboard builder\n\n"
            "See all launches at producthunt.com"
        ),
        "is_read": True,
        "is_starred": False,
        "received_at": (datetime.now(timezone.utc) - timedelta(hours=8)).isoformat(),
        "labels": ["INBOX", "CATEGORY_PROMOTIONS"],
    },
    {
        "gmail_id": "demo_005",
        "from_addr": "anna.schmidt@designhaus.de",
        "to_addr": "you@lytherahub.ai",
        "subject": "Proposal Request — Website Redesign",
        "snippet": "We're looking for a partner to redesign our company website. Could you send a proposal?",
        "body_preview": (
            "Hello,\n\nWe're looking for a partner to redesign our company "
            "website. Our budget is around EUR 15,000 and we'd like to "
            "launch by end of March.\n\nCould you send over a proposal?\n\n"
            "Kind regards,\nAnna Schmidt\nDesignHaus"
        ),
        "is_read": False,
        "is_starred": True,
        "received_at": (datetime.now(timezone.utc) - timedelta(hours=12)).isoformat(),
        "labels": ["INBOX", "IMPORTANT"],
    },
]


# ---------------------------------------------------------------------------
# Service
# ---------------------------------------------------------------------------


class GmailService:
    """Wraps the Gmail API for inbox management, sending, and drafting.

    Args:
        google_token: A dictionary containing the user's OAuth2 token
            fields (``token``, ``refresh_token``, ``token_uri``,
            ``client_id``, ``client_secret``).  Ignored in demo mode.
    """

    def __init__(self, google_token: Optional[dict[str, str]] = None) -> None:
        self._service = None

        if settings.DEMO_MODE or google_token is None:
            logger.info("GmailService running in DEMO mode.")
            return

        try:
            credentials = Credentials(
                token=google_token.get("token"),
                refresh_token=google_token.get("refresh_token"),
                token_uri=google_token.get("token_uri", "https://oauth2.googleapis.com/token"),
                client_id=google_token.get("client_id", settings.GOOGLE_CLIENT_ID),
                client_secret=google_token.get("client_secret", settings.GOOGLE_CLIENT_SECRET),
            )
            self._service = build("gmail", "v1", credentials=credentials)
            logger.info("GmailService initialized with live Google token.")
        except Exception as exc:
            logger.error("Failed to build Gmail service: %s — falling back to demo mode.", exc)

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    @property
    def _is_demo(self) -> bool:
        return self._service is None

    @staticmethod
    def _parse_message(msg: dict) -> dict[str, Any]:
        """Parse a Gmail API message resource into a flat dict."""
        headers = {h["name"].lower(): h["value"] for h in msg.get("payload", {}).get("headers", [])}
        snippet = msg.get("snippet", "")

        # Attempt to decode the body
        body = ""
        payload = msg.get("payload", {})
        if "body" in payload and payload["body"].get("data"):
            body = base64.urlsafe_b64decode(payload["body"]["data"]).decode("utf-8", errors="replace")
        elif "parts" in payload:
            for part in payload["parts"]:
                if part.get("mimeType") == "text/plain" and part.get("body", {}).get("data"):
                    body = base64.urlsafe_b64decode(part["body"]["data"]).decode("utf-8", errors="replace")
                    break

        label_ids = msg.get("labelIds", [])
        internal_date = msg.get("internalDate")
        received_at = (
            datetime.fromtimestamp(int(internal_date) / 1000, tz=timezone.utc).isoformat()
            if internal_date
            else datetime.now(timezone.utc).isoformat()
        )

        return {
            "gmail_id": msg["id"],
            "from_addr": headers.get("from", ""),
            "to_addr": headers.get("to", ""),
            "subject": headers.get("subject", "(no subject)"),
            "snippet": snippet,
            "body_preview": body[:2000] if body else snippet,
            "is_read": "UNREAD" not in label_ids,
            "is_starred": "STARRED" in label_ids,
            "received_at": received_at,
            "labels": label_ids,
        }

    def _build_mime_message(self, to: str, subject: str, body: str) -> dict:
        """Build a base64url-encoded RFC 2822 message for the Gmail API."""
        message = MIMEText(body)
        message["to"] = to
        message["subject"] = subject
        raw = base64.urlsafe_b64encode(message.as_bytes()).decode("ascii")
        return {"raw": raw}

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def fetch_emails(self, max_results: int = 50) -> list[dict[str, Any]]:
        """Fetch recent emails from the user's inbox.

        Args:
            max_results: Maximum number of emails to return.

        Returns:
            A list of parsed email dictionaries.
        """
        if self._is_demo:
            return _DEMO_EMAILS[:max_results]

        try:
            response = (
                self._service.users()
                .messages()
                .list(userId="me", maxResults=max_results, labelIds=["INBOX"])
                .execute()
            )
            messages = response.get("messages", [])
            results: list[dict] = []
            for msg_stub in messages:
                full = (
                    self._service.users()
                    .messages()
                    .get(userId="me", id=msg_stub["id"], format="full")
                    .execute()
                )
                results.append(self._parse_message(full))
            return results
        except Exception as exc:
            logger.error("fetch_emails failed: %s", exc)
            return []

    def get_email(self, gmail_id: str) -> Optional[dict[str, Any]]:
        """Fetch a single email by its Gmail message ID.

        Args:
            gmail_id: The Gmail message identifier.

        Returns:
            Parsed email dict or ``None`` if not found.
        """
        if self._is_demo:
            for email in _DEMO_EMAILS:
                if email["gmail_id"] == gmail_id:
                    return email
            return None

        try:
            msg = (
                self._service.users()
                .messages()
                .get(userId="me", id=gmail_id, format="full")
                .execute()
            )
            return self._parse_message(msg)
        except Exception as exc:
            logger.error("get_email(%s) failed: %s", gmail_id, exc)
            return None

    def send_email(self, to: str, subject: str, body: str) -> Optional[dict[str, Any]]:
        """Send an email on behalf of the user.

        Args:
            to: Recipient email address.
            subject: Email subject line.
            body: Plain-text email body.

        Returns:
            The sent message metadata or ``None`` on failure.
        """
        if self._is_demo:
            logger.info("DEMO: send_email(to=%s, subject=%s)", to, subject)
            return {
                "gmail_id": f"demo_sent_{datetime.now(timezone.utc).timestamp():.0f}",
                "to_addr": to,
                "subject": subject,
                "status": "sent",
                "sent_at": datetime.now(timezone.utc).isoformat(),
            }

        try:
            mime = self._build_mime_message(to, subject, body)
            sent = (
                self._service.users()
                .messages()
                .send(userId="me", body=mime)
                .execute()
            )
            return {"gmail_id": sent["id"], "to_addr": to, "subject": subject, "status": "sent"}
        except Exception as exc:
            logger.error("send_email failed: %s", exc)
            return None

    def create_draft(self, to: str, subject: str, body: str) -> Optional[dict[str, Any]]:
        """Save a new draft email.

        Args:
            to: Intended recipient.
            subject: Draft subject line.
            body: Draft body text.

        Returns:
            Draft metadata or ``None`` on failure.
        """
        if self._is_demo:
            logger.info("DEMO: create_draft(to=%s, subject=%s)", to, subject)
            return {
                "draft_id": f"demo_draft_{datetime.now(timezone.utc).timestamp():.0f}",
                "to_addr": to,
                "subject": subject,
                "status": "draft",
                "created_at": datetime.now(timezone.utc).isoformat(),
            }

        try:
            mime = self._build_mime_message(to, subject, body)
            draft = (
                self._service.users()
                .drafts()
                .create(userId="me", body={"message": mime})
                .execute()
            )
            return {
                "draft_id": draft["id"],
                "gmail_id": draft["message"]["id"],
                "to_addr": to,
                "subject": subject,
                "status": "draft",
            }
        except Exception as exc:
            logger.error("create_draft failed: %s", exc)
            return None

    def mark_read(self, gmail_id: str) -> bool:
        """Mark an email as read by removing the UNREAD label.

        Args:
            gmail_id: The Gmail message identifier.

        Returns:
            ``True`` on success, ``False`` otherwise.
        """
        if self._is_demo:
            logger.info("DEMO: mark_read(%s)", gmail_id)
            for email in _DEMO_EMAILS:
                if email["gmail_id"] == gmail_id:
                    email["is_read"] = True
            return True

        try:
            self._service.users().messages().modify(
                userId="me",
                id=gmail_id,
                body={"removeLabelIds": ["UNREAD"]},
            ).execute()
            return True
        except Exception as exc:
            logger.error("mark_read(%s) failed: %s", gmail_id, exc)
            return False

    def mark_starred(self, gmail_id: str) -> bool:
        """Toggle the STARRED label on an email.

        Args:
            gmail_id: The Gmail message identifier.

        Returns:
            ``True`` on success, ``False`` otherwise.
        """
        if self._is_demo:
            logger.info("DEMO: mark_starred(%s)", gmail_id)
            for email in _DEMO_EMAILS:
                if email["gmail_id"] == gmail_id:
                    email["is_starred"] = not email["is_starred"]
            return True

        try:
            # Fetch current labels to decide add/remove
            msg = (
                self._service.users()
                .messages()
                .get(userId="me", id=gmail_id, format="metadata", metadataHeaders=[""])
                .execute()
            )
            label_ids = msg.get("labelIds", [])
            if "STARRED" in label_ids:
                body = {"removeLabelIds": ["STARRED"]}
            else:
                body = {"addLabelIds": ["STARRED"]}

            self._service.users().messages().modify(
                userId="me", id=gmail_id, body=body
            ).execute()
            return True
        except Exception as exc:
            logger.error("mark_starred(%s) failed: %s", gmail_id, exc)
            return False

    def search_emails(self, query: str, max_results: int = 20) -> list[dict[str, Any]]:
        """Search emails using Gmail query syntax (e.g. ``from:foo subject:bar``).

        Args:
            query: Gmail search query string.
            max_results: Maximum results to return.

        Returns:
            List of matching email dicts.
        """
        if self._is_demo:
            q = query.lower()
            return [
                e
                for e in _DEMO_EMAILS
                if q in e["subject"].lower()
                or q in e["from_addr"].lower()
                or q in (e.get("body_preview") or "").lower()
            ][:max_results]

        try:
            response = (
                self._service.users()
                .messages()
                .list(userId="me", q=query, maxResults=max_results)
                .execute()
            )
            messages = response.get("messages", [])
            results: list[dict] = []
            for msg_stub in messages:
                full = (
                    self._service.users()
                    .messages()
                    .get(userId="me", id=msg_stub["id"], format="full")
                    .execute()
                )
                results.append(self._parse_message(full))
            return results
        except Exception as exc:
            logger.error("search_emails(q=%s) failed: %s", query, exc)
            return []
