"""Chat service — conversational AI assistant with full business context.

Maintains per-session conversation history and routes queries to
appropriate data sources (emails, clients, invoices, calendar).
"""

import json
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.database import (
    CalendarEvent,
    Client,
    Email,
    Invoice,
    Task,
    User,
)

logger = logging.getLogger(__name__)

# In-memory session store — maps session_id -> message list
_sessions: dict[str, list[dict]] = {}

MAX_HISTORY = 20  # Keep last N messages per session


def _get_session(session_id: str) -> list[dict]:
    if session_id not in _sessions:
        _sessions[session_id] = []
    return _sessions[session_id]


def _trim_session(session_id: str):
    if session_id in _sessions and len(_sessions[session_id]) > MAX_HISTORY:
        _sessions[session_id] = _sessions[session_id][-MAX_HISTORY:]


async def _gather_context(user: User, db: AsyncSession) -> str:
    """Build a business context summary for the AI from the user's data."""
    uid = user.id
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + timedelta(days=1)

    # Email stats
    unread = (await db.execute(
        select(func.count()).select_from(
            select(Email).where(Email.user_id == uid, Email.is_read == False).subquery()  # noqa: E712
        )
    )).scalar() or 0

    urgent = (await db.execute(
        select(func.count()).select_from(
            select(Email).where(Email.user_id == uid, Email.category == "urgent").subquery()
        )
    )).scalar() or 0

    # Today's meetings
    meetings_result = await db.execute(
        select(CalendarEvent)
        .where(
            CalendarEvent.user_id == uid,
            CalendarEvent.start_time >= today_start,
            CalendarEvent.start_time < today_end,
        )
        .order_by(CalendarEvent.start_time)
        .limit(10)
    )
    meetings = meetings_result.scalars().all()

    # Invoice stats
    outstanding = (await db.execute(
        select(func.coalesce(func.sum(Invoice.amount), 0))
        .where(Invoice.user_id == uid, Invoice.status.in_(["sent", "overdue"]))
    )).scalar() or 0

    overdue_count = (await db.execute(
        select(func.count()).select_from(
            select(Invoice).where(Invoice.user_id == uid, Invoice.status == "overdue").subquery()
        )
    )).scalar() or 0

    # Client stats
    total_clients = (await db.execute(
        select(func.count()).select_from(
            select(Client).where(Client.user_id == uid).subquery()
        )
    )).scalar() or 0

    # Pending tasks
    pending_tasks = (await db.execute(
        select(func.count()).select_from(
            select(Task).where(Task.user_id == uid, Task.status != "done").subquery()
        )
    )).scalar() or 0

    # Top clients
    top_clients_result = await db.execute(
        select(Client)
        .where(Client.user_id == uid, Client.pipeline_stage.notin_(["lost"]))
        .order_by(Client.deal_value.desc())
        .limit(5)
    )
    top_clients = top_clients_result.scalars().all()

    meeting_lines = "\n".join(
        f"  - {m.title} at {m.start_time.strftime('%H:%M')}"
        for m in meetings
    ) or "  No meetings today."

    client_lines = "\n".join(
        f"  - {c.company_name} ({c.pipeline_stage}, EUR {c.deal_value:,.0f})"
        for c in top_clients
    ) or "  No clients."

    return (
        f"Date: {now.strftime('%A, %B %d, %Y')}\n"
        f"User: {user.name} ({user.email})\n\n"
        f"EMAILS: {unread} unread ({urgent} urgent)\n"
        f"TODAY'S SCHEDULE:\n{meeting_lines}\n"
        f"INVOICES: EUR {outstanding:,.2f} outstanding, {overdue_count} overdue\n"
        f"CLIENTS: {total_clients} total\n"
        f"Top clients:\n{client_lines}\n"
        f"TASKS: {pending_tasks} pending"
    )


SYSTEM_PROMPT = """\
You are the LytheraHub AI assistant — a smart, friendly business operations assistant.
You help the user manage their emails, calendar, invoices, clients, and tasks.

You have access to the user's real business data (provided in context).
Answer questions clearly and concisely. When suggesting actions, be specific.
Use EUR for currency. Format numbers nicely.

If the user asks you to DO something (send email, create event, etc.), describe
what you would do and present it as a confirmation the user can approve.

Keep responses short (2-4 sentences for simple questions, longer for reports/summaries).
Use markdown formatting for readability.
"""


async def chat(
    user: User,
    db: AsyncSession,
    message: str,
    session_id: str,
    page_context: Optional[str] = None,
) -> dict:
    """Process a chat message and return an AI response.

    Args:
        user: The authenticated user.
        db: Database session.
        message: The user's message.
        session_id: Conversation session ID.
        page_context: Optional context about which page the user is on.

    Returns:
        dict with "reply", optional "actions", optional "chart_data".
    """
    history = _get_session(session_id)
    history.append({"role": "user", "content": message})

    # Build context
    biz_context = await _gather_context(user, db)
    context_block = f"<business_context>\n{biz_context}\n</business_context>"
    if page_context:
        context_block += f"\n<current_page>{page_context}</current_page>"

    system = f"{SYSTEM_PROMPT}\n\n{context_block}"

    # Try Claude API
    if not settings.DEMO_MODE and settings.ANTHROPIC_API_KEY:
        try:
            import anthropic

            client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
            response = client.messages.create(
                model=settings.AI_MODEL,
                max_tokens=1024,
                system=system,
                messages=history[-MAX_HISTORY:],
            )
            reply_text = response.content[0].text
            history.append({"role": "assistant", "content": reply_text})
            _trim_session(session_id)
            return {"reply": reply_text}
        except Exception as e:
            logger.error(f"Chat Claude API error: {e}")

    # Demo fallback
    reply = _demo_reply(message, biz_context)
    history.append({"role": "assistant", "content": reply})
    _trim_session(session_id)
    return {"reply": reply}


def _demo_reply(message: str, context: str) -> str:
    """Generate a realistic demo response based on keyword matching."""
    msg = message.lower()

    if any(w in msg for w in ["top client", "best client", "biggest client", "revenue by client"]):
        return (
            "Here are your **top 5 clients by deal value**:\n\n"
            "| # | Client | Stage | Deal Value |\n"
            "|---|--------|-------|------------|\n"
            "| 1 | TechVision GmbH | Won | EUR 15,000 |\n"
            "| 2 | CloudFirst Solutions | Negotiation | EUR 12,000 |\n"
            "| 3 | DataFlow Analytics | Proposal | EUR 8,500 |\n"
            "| 4 | GreenEnergy Plus | Won | EUR 7,200 |\n"
            "| 5 | Nordic Retail Group | Contacted | EUR 5,000 |\n\n"
            "TechVision GmbH is your highest-value client with a won deal of **EUR 15,000**."
        )

    if any(w in msg for w in ["revenue", "how much", "earnings", "income"]):
        return (
            "Here's your **revenue summary** for this month:\n\n"
            "- **Collected:** EUR 12,450 from 8 paid invoices\n"
            "- **Outstanding:** EUR 8,200 across 4 pending invoices\n"
            "- **Overdue:** EUR 3,400 (2 invoices past due)\n\n"
            "Revenue is up **12%** compared to last month. "
            "I'd recommend following up on the 2 overdue invoices from CloudFirst Solutions and Nordic Retail Group."
        )

    if any(w in msg for w in ["email", "inbox", "unread"]):
        return (
            "Here's your **inbox summary**:\n\n"
            "- **12 unread emails** — 3 urgent, 5 from clients, 2 invoice-related, 2 newsletters\n"
            "- **3 need replies** (oldest is 2 days old from Hans at TechVision)\n\n"
            "Would you like me to draft replies to the urgent ones?"
        )

    if any(w in msg for w in ["schedule", "calendar", "meeting", "today"]):
        return (
            "Here's your **schedule for today**:\n\n"
            "- **10:00** — Team Standup (30 min)\n"
            "- **14:00** — Client call with TechVision GmbH (1 hour) — *prep brief ready*\n"
            "- **16:30** — Strategy review with Maria (45 min)\n\n"
            "Your next meeting is the Team Standup in about 2 hours. "
            "The TechVision call has an AI prep brief ready — want me to show it?"
        )

    if any(w in msg for w in ["overdue", "late payment", "unpaid"]):
        return (
            "You have **2 overdue invoices** totaling **EUR 3,400**:\n\n"
            "1. **INV-1042** — CloudFirst Solutions — EUR 2,200 (14 days overdue)\n"
            "2. **INV-1038** — Nordic Retail Group — EUR 1,200 (7 days overdue)\n\n"
            "CloudFirst has been reminded once already. "
            "Want me to send a follow-up reminder to both?"
        )

    if any(w in msg for w in ["task", "todo", "to do", "pending"]):
        return (
            "You have **6 pending tasks**:\n\n"
            "1. Reply to Hans about the Q1 proposal *(urgent, due today)*\n"
            "2. Send contract to DataFlow Analytics *(high, due tomorrow)*\n"
            "3. Follow up with CloudFirst on overdue invoice *(high, overdue)*\n"
            "4. Prepare monthly report *(medium, due Friday)*\n"
            "5. Update CRM notes for Nordic Retail *(low)*\n"
            "6. Review automation workflows *(low)*\n\n"
            "Focus on the top 3 — they're the most time-sensitive."
        )

    if any(w in msg for w in ["draft", "write", "compose", "email to"]):
        return (
            "I've drafted a professional email for you:\n\n"
            "> **Subject:** Following Up — Next Steps\n>\n"
            "> Hi,\n>\n"
            "> Thank you for our recent conversation. I wanted to follow up "
            "on the key points we discussed and outline the next steps.\n>\n"
            "> I'll have the updated proposal ready by end of week. "
            "Please let me know if you have any questions in the meantime.\n>\n"
            "> Best regards\n\n"
            "Would you like me to adjust the tone or add specific details?"
        )

    if any(w in msg for w in ["this week", "weekly", "week summary"]):
        return (
            "Here's your **week in review**:\n\n"
            "- **Emails:** 45 received, 28 replied (avg response time: 2.3h)\n"
            "- **Meetings:** 8 held, 2 cancelled\n"
            "- **Revenue:** EUR 8,500 collected, 3 new invoices sent\n"
            "- **Clients:** 2 moved to proposal stage, 1 deal won\n"
            "- **Tasks:** 12 completed, 6 still pending\n\n"
            "**AI recommendation:** Focus on closing the DataFlow Analytics deal — "
            "they've been in the proposal stage for 10 days."
        )

    if any(w in msg for w in ["help", "what can you", "how do"]):
        return (
            "I can help you with all aspects of your business! Here are some things you can ask:\n\n"
            "- **Emails:** \"Summarize my inbox\", \"Draft a reply to Hans\"\n"
            "- **Calendar:** \"What's my schedule today?\", \"Schedule a meeting with...\"\n"
            "- **Invoices:** \"Show overdue invoices\", \"How much revenue this month?\"\n"
            "- **Clients:** \"Who are my top clients?\", \"Show stale leads\"\n"
            "- **Tasks:** \"What's on my todo list?\", \"Create a task to...\"\n"
            "- **Reports:** \"Give me a weekly summary\", \"How is my business doing?\"\n\n"
            "Just ask naturally — I understand context!"
        )

    # Default response
    return (
        f"I understand you're asking about: *\"{message}\"*\n\n"
        "Based on your current business data, everything looks on track. "
        "You have 12 unread emails, 3 meetings today, and EUR 8,200 in outstanding invoices.\n\n"
        "Could you be more specific? I can help with emails, calendar, invoices, clients, tasks, or reports."
    )
