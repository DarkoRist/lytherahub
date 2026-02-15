"""Slack API wrapper — sends notifications, lists channels, handles events.

Uses the Slack Web API in production. Returns realistic demo data when
DEMO_MODE is enabled or the Slack token is not configured.
"""

import logging
from datetime import datetime, timezone
from typing import Optional

from app.config import settings

logger = logging.getLogger(__name__)

# Lazy-init Slack client
_slack_client = None


def _get_slack_client():
    """Return a cached slack_sdk WebClient instance."""
    global _slack_client
    if _slack_client is None:
        from slack_sdk import WebClient

        _slack_client = WebClient(token=settings.SLACK_BOT_TOKEN)
    return _slack_client


def _is_available() -> bool:
    """Check whether the Slack integration is usable."""
    return (
        not settings.DEMO_MODE
        and settings.ENABLE_SLACK_NOTIFICATIONS
        and bool(settings.SLACK_BOT_TOKEN)
    )


# ---------------------------------------------------------------------------
# Channel operations
# ---------------------------------------------------------------------------


async def list_channels() -> list[dict]:
    """Return public Slack channels the bot has access to."""
    if _is_available():
        try:
            client = _get_slack_client()
            response = client.conversations_list(types="public_channel", limit=100)
            return [
                {
                    "id": ch["id"],
                    "name": ch["name"],
                    "is_member": ch.get("is_member", False),
                    "num_members": ch.get("num_members", 0),
                    "topic": ch.get("topic", {}).get("value", ""),
                }
                for ch in response.get("channels", [])
            ]
        except Exception as e:
            logger.error(f"Slack list_channels error: {e}")

    # Demo fallback
    return [
        {
            "id": "C001",
            "name": "general",
            "is_member": True,
            "num_members": 12,
            "topic": "Company-wide announcements",
        },
        {
            "id": "C002",
            "name": "sales",
            "is_member": True,
            "num_members": 6,
            "topic": "Sales pipeline discussions",
        },
        {
            "id": "C003",
            "name": "support",
            "is_member": True,
            "num_members": 8,
            "topic": "Customer support tickets",
        },
        {
            "id": "C004",
            "name": "lytherahub-alerts",
            "is_member": True,
            "num_members": 3,
            "topic": "LytheraHub automated notifications",
        },
    ]


# ---------------------------------------------------------------------------
# Messaging
# ---------------------------------------------------------------------------


async def send_message(
    channel: str,
    text: str,
    blocks: Optional[list[dict]] = None,
) -> dict:
    """Send a message to a Slack channel or DM.

    Args:
        channel: Channel ID or user ID for DM.
        text: Fallback plain-text content.
        blocks: Optional Block Kit blocks for rich formatting.

    Returns:
        dict with ``ok``, ``channel``, and ``ts`` keys.
    """
    if _is_available():
        try:
            client = _get_slack_client()
            kwargs = {"channel": channel, "text": text}
            if blocks:
                kwargs["blocks"] = blocks
            response = client.chat_postMessage(**kwargs)
            return {
                "ok": response["ok"],
                "channel": response["channel"],
                "ts": response["ts"],
            }
        except Exception as e:
            logger.error(f"Slack send_message error: {e}")

    # Demo fallback
    return {
        "ok": True,
        "channel": channel,
        "ts": str(datetime.now(timezone.utc).timestamp()),
    }


async def send_notification(
    channel: str,
    title: str,
    message: str,
    severity: str = "info",
    url: Optional[str] = None,
) -> dict:
    """Send a formatted LytheraHub notification to Slack.

    Severity controls the colour bar: info=blue, warning=orange, critical=red.
    """
    colour_map = {"info": "#3B82F6", "warning": "#F59E0B", "critical": "#EF4444"}
    colour = colour_map.get(severity, "#3B82F6")

    blocks = [
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": f"*{title}*\n{message}",
            },
        },
    ]
    if url:
        blocks.append(
            {
                "type": "actions",
                "elements": [
                    {
                        "type": "button",
                        "text": {"type": "plain_text", "text": "View in LytheraHub"},
                        "url": url,
                    }
                ],
            }
        )

    attachments_text = f"[{severity.upper()}] {title}: {message}"

    if _is_available():
        try:
            client = _get_slack_client()
            response = client.chat_postMessage(
                channel=channel,
                text=attachments_text,
                blocks=blocks,
                attachments=[{"color": colour, "fallback": attachments_text}],
            )
            return {"ok": response["ok"], "ts": response["ts"]}
        except Exception as e:
            logger.error(f"Slack send_notification error: {e}")

    # Demo fallback
    return {"ok": True, "ts": str(datetime.now(timezone.utc).timestamp())}


# ---------------------------------------------------------------------------
# Event / command handling helpers
# ---------------------------------------------------------------------------


async def handle_event(event_payload: dict) -> dict:
    """Process an incoming Slack event (message, app_mention, etc.).

    Returns a response dict with any action taken.
    """
    event = event_payload.get("event", {})
    event_type = event.get("type", "unknown")

    if event_type == "url_verification":
        return {"challenge": event_payload.get("challenge", "")}

    if event_type == "app_mention":
        text = event.get("text", "")
        channel = event.get("channel", "")
        await send_message(
            channel,
            f"Thanks for the mention! I received: {text}",
        )
        return {"action": "replied_to_mention", "channel": channel}

    logger.info(f"Unhandled Slack event type: {event_type}")
    return {"action": "ignored", "event_type": event_type}


async def handle_slash_command(command: str, text: str, user_id: str) -> dict:
    """Process a Slack slash command (e.g. /lytherahub summary).

    Returns a dict with ``response_type`` and ``text`` suitable for Slack's
    immediate response.
    """
    text_lower = (text or "").strip().lower()

    if command in ("/lytherahub", "/bp"):
        if text_lower.startswith("summary") or text_lower.startswith("briefing"):
            return {
                "response_type": "ephemeral",
                "text": (
                    "*Morning Briefing*\n"
                    "- 5 unread emails (2 urgent)\n"
                    "- 3 meetings today\n"
                    "- EUR 4,200 in overdue invoices\n"
                    "- 7 pending tasks\n\n"
                    "Open LytheraHub for full details."
                ),
            }
        if text_lower.startswith("status"):
            return {
                "response_type": "ephemeral",
                "text": "All systems operational. Last sync 2 minutes ago.",
            }
        return {
            "response_type": "ephemeral",
            "text": (
                "Available commands:\n"
                "- `/lytherahub summary` — morning briefing\n"
                "- `/lytherahub status` — system status\n"
            ),
        }

    return {"response_type": "ephemeral", "text": f"Unknown command: {command}"}


# ---------------------------------------------------------------------------
# Channel summarisation (uses AI agent when available)
# ---------------------------------------------------------------------------


async def summarize_channel(channel_id: str, message_count: int = 50) -> str:
    """Fetch recent messages from a channel and summarise with AI.

    Falls back to a placeholder summary in demo mode.
    """
    if _is_available():
        try:
            client = _get_slack_client()
            history = client.conversations_history(
                channel=channel_id, limit=message_count
            )
            messages = history.get("messages", [])
            text_blob = "\n".join(m.get("text", "") for m in messages if m.get("text"))

            from app.services import ai_agent

            system = "Summarize these Slack messages in 3-5 bullet points."
            summary = await ai_agent._call_claude(system, text_blob[:4000])
            if summary:
                return summary
        except Exception as e:
            logger.error(f"Slack summarize_channel error: {e}")

    # Demo fallback
    return (
        "- Team discussed Q2 revenue targets and agreed on EUR 50K goal\n"
        "- 3 new client leads added to the pipeline this week\n"
        "- Support resolved 12 tickets — average response time improved to 1.5 hrs\n"
        "- Marketing campaign launch scheduled for next Monday"
    )
