"""Analytics router — revenue, client, productivity metrics and AI insights."""

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.config import settings
from app.models.database import (
    ActivityLog,
    CalendarEvent,
    Client,
    Email,
    Invoice,
    Task,
    User,
    get_db,
)

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


# ---------------------------------------------------------------------------
# GET /api/analytics/revenue
# ---------------------------------------------------------------------------


@router.get("/revenue")
async def get_revenue_analytics(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Revenue metrics: monthly breakdown, by client, totals."""
    uid = user.id
    now = datetime.now(timezone.utc)

    # Paid invoices
    paid_result = await db.execute(
        select(Invoice).where(Invoice.user_id == uid, Invoice.status == "paid")
    )
    paid_invoices = paid_result.scalars().all()

    # All invoices
    all_result = await db.execute(select(Invoice).where(Invoice.user_id == uid))
    all_invoices = all_result.scalars().all()

    # Monthly revenue (last 12 months)
    monthly = {}
    for inv in paid_invoices:
        date = inv.paid_date or inv.issued_date
        key = date.strftime("%Y-%m")
        monthly[key] = monthly.get(key, 0) + inv.amount

    monthly_data = []
    for i in range(11, -1, -1):
        d = now - timedelta(days=i * 30)
        key = d.strftime("%Y-%m")
        monthly_data.append({
            "month": d.strftime("%b %Y"),
            "revenue": monthly.get(key, 0),
        })

    # Revenue by client (top 10)
    by_client = {}
    clients_map = {}
    for inv in paid_invoices:
        cid = inv.client_id or "unknown"
        by_client[cid] = by_client.get(cid, 0) + inv.amount

    if by_client:
        client_ids = [k for k in by_client if k != "unknown"]
        if client_ids:
            cr = await db.execute(select(Client).where(Client.id.in_(client_ids)))
            for c in cr.scalars().all():
                clients_map[c.id] = c.company_name

    client_data = sorted(
        [
            {"client": clients_map.get(cid, "Other"), "revenue": amt}
            for cid, amt in by_client.items()
        ],
        key=lambda x: x["revenue"],
        reverse=True,
    )[:10]

    # Totals
    total_collected = sum(inv.amount for inv in paid_invoices)
    total_outstanding = sum(
        inv.amount for inv in all_invoices if inv.status in ("sent", "overdue")
    )
    total_overdue = sum(inv.amount for inv in all_invoices if inv.status == "overdue")

    # This month
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    this_month = sum(
        inv.amount for inv in paid_invoices
        if (inv.paid_date or inv.issued_date) >= month_start
    )
    # Last month
    last_month_start = (month_start - timedelta(days=1)).replace(day=1)
    last_month = sum(
        inv.amount for inv in paid_invoices
        if last_month_start <= (inv.paid_date or inv.issued_date) < month_start
    )

    growth = ((this_month - last_month) / last_month * 100) if last_month > 0 else 0

    return {
        "monthly": monthly_data,
        "by_client": client_data,
        "total_collected": total_collected,
        "total_outstanding": total_outstanding,
        "total_overdue": total_overdue,
        "this_month": this_month,
        "last_month": last_month,
        "growth_pct": round(growth, 1),
    }


# ---------------------------------------------------------------------------
# GET /api/analytics/clients
# ---------------------------------------------------------------------------


@router.get("/clients")
async def get_client_analytics(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Client metrics: pipeline funnel, deal sizes, acquisition."""
    uid = user.id

    result = await db.execute(select(Client).where(Client.user_id == uid))
    clients = result.scalars().all()

    # Pipeline funnel
    stages = ["lead", "contacted", "proposal", "negotiation", "won", "lost"]
    funnel = []
    for stage in stages:
        count = sum(1 for c in clients if c.pipeline_stage == stage)
        value = sum(c.deal_value for c in clients if c.pipeline_stage == stage)
        funnel.append({"stage": stage, "count": count, "value": value})

    # Won vs lost
    won = sum(1 for c in clients if c.pipeline_stage == "won")
    lost = sum(1 for c in clients if c.pipeline_stage == "lost")
    total_active = len(clients) - lost
    win_rate = round((won / (won + lost) * 100) if (won + lost) > 0 else 0, 1)

    # Average deal value
    deal_values = [c.deal_value for c in clients if c.deal_value > 0 and c.pipeline_stage != "lost"]
    avg_deal = round(sum(deal_values) / len(deal_values), 2) if deal_values else 0

    # Top clients by deal value
    top = sorted(
        [{"name": c.company_name, "value": c.deal_value, "stage": c.pipeline_stage}
         for c in clients if c.pipeline_stage != "lost"],
        key=lambda x: x["value"],
        reverse=True,
    )[:10]

    # Industry breakdown
    industries = {}
    for c in clients:
        ind = c.industry or "Unknown"
        industries[ind] = industries.get(ind, 0) + 1
    industry_data = [{"industry": k, "count": v} for k, v in sorted(industries.items(), key=lambda x: -x[1])][:8]

    return {
        "funnel": funnel,
        "total_clients": len(clients),
        "active_clients": total_active,
        "won": won,
        "lost": lost,
        "win_rate": win_rate,
        "avg_deal_value": avg_deal,
        "top_clients": top,
        "by_industry": industry_data,
    }


# ---------------------------------------------------------------------------
# GET /api/analytics/productivity
# ---------------------------------------------------------------------------


@router.get("/productivity")
async def get_productivity_analytics(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Productivity metrics: email volume, meetings, tasks."""
    uid = user.id
    now = datetime.now(timezone.utc)

    # Email stats (last 30 days)
    thirty_days_ago = now - timedelta(days=30)

    total_emails = (await db.execute(
        select(func.count()).select_from(
            select(Email).where(Email.user_id == uid, Email.received_at >= thirty_days_ago).subquery()
        )
    )).scalar() or 0

    read_emails = (await db.execute(
        select(func.count()).select_from(
            select(Email).where(
                Email.user_id == uid,
                Email.received_at >= thirty_days_ago,
                Email.is_read == True,  # noqa: E712
            ).subquery()
        )
    )).scalar() or 0

    # Meetings (last 30 days)
    total_meetings = (await db.execute(
        select(func.count()).select_from(
            select(CalendarEvent).where(
                CalendarEvent.user_id == uid,
                CalendarEvent.start_time >= thirty_days_ago,
                CalendarEvent.is_meeting == True,  # noqa: E712
            ).subquery()
        )
    )).scalar() or 0

    # Tasks
    tasks_completed = (await db.execute(
        select(func.count()).select_from(
            select(Task).where(Task.user_id == uid, Task.status == "done").subquery()
        )
    )).scalar() or 0

    tasks_total = (await db.execute(
        select(func.count()).select_from(
            select(Task).where(Task.user_id == uid).subquery()
        )
    )).scalar() or 0

    tasks_overdue = (await db.execute(
        select(func.count()).select_from(
            select(Task).where(
                Task.user_id == uid,
                Task.status != "done",
                Task.due_date < now,
            ).subquery()
        )
    )).scalar() or 0

    # Weekly email volume (last 8 weeks)
    weekly_emails = []
    for i in range(7, -1, -1):
        week_start = now - timedelta(weeks=i + 1)
        week_end = now - timedelta(weeks=i)
        count = (await db.execute(
            select(func.count()).select_from(
                select(Email).where(
                    Email.user_id == uid,
                    Email.received_at >= week_start,
                    Email.received_at < week_end,
                ).subquery()
            )
        )).scalar() or 0
        weekly_emails.append({
            "week": week_start.strftime("W%U"),
            "count": count,
        })

    return {
        "emails_received": total_emails,
        "emails_read": read_emails,
        "email_response_rate": round(read_emails / total_emails * 100, 1) if total_emails > 0 else 0,
        "meetings_held": total_meetings,
        "tasks_completed": tasks_completed,
        "tasks_total": tasks_total,
        "tasks_overdue": tasks_overdue,
        "completion_rate": round(tasks_completed / tasks_total * 100, 1) if tasks_total > 0 else 0,
        "weekly_emails": weekly_emails,
    }


# ---------------------------------------------------------------------------
# GET /api/analytics/insights
# ---------------------------------------------------------------------------


@router.get("/insights")
async def get_ai_insights(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """AI-generated business insights."""
    uid = user.id
    now = datetime.now(timezone.utc)

    # Gather data for insights
    overdue_invoices = (await db.execute(
        select(func.count()).select_from(
            select(Invoice).where(Invoice.user_id == uid, Invoice.status == "overdue").subquery()
        )
    )).scalar() or 0

    stale_leads = (await db.execute(
        select(func.count()).select_from(
            select(Client).where(
                Client.user_id == uid,
                Client.pipeline_stage.in_(["lead", "contacted"]),
                Client.last_contacted < now - timedelta(days=7),
            ).subquery()
        )
    )).scalar() or 0

    # Build insights
    insights = []

    if overdue_invoices > 0:
        insights.append({
            "type": "warning",
            "title": f"{overdue_invoices} overdue invoice{'s' if overdue_invoices > 1 else ''}",
            "message": "Follow up on overdue invoices to improve cash flow. Consider sending automated reminders.",
        })

    if stale_leads > 0:
        insights.append({
            "type": "warning",
            "title": f"{stale_leads} stale lead{'s' if stale_leads > 1 else ''} need attention",
            "message": "These leads haven't been contacted in over 7 days. Reach out to keep the pipeline moving.",
        })

    # Demo insights
    if settings.DEMO_MODE:
        insights.extend([
            {
                "type": "positive",
                "title": "Revenue up 12% this month",
                "message": "Driven by 3 new SaaS client deals. TechVision GmbH and CloudFirst are your top contributors.",
            },
            {
                "type": "positive",
                "title": "Email response time improved 30%",
                "message": "AI email classification and draft replies are saving an average of 45 minutes per day.",
            },
            {
                "type": "info",
                "title": "Recommendation: Focus on enterprise clients",
                "message": "Your win rate is 15% higher for deals over EUR 10,000. Consider targeting larger accounts.",
            },
            {
                "type": "info",
                "title": "Automation ROI: 12 hours saved this month",
                "message": "Invoice reminders, meeting prep, and email classification saved the most time.",
            },
        ])

    return {"insights": insights}
