"""Demo data seeder — loads JSON sample data into the database on startup."""

import json
from datetime import datetime
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database import (
    Activity,
    ActivityLog,
    Alert,
    Attachment,
    Automation,
    CalendarEvent,
    Company,
    Contact,
    Deal,
    Email,
    Invoice,
    Membership,
    Product,
    PurchaseOrder,
    PurchaseOrderItem,
    Report,
    SalesOrder,
    SalesOrderItem,
    Signal,
    StockMovement,
    Task,
    User,
    Warehouse,
    Workspace,
)

DEMO_DIR = Path(__file__).resolve().parent.parent / "demo"
DEMO_USER_ID = "demo-user-001"
DEMO_WORKSPACE_ID = "demo-workspace-001"


def _load_json(filename: str) -> list | dict:
    filepath = DEMO_DIR / filename
    if not filepath.exists():
        print(f"  [demo] WARNING: {filepath} not found, skipping")
        return []
    with open(filepath, "r", encoding="utf-8") as f:
        return json.load(f)


def _parse_dt(val: str | None) -> datetime | None:
    if val is None:
        return None
    dt = datetime.fromisoformat(val.replace("Z", "+00:00"))
    return dt.replace(tzinfo=None)


async def seed_demo_data(db: AsyncSession) -> None:
    """Seed the database with demo data if DEMO_MODE is enabled."""
    # Check if demo user already has data (use email as idempotency check)
    result = await db.execute(select(Email).where(Email.user_id == DEMO_USER_ID).limit(1))
    if result.scalar_one_or_none() is not None:
        print("  [demo] Demo data already seeded, skipping")
        return

    print("  [demo] Seeding demo data...")

    # ------------------------------------------------------------------ User
    result = await db.execute(select(User).where(User.id == DEMO_USER_ID))
    user = result.scalar_one_or_none()
    if user is None:
        user_data = _load_json("demo_user.json")
        user = User(
            id=user_data["id"],
            email=user_data["email"],
            name=user_data["name"],
            picture=user_data.get("picture"),
            plan=user_data.get("plan", "pro"),
            timezone=user_data.get("timezone", "Europe/Berlin"),
            onboarding_completed=user_data.get("onboarding_completed", True),
        )
        db.add(user)
        await db.flush()
        print("  [demo] Created demo user")

    # ------------------------------------------------------------ Workspace
    result = await db.execute(select(Workspace).where(Workspace.id == DEMO_WORKSPACE_ID))
    workspace = result.scalar_one_or_none()
    if workspace is None:
        ws_data = _load_json("demo_workspace.json")
        workspace = Workspace(
            id=ws_data["id"],
            name=ws_data["name"],
            slug=ws_data.get("slug"),
            owner_id=DEMO_USER_ID,
            default_currency=ws_data.get("default_currency", "EUR"),
            tax_rate=ws_data.get("tax_rate", 0.0),
        )
        db.add(workspace)
        await db.flush()
        # Owner membership
        db.add(Membership(
            workspace_id=DEMO_WORKSPACE_ID,
            user_id=DEMO_USER_ID,
            role="owner",
        ))
        await db.flush()
        print("  [demo] Created demo workspace")

    # ------------------------------------------------------------ Warehouses
    warehouses = _load_json("demo_warehouses.json")
    for wh in warehouses:
        db.add(Warehouse(
            id=wh["id"],
            workspace_id=DEMO_WORKSPACE_ID,
            name=wh["name"],
            location=wh.get("location"),
            is_default=wh.get("is_default", False),
        ))
    await db.flush()
    print(f"  [demo] Seeded {len(warehouses)} warehouses")

    # ------------------------------------------------------------ Companies
    companies = _load_json("demo_companies.json")
    for c in companies:
        db.add(Company(
            id=c["id"],
            workspace_id=DEMO_WORKSPACE_ID,
            company_name=c["company_name"],
            company_type=c.get("company_type", "customer"),
            contact_name=c.get("contact_name"),
            email=c.get("email"),
            phone=c.get("phone"),
            website=c.get("website"),
            industry=c.get("industry"),
            location=c.get("location"),
            pipeline_stage=c.get("pipeline_stage", "lead"),
            deal_value=c.get("deal_value"),
            notes=c.get("notes"),
            last_contacted=_parse_dt(c.get("last_contacted")),
        ))
    await db.flush()
    print(f"  [demo] Seeded {len(companies)} companies")

    # ------------------------------------------------------------ Products
    products = _load_json("demo_products.json")
    for p in products:
        db.add(Product(
            id=p["id"],
            workspace_id=DEMO_WORKSPACE_ID,
            sku=p.get("sku"),
            name=p["name"],
            description=p.get("description"),
            category=p.get("category"),
            unit=p.get("unit", "pcs"),
            cost_price=p.get("cost_price"),
            sale_price=p.get("sale_price"),
            reorder_level=p.get("reorder_level", 0),
            track_inventory=p.get("track_inventory", True),
            is_active=p.get("is_active", True),
        ))
    await db.flush()
    print(f"  [demo] Seeded {len(products)} products")

    # -------------------------------------------------------- Stock Movements
    movements = _load_json("demo_stock_movements.json")
    for m in movements:
        db.add(StockMovement(
            id=m["id"],
            workspace_id=DEMO_WORKSPACE_ID,
            product_id=m["product_id"],
            warehouse_id=m["warehouse_id"],
            type=m["type"],
            quantity_delta=m["quantity_delta"],
            reference_type=m.get("reference_type"),
            reference_id=m.get("reference_id"),
            notes=m.get("notes"),
            created_by=DEMO_USER_ID,
        ))
    await db.flush()
    print(f"  [demo] Seeded {len(movements)} stock movements")

    # ---------------------------------------------------------- Sales Orders
    sales_orders = _load_json("demo_sales_orders.json")
    for so in sales_orders:
        db.add(SalesOrder(
            id=so["id"],
            workspace_id=DEMO_WORKSPACE_ID,
            order_number=so["order_number"],
            company_id=so.get("company_id"),
            deal_id=so.get("deal_id"),
            status=so.get("status", "draft"),
            total_amount=so.get("total_amount", 0.0),
            currency=so.get("currency", "EUR"),
            notes=so.get("notes"),
            due_date=_parse_dt(so.get("due_date")),
        ))
    await db.flush()
    print(f"  [demo] Seeded {len(sales_orders)} sales orders")

    so_items = _load_json("demo_sales_order_items.json")
    for item in so_items:
        db.add(SalesOrderItem(
            id=item["id"],
            order_id=item["order_id"],
            product_id=item["product_id"],
            quantity=item["quantity"],
            unit_price=item["unit_price"],
            discount=item.get("discount", 0.0),
            fulfilled_quantity=item.get("fulfilled_quantity", 0.0),
        ))
    await db.flush()
    print(f"  [demo] Seeded {len(so_items)} sales order items")

    # ------------------------------------------------------- Purchase Orders
    purchase_orders = _load_json("demo_purchase_orders.json")
    for po in purchase_orders:
        db.add(PurchaseOrder(
            id=po["id"],
            workspace_id=DEMO_WORKSPACE_ID,
            order_number=po["order_number"],
            supplier_id=po.get("supplier_id"),
            status=po.get("status", "draft"),
            total_amount=po.get("total_amount", 0.0),
            currency=po.get("currency", "EUR"),
            expected_date=_parse_dt(po.get("expected_date")),
            notes=po.get("notes"),
        ))
    await db.flush()
    print(f"  [demo] Seeded {len(purchase_orders)} purchase orders")

    po_items = _load_json("demo_purchase_order_items.json")
    for item in po_items:
        db.add(PurchaseOrderItem(
            id=item["id"],
            order_id=item["order_id"],
            product_id=item["product_id"],
            quantity_ordered=item["quantity_ordered"],
            quantity_received=item.get("quantity_received", 0.0),
            unit_cost=item["unit_cost"],
        ))
    await db.flush()
    print(f"  [demo] Seeded {len(po_items)} purchase order items")

    # ------------------------------------------------------------- Contacts
    contacts = _load_json("demo_contacts.json")
    for c in contacts:
        db.add(Contact(
            id=c["id"],
            workspace_id=DEMO_WORKSPACE_ID,
            company_id=c.get("company_id"),
            first_name=c["first_name"],
            last_name=c.get("last_name"),
            email=c.get("email"),
            phone=c.get("phone"),
            title=c.get("title"),
            notes=c.get("notes"),
        ))
    await db.flush()
    print(f"  [demo] Seeded {len(contacts)} contacts")

    # --------------------------------------------------------------- Deals
    deals = _load_json("demo_deals.json")
    for d in deals:
        db.add(Deal(
            id=d["id"],
            workspace_id=DEMO_WORKSPACE_ID,
            company_id=d.get("company_id"),
            contact_id=d.get("contact_id"),
            owner_id=DEMO_USER_ID,
            title=d["title"],
            value=d.get("value"),
            currency=d.get("currency", "EUR"),
            stage=d.get("stage", "lead"),
            probability=d.get("probability", 10),
            expected_close_date=_parse_dt(d.get("expected_close_date")),
            notes=d.get("notes"),
        ))
    await db.flush()
    print(f"  [demo] Seeded {len(deals)} deals")

    # ------------------------------------------------------------- Emails
    emails = _load_json("demo_emails.json")
    for e in emails:
        db.add(Email(
            id=e["id"],
            user_id=DEMO_USER_ID,
            gmail_id=e.get("gmail_id"),
            from_addr=e["from_addr"],
            to_addr=e["to_addr"],
            subject=e["subject"],
            snippet=e.get("snippet"),
            body_preview=e.get("body_preview"),
            category=e.get("category"),
            ai_summary=e.get("ai_summary"),
            is_read=e.get("is_read", False),
            is_starred=e.get("is_starred", False),
            needs_reply=e.get("needs_reply", False),
            reply_draft=e.get("reply_draft"),
            received_at=_parse_dt(e["received_at"]),
        ))
    await db.flush()
    print(f"  [demo] Seeded {len(emails)} emails")

    # -------------------------------------------------------- Calendar Events
    events = _load_json("demo_events.json")
    for ev in events:
        db.add(CalendarEvent(
            id=ev["id"],
            user_id=DEMO_USER_ID,
            google_event_id=ev.get("google_event_id"),
            title=ev["title"],
            description=ev.get("description"),
            start_time=_parse_dt(ev["start_time"]),
            end_time=_parse_dt(ev["end_time"]),
            location=ev.get("location"),
            attendees=ev.get("attendees"),
            prep_brief=ev.get("prep_brief"),
            action_items=ev.get("action_items"),
            is_meeting=ev.get("is_meeting", True),
        ))
    await db.flush()
    print(f"  [demo] Seeded {len(events)} calendar events")

    # ------------------------------------------------------------ Invoices
    invoices = _load_json("demo_invoices.json")
    for inv in invoices:
        db.add(Invoice(
            id=inv["id"],
            user_id=DEMO_USER_ID,
            company_id=inv.get("client_id") or inv.get("company_id"),
            invoice_number=inv["invoice_number"],
            amount=inv["amount"],
            currency=inv.get("currency", "EUR"),
            status=inv.get("status", "draft"),
            issued_date=_parse_dt(inv["issued_date"]),
            due_date=_parse_dt(inv["due_date"]),
            paid_date=_parse_dt(inv.get("paid_date")),
            reminder_count=inv.get("reminder_count", 0),
            source=inv.get("source", "manual"),
            notes=inv.get("notes"),
        ))
    await db.flush()
    print(f"  [demo] Seeded {len(invoices)} invoices")

    # --------------------------------------------------------------- Tasks
    tasks = _load_json("demo_tasks.json")
    for t in tasks:
        db.add(Task(
            id=t["id"],
            user_id=DEMO_USER_ID,
            company_id=t.get("client_id") or t.get("company_id"),
            title=t["title"],
            description=t.get("description"),
            priority=t.get("priority", "medium"),
            status=t.get("status", "todo"),
            due_date=_parse_dt(t.get("due_date")),
            source=t.get("source", "manual"),
        ))
    await db.flush()
    print(f"  [demo] Seeded {len(tasks)} tasks")

    # -------------------------------------------------------------- Alerts
    alerts = _load_json("demo_alerts.json")
    for a in alerts:
        db.add(Alert(
            id=a["id"],
            user_id=DEMO_USER_ID,
            type=a["type"],
            title=a["title"],
            message=a["message"],
            severity=a.get("severity", "info"),
            is_read=a.get("is_read", False),
            related_entity_type=a.get("related_entity_type"),
            related_entity_id=a.get("related_entity_id"),
        ))
    await db.flush()
    print(f"  [demo] Seeded {len(alerts)} alerts")

    # --------------------------------------------------------- Automations
    automations = _load_json("demo_automations.json")
    for au in automations:
        db.add(Automation(
            id=au["id"],
            user_id=DEMO_USER_ID,
            name=au["name"],
            description=au.get("description"),
            n8n_workflow_id=au.get("n8n_workflow_id"),
            trigger_type=au.get("trigger_type", "manual"),
            is_active=au.get("is_active", False),
            last_run=_parse_dt(au.get("last_run")),
            run_count=au.get("run_count", 0),
        ))
    await db.flush()
    print(f"  [demo] Seeded {len(automations)} automations")

    # -------------------------------------------------------------- Reports
    reports = _load_json("demo_reports.json")
    for r in reports:
        db.add(Report(
            id=r["id"],
            user_id=DEMO_USER_ID,
            type=r["type"],
            title=r["title"],
            content=r.get("content"),
            period_start=_parse_dt(r["period_start"]),
            period_end=_parse_dt(r["period_end"]),
        ))
    await db.flush()
    print(f"  [demo] Seeded {len(reports)} reports")

    # --------------------------------------------------------- Activity Log
    activities = _load_json("demo_activity.json")
    for ac in activities:
        db.add(ActivityLog(
            id=ac["id"],
            user_id=DEMO_USER_ID,
            entity_type=ac["entity_type"],
            entity_id=ac["entity_id"],
            action=ac["action"],
            description=ac["description"],
        ))
    await db.flush()
    print(f"  [demo] Seeded {len(activities)} activity log entries")

    # --------------------------------------------------------------- Signals
    signals = _load_json("demo_signals.json")
    for s in signals:
        db.add(Signal(
            id=s["id"],
            workspace_id=DEMO_WORKSPACE_ID,
            signal_type=s["signal_type"],
            severity=s.get("severity", "warning"),
            entity_type=s["entity_type"],
            entity_id=s["entity_id"],
            title=s["title"],
            body=s.get("body"),
            is_read=s.get("is_read", False),
            is_dismissed=s.get("is_dismissed", False),
        ))
    await db.flush()
    print(f"  [demo] Seeded {len(signals)} signals")

    await db.commit()
    print("  [demo] Demo data seeding complete!")
