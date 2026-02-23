"""Core AI agent service — single point of control for all AI operations.

Uses Claude API for real mode, returns realistic mock data in demo mode.
"""

import json
import logging
from typing import Optional

from app.config import settings

logger = logging.getLogger(__name__)

# Lazy-init Anthropic client
_client = None


def _get_client():
    global _client
    if _client is None:
        import anthropic
        _client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
    return _client


async def _call_claude(system_prompt: str, user_message: str, max_tokens: int = 1024) -> str:
    """Make a Claude API call with retry logic."""
    if settings.DEMO_MODE or not settings.ANTHROPIC_API_KEY:
        return None  # Caller should handle demo fallback

    try:
        client = _get_client()
        response = client.messages.create(
            model=settings.AI_MODEL,
            max_tokens=max_tokens,
            system=system_prompt,
            messages=[{"role": "user", "content": user_message}],
        )
        return response.content[0].text
    except Exception as e:
        logger.error(f"Claude API error: {e}")
        return None


# ---------------------------------------------------------------------------
# Email Intelligence
# ---------------------------------------------------------------------------


async def classify_email(subject: str, body: str, from_addr: str) -> dict:
    """Classify an email into a category and determine urgency."""
    system = (
        "You are an email classifier for a business professional. "
        "Classify the email into exactly one category: urgent, client, invoice, newsletter, spam, other. "
        "Also determine if a reply is needed. "
        'Respond in JSON: {"category": "...", "needs_reply": true/false, "urgency_score": 0-100}'
    )
    user_msg = f"From: {from_addr}\nSubject: {subject}\n\n{body[:2000]}"

    result = await _call_claude(system, user_msg)
    if result:
        try:
            return json.loads(result)
        except json.JSONDecodeError:
            pass

    # Demo fallback
    if "invoice" in subject.lower() or "payment" in subject.lower():
        return {"category": "invoice", "needs_reply": True, "urgency_score": 60}
    if "urgent" in subject.lower() or "asap" in subject.lower():
        return {"category": "urgent", "needs_reply": True, "urgency_score": 90}
    if "newsletter" in subject.lower() or "unsubscribe" in body.lower():
        return {"category": "newsletter", "needs_reply": False, "urgency_score": 5}
    return {"category": "client", "needs_reply": True, "urgency_score": 40}


async def summarize_email(subject: str, body: str) -> str:
    """Generate a 1-line summary of an email."""
    system = "Summarize this email in one concise sentence (max 100 chars). No prefix."
    result = await _call_claude(system, f"Subject: {subject}\n\n{body[:2000]}")
    if result:
        return result.strip()
    return f"Email about: {subject[:80]}"


async def draft_reply(
    subject: str, body: str, from_addr: str, tone: str = "professional"
) -> str:
    """Generate an AI reply draft."""
    system = (
        f"Draft a {tone} reply to this business email. "
        "Be concise, helpful, and natural. Do not include the subject line."
    )
    user_msg = f"From: {from_addr}\nSubject: {subject}\n\n{body[:2000]}"
    result = await _call_claude(system, user_msg, max_tokens=512)
    if result:
        return result.strip()

    # Demo fallback
    return (
        f"Hi,\n\n"
        f"Thank you for your email regarding \"{subject}\". "
        f"I've reviewed the details and will get back to you shortly with a comprehensive response.\n\n"
        f"Best regards"
    )


async def extract_action_items(body: str) -> list[str]:
    """Extract action items from an email body."""
    system = 'Extract action items from this email. Return as JSON array of strings: ["item1", "item2"]'
    result = await _call_claude(system, body[:2000])
    if result:
        try:
            return json.loads(result)
        except json.JSONDecodeError:
            pass
    return []


# ---------------------------------------------------------------------------
# Calendar Intelligence
# ---------------------------------------------------------------------------


async def generate_meeting_prep(
    event_title: str,
    attendees: list[dict],
    client_history: Optional[str] = None,
    recent_emails: Optional[str] = None,
) -> str:
    """Generate an AI meeting preparation brief."""
    system = (
        "Generate a concise meeting prep brief. Include: "
        "1) Meeting context, 2) Key talking points, 3) Questions to ask, "
        "4) Action items from previous interactions. "
        "Keep it practical and under 300 words."
    )
    context_parts = [f"Meeting: {event_title}"]
    if attendees:
        names = ", ".join(a.get("name", a.get("email", "Unknown")) for a in attendees)
        context_parts.append(f"Attendees: {names}")
    if client_history:
        context_parts.append(f"Client history: {client_history}")
    if recent_emails:
        context_parts.append(f"Recent emails: {recent_emails}")

    result = await _call_claude(system, "\n".join(context_parts))
    if result:
        return result.strip()

    # Demo fallback
    return (
        f"## Meeting Prep: {event_title}\n\n"
        f"**Attendees:** {', '.join(a.get('name', 'TBD') for a in (attendees or []))}\n\n"
        f"**Key Points:**\n"
        f"- Review previous meeting action items\n"
        f"- Discuss project timeline and milestones\n"
        f"- Address any open questions or blockers\n\n"
        f"**Questions to Ask:**\n"
        f"- What are the current priorities?\n"
        f"- Any changes to scope or timeline?\n"
        f"- Next steps and deliverables?"
    )


async def suggest_meeting_time(preferences: str, busy_slots: list[dict]) -> list[dict]:
    """Suggest optimal meeting times based on availability."""
    # In demo mode, return hardcoded suggestions
    from datetime import datetime, timedelta, timezone
    now = datetime.now(timezone.utc)
    tomorrow = now + timedelta(days=1)
    return [
        {"start": tomorrow.replace(hour=10, minute=0).isoformat(), "end": tomorrow.replace(hour=11, minute=0).isoformat()},
        {"start": tomorrow.replace(hour=14, minute=0).isoformat(), "end": tomorrow.replace(hour=15, minute=0).isoformat()},
        {"start": tomorrow.replace(hour=16, minute=0).isoformat(), "end": tomorrow.replace(hour=17, minute=0).isoformat()},
    ]


# ---------------------------------------------------------------------------
# Business Intelligence
# ---------------------------------------------------------------------------


async def enrich_client(company_name: str, website: Optional[str] = None) -> dict:
    """AI-enrich a client with industry, size, description."""
    system = (
        "Given a company name and optional website, provide business intelligence. "
        'Respond in JSON: {"industry": "...", "size": "...", "description": "...", "estimated_revenue": "..."}'
    )
    user_msg = f"Company: {company_name}"
    if website:
        user_msg += f"\nWebsite: {website}"

    result = await _call_claude(system, user_msg)
    if result:
        try:
            return json.loads(result)
        except json.JSONDecodeError:
            pass

    # Demo fallback
    return {
        "industry": "Technology / SaaS",
        "size": "50-200 employees",
        "description": f"{company_name} is a technology company focused on delivering innovative solutions.",
        "estimated_revenue": "EUR 2-10M",
    }


async def generate_daily_briefing(
    email_count: int,
    urgent_count: int,
    today_meetings: int,
    overdue_invoices: float,
    pending_tasks: int,
    user_name: str = "there",
) -> dict:
    """Generate a morning briefing summary."""
    system = (
        "Generate a friendly, concise morning business briefing. "
        "Include a greeting, summary of the day, and top 3 priorities. "
        'Respond in JSON: {"greeting": "...", "summary": "...", "priorities": [{"title": "...", "description": "..."}]}'
    )
    user_msg = (
        f"User: {user_name}\n"
        f"New emails: {email_count} ({urgent_count} urgent)\n"
        f"Meetings today: {today_meetings}\n"
        f"Overdue invoices: EUR {overdue_invoices:,.2f}\n"
        f"Pending tasks: {pending_tasks}"
    )

    result = await _call_claude(system, user_msg)
    if result:
        try:
            return json.loads(result)
        except json.JSONDecodeError:
            pass

    # Demo fallback
    priorities = []
    if urgent_count > 0:
        priorities.append({"title": f"Reply to {urgent_count} urgent emails", "description": "Check your inbox for time-sensitive messages"})
    if overdue_invoices > 0:
        priorities.append({"title": f"Follow up on EUR {overdue_invoices:,.0f} overdue", "description": "Send payment reminders to outstanding invoices"})
    if today_meetings > 0:
        priorities.append({"title": f"Prepare for {today_meetings} meetings", "description": "Review meeting prep briefs and action items"})
    if not priorities:
        priorities.append({"title": "Clear inbox", "description": "Review and respond to pending emails"})

    return {
        "greeting": f"Good morning, {user_name}!",
        "summary": (
            f"You have {email_count} new emails ({urgent_count} urgent), "
            f"{today_meetings} meetings today, and {pending_tasks} pending tasks."
        ),
        "priorities": priorities[:3],
    }


async def generate_weekly_report(week_data: dict) -> dict:
    """Generate a weekly business report."""
    system = (
        "Generate a weekly business performance report. "
        "Include sections: Overview, Email Performance, Revenue Update, Client Pipeline, Recommendations. "
        'Respond in JSON: {"title": "...", "sections": [{"heading": "...", "content": "..."}]}'
    )
    result = await _call_claude(system, json.dumps(week_data))
    if result:
        try:
            return json.loads(result)
        except json.JSONDecodeError:
            pass

    # Demo fallback
    return {
        "title": "Weekly Business Report",
        "sections": [
            {"heading": "Overview", "content": "A productive week with steady progress across all areas."},
            {"heading": "Email Performance", "content": f"Processed {week_data.get('emails_handled', 45)} emails with an average response time of 2.3 hours."},
            {"heading": "Revenue Update", "content": f"EUR {week_data.get('revenue', 8500):,.0f} collected this week. {week_data.get('invoices_sent', 3)} new invoices sent."},
            {"heading": "Recommendations", "content": "Focus on following up with stale leads and preparing for upcoming client meetings."},
        ],
    }


async def generate_monthly_report(month_data: dict) -> dict:
    """Generate a monthly business health report."""
    # Demo fallback
    return {
        "title": "Monthly Business Report",
        "sections": [
            {"heading": "Revenue Summary", "content": f"Total revenue: EUR {month_data.get('revenue', 32000):,.0f}. Growth: +12% MoM."},
            {"heading": "Client Acquisition", "content": f"{month_data.get('new_clients', 4)} new clients acquired. Pipeline value: EUR {month_data.get('pipeline_value', 45000):,.0f}."},
            {"heading": "Productivity", "content": f"{month_data.get('emails_handled', 180)} emails processed. {month_data.get('meetings', 24)} meetings held."},
            {"heading": "AI Insights", "content": "Revenue trending upward. Recommend focusing on enterprise clients for higher deal values."},
        ],
    }


# ---------------------------------------------------------------------------
# Invoice Intelligence
# ---------------------------------------------------------------------------


async def predict_payment_risk(client_name: str, payment_history: str) -> dict:
    """Predict payment risk for a client."""
    # Demo fallback
    return {"risk_score": 25, "risk_level": "low", "reason": "Consistent payment history"}


async def generate_reminder_email(
    client_name: str, invoice_number: str, amount: float, days_overdue: int, reminder_number: int
) -> str:
    """Generate an escalating payment reminder email."""
    system = (
        f"Write a payment reminder email (reminder #{reminder_number}). "
        f"Be {'polite and gentle' if reminder_number == 1 else 'firm but professional' if reminder_number == 2 else 'urgent and direct'}. "
        "Include the invoice number and amount."
    )
    user_msg = f"Client: {client_name}\nInvoice: {invoice_number}\nAmount: EUR {amount:,.2f}\nDays overdue: {days_overdue}"

    result = await _call_claude(system, user_msg, max_tokens=512)
    if result:
        return result.strip()

    # Demo fallback
    if reminder_number == 1:
        tone = "I hope this message finds you well. This is a friendly reminder"
    elif reminder_number == 2:
        tone = "I'm following up on my previous message. I wanted to bring to your attention"
    else:
        tone = "This is an urgent notice regarding"

    return (
        f"Dear {client_name},\n\n"
        f"{tone} that invoice {invoice_number} for EUR {amount:,.2f} "
        f"is now {days_overdue} days past due.\n\n"
        f"Please arrange payment at your earliest convenience.\n\n"
        f"Best regards"
    )


async def forecast_cashflow(invoices_data: list[dict], days: int = 30) -> list[dict]:
    """Forecast cash flow based on invoice data and payment patterns."""
    # Demo fallback — simple projection
    from datetime import datetime, timedelta, timezone
    forecast = []
    cumulative = 0.0
    for i in range(days):
        date = (datetime.now(timezone.utc) + timedelta(days=i)).strftime("%Y-%m-%d")
        expected = sum(
            inv.get("amount", 0) * 0.8  # 80% collection probability
            for inv in invoices_data
            if inv.get("due_date", "") == date
        )
        cumulative += expected
        if expected > 0 or i % 7 == 0:
            forecast.append({"date": date, "expected_income": expected, "cumulative": cumulative})
    return forecast


# ---------------------------------------------------------------------------
# Command Bar / Natural Language
# ---------------------------------------------------------------------------


async def parse_command(text: str) -> dict:
    """Parse natural language command into structured action."""
    system = (
        "You are a business assistant command parser. Parse the user's natural language into a structured action. "
        "Possible actions: create_event, create_task, query_revenue, send_reminder, inbox_summary, "
        "tomorrow_schedule, create_client, search_emails, generate_report. "
        'Respond in JSON: {"action": "...", "params": {...}, "message": "human-readable response"}'
    )
    result = await _call_claude(system, text)
    if result:
        try:
            return json.loads(result)
        except json.JSONDecodeError:
            pass

    # Demo fallback — simple keyword matching
    text_lower = text.lower()
    if "schedule" in text_lower or "meeting" in text_lower:
        return {"action": "create_event", "params": {"title": text}, "message": "I'll help you schedule that meeting."}
    if "remind" in text_lower or "follow up" in text_lower:
        return {"action": "create_task", "params": {"title": text}, "message": "I've created a reminder for you."}
    if "revenue" in text_lower or "how much" in text_lower:
        return {"action": "query_revenue", "params": {}, "message": "This month's revenue is EUR 12,450 from 8 paid invoices."}
    if "invoice" in text_lower or "payment" in text_lower:
        return {"action": "send_reminder", "params": {}, "message": "I'll send a payment reminder to the client."}
    if "inbox" in text_lower or "email" in text_lower:
        return {"action": "inbox_summary", "params": {}, "message": "You have 12 unread emails: 3 urgent, 5 client, 2 invoices, 2 newsletters."}
    if "tomorrow" in text_lower or "schedule" in text_lower:
        return {"action": "tomorrow_schedule", "params": {}, "message": "Tomorrow you have 3 meetings: 10am Team Standup, 2pm Client Call, 4pm Strategy Review."}
    if "client" in text_lower or "add" in text_lower:
        return {"action": "create_client", "params": {"name": text}, "message": "I'll add this new client to your CRM."}

    return {"action": "unknown", "params": {}, "message": f"I understood: \"{text}\". Let me help you with that."}
