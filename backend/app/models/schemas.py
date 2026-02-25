"""Pydantic request/response schemas for all entities."""

from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field, model_validator


# ---------------------------------------------------------------------------
# Shared / Pagination
# ---------------------------------------------------------------------------


class PaginatedResponse(BaseModel):
    items: list[Any]
    total: int
    page: int = 1
    page_size: int = 20
    pages: int = 1


# ---------------------------------------------------------------------------
# User
# ---------------------------------------------------------------------------


class UserBase(BaseModel):
    email: str = Field(..., max_length=254)
    name: str = Field(..., max_length=200)
    picture: Optional[str] = Field(None, max_length=500)
    plan: str = Field("free", max_length=50)
    timezone: str = Field("Europe/Berlin", max_length=100)


class UserCreate(UserBase):
    pass


class UserResponse(UserBase):
    id: str
    onboarding_completed: bool = False
    created_at: datetime

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=200)
    picture: Optional[str] = Field(None, max_length=500)
    timezone: Optional[str] = Field(None, max_length=100)
    plan: Optional[str] = Field(None, max_length=50)
    onboarding_completed: Optional[bool] = None


# ---------------------------------------------------------------------------
# Email
# ---------------------------------------------------------------------------


class EmailBase(BaseModel):
    from_addr: str = Field(..., max_length=254)
    to_addr: str = Field(..., max_length=254)
    subject: str = Field(..., max_length=500)
    snippet: Optional[str] = Field(None, max_length=500)
    body_preview: Optional[str] = Field(None, max_length=5000)
    received_at: datetime


class EmailCreate(EmailBase):
    gmail_id: Optional[str] = Field(None, max_length=200)
    category: Optional[str] = Field(None, max_length=50)
    ai_summary: Optional[str] = Field(None, max_length=2000)


class EmailResponse(EmailBase):
    id: str
    user_id: str
    gmail_id: Optional[str] = None
    category: Optional[str] = None
    ai_summary: Optional[str] = None
    is_read: bool = False
    is_starred: bool = False
    needs_reply: bool = False
    reply_draft: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class EmailClassifyResponse(BaseModel):
    id: str
    category: str
    ai_summary: str
    needs_reply: bool


class EmailDraftReplyResponse(BaseModel):
    id: str
    reply_draft: str
    tone: str


class EmailStatsResponse(BaseModel):
    total: int
    unread: int
    needs_reply: int
    by_category: dict[str, int]


# ---------------------------------------------------------------------------
# Calendar Event
# ---------------------------------------------------------------------------


class CalendarEventBase(BaseModel):
    title: str = Field(..., max_length=500)
    description: Optional[str] = Field(None, max_length=5000)
    start_time: datetime
    end_time: datetime
    location: Optional[str] = Field(None, max_length=500)
    attendees: Optional[list[dict]] = None
    is_meeting: bool = True


class CalendarEventCreate(CalendarEventBase):
    google_event_id: Optional[str] = Field(None, max_length=200)


class CalendarEventResponse(CalendarEventBase):
    id: str
    user_id: str
    google_event_id: Optional[str] = None
    prep_brief: Optional[str] = None
    action_items: Optional[list[str]] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class CalendarEventUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=500)
    description: Optional[str] = Field(None, max_length=5000)
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    location: Optional[str] = Field(None, max_length=500)
    attendees: Optional[list[dict]] = None


class FreeSlotResponse(BaseModel):
    start: datetime
    end: datetime
    duration_minutes: int


# ---------------------------------------------------------------------------
# Client
# ---------------------------------------------------------------------------


class ClientBase(BaseModel):
    company_name: str = Field(..., max_length=200)
    contact_name: Optional[str] = Field(None, max_length=200)
    email: Optional[str] = Field(None, max_length=254)
    phone: Optional[str] = Field(None, max_length=50)
    website: Optional[str] = Field(None, max_length=500)
    industry: Optional[str] = Field(None, max_length=100)
    location: Optional[str] = Field(None, max_length=200)
    pipeline_stage: str = Field("lead", max_length=50)
    deal_value: Optional[float] = None
    notes: Optional[str] = Field(None, max_length=5000)


class ClientCreate(ClientBase):
    pass


class ClientResponse(ClientBase):
    id: str
    workspace_id: str
    company_type: str = "customer"
    enrichment_data: Optional[dict] = None
    last_contacted: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ClientUpdate(BaseModel):
    company_name: Optional[str] = Field(None, max_length=200)
    contact_name: Optional[str] = Field(None, max_length=200)
    email: Optional[str] = Field(None, max_length=254)
    phone: Optional[str] = Field(None, max_length=50)
    website: Optional[str] = Field(None, max_length=500)
    industry: Optional[str] = Field(None, max_length=100)
    location: Optional[str] = Field(None, max_length=200)
    pipeline_stage: Optional[str] = Field(None, max_length=50)
    deal_value: Optional[float] = None
    notes: Optional[str] = Field(None, max_length=5000)


class PipelineStageUpdate(BaseModel):
    pipeline_stage: str = Field(..., max_length=50)


class PipelineResponse(BaseModel):
    stage: str
    clients: list[ClientResponse]
    count: int
    total_value: float


# ---------------------------------------------------------------------------
# Invoice
# ---------------------------------------------------------------------------


class InvoiceBase(BaseModel):
    invoice_number: str = Field(..., max_length=100)
    amount: float
    currency: str = Field("EUR", max_length=10)
    status: str = Field("draft", max_length=50)
    issued_date: datetime
    due_date: datetime
    notes: Optional[str] = Field(None, max_length=5000)


class InvoiceCreate(InvoiceBase):
    company_id: Optional[str] = None
    # backward compat: accept client_id too
    client_id: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def coerce_client_id(cls, values):
        if isinstance(values, dict) and values.get("client_id") and not values.get("company_id"):
            values["company_id"] = values["client_id"]
        return values


class InvoiceResponse(InvoiceBase):
    id: str
    user_id: str
    company_id: Optional[str] = None
    paid_date: Optional[datetime] = None
    reminder_count: int = 0
    source: str = "manual"
    created_at: datetime

    model_config = {"from_attributes": True}


class InvoiceUpdate(BaseModel):
    amount: Optional[float] = None
    status: Optional[str] = Field(None, max_length=50)
    due_date: Optional[datetime] = None
    paid_date: Optional[datetime] = None
    notes: Optional[str] = Field(None, max_length=5000)


class InvoiceStatsResponse(BaseModel):
    total_outstanding: float
    total_overdue: float
    paid_this_month: float
    monthly_revenue: float
    invoice_count: int
    overdue_count: int


class CashFlowForecastResponse(BaseModel):
    date: str
    expected_income: float
    cumulative: float


# ---------------------------------------------------------------------------
# Task
# ---------------------------------------------------------------------------


class TaskBase(BaseModel):
    title: str = Field(..., max_length=500)
    description: Optional[str] = Field(None, max_length=5000)
    priority: str = Field("medium", max_length=50)
    status: str = Field("todo", max_length=50)
    due_date: Optional[datetime] = None


class TaskCreate(TaskBase):
    company_id: Optional[str] = None
    client_id: Optional[str] = None  # backward compat
    source: str = Field("manual", max_length=50)

    @model_validator(mode="before")
    @classmethod
    def coerce_client_id(cls, values):
        if isinstance(values, dict) and values.get("client_id") and not values.get("company_id"):
            values["company_id"] = values["client_id"]
        return values


class TaskResponse(TaskBase):
    id: str
    user_id: str
    company_id: Optional[str] = None
    source: str = "manual"
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=500)
    description: Optional[str] = Field(None, max_length=5000)
    priority: Optional[str] = Field(None, max_length=50)
    status: Optional[str] = Field(None, max_length=50)
    due_date: Optional[datetime] = None


# ---------------------------------------------------------------------------
# Alert
# ---------------------------------------------------------------------------


class AlertBase(BaseModel):
    type: str = Field(..., max_length=100)
    title: str = Field(..., max_length=300)
    message: str = Field(..., max_length=2000)
    severity: str = Field("info", max_length=50)


class AlertCreate(AlertBase):
    related_entity_type: Optional[str] = Field(None, max_length=100)
    related_entity_id: Optional[str] = None


class AlertResponse(AlertBase):
    id: str
    user_id: str
    is_read: bool = False
    related_entity_type: Optional[str] = None
    related_entity_id: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class AlertCountResponse(BaseModel):
    unread: int
    critical: int
    warning: int
    info: int


# ---------------------------------------------------------------------------
# Automation
# ---------------------------------------------------------------------------


class AutomationBase(BaseModel):
    name: str = Field(..., max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    trigger_type: str = Field("manual", max_length=50)


class AutomationCreate(AutomationBase):
    n8n_workflow_id: Optional[str] = Field(None, max_length=200)


class AutomationResponse(AutomationBase):
    id: str
    user_id: str
    n8n_workflow_id: Optional[str] = None
    is_active: bool = False
    last_run: Optional[datetime] = None
    run_count: int = 0
    created_at: datetime

    model_config = {"from_attributes": True}


class AutomationToggle(BaseModel):
    is_active: bool


# ---------------------------------------------------------------------------
# Report
# ---------------------------------------------------------------------------


class ReportBase(BaseModel):
    type: str = Field(..., max_length=50)  # daily / weekly / monthly
    title: str = Field(..., max_length=300)
    period_start: datetime
    period_end: datetime


class ReportCreate(ReportBase):
    content: Optional[dict] = None


class ReportResponse(ReportBase):
    id: str
    user_id: str
    content: Optional[dict] = None
    created_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Activity Log
# ---------------------------------------------------------------------------


class ActivityLogResponse(BaseModel):
    id: str
    user_id: str
    entity_type: str
    entity_id: str
    action: str
    description: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Dashboard
# ---------------------------------------------------------------------------


class DashboardStatsResponse(BaseModel):
    unread_emails: int
    today_meetings: int
    outstanding_invoices: float
    overdue_invoices: int
    active_clients: int
    pending_tasks: int
    unread_alerts: int


class MorningBriefingResponse(BaseModel):
    greeting: str
    summary: str
    priorities: list[dict]  # [{title, description, action_type, entity_id}]
    email_stats: EmailStatsResponse
    today_events: list[CalendarEventResponse]
    overdue_invoices: list[InvoiceResponse]
    stale_leads: list[ClientResponse]


class CommandBarRequest(BaseModel):
    command: str = Field(..., min_length=1, max_length=500)


class CommandBarResponse(BaseModel):
    action: str
    message: str
    data: Optional[dict] = None
    suggestions: Optional[list[str]] = None


# ---------------------------------------------------------------------------
# Workspace & Membership
# ---------------------------------------------------------------------------


class WorkspaceResponse(BaseModel):
    id: str
    name: str
    slug: Optional[str] = None
    logo_url: Optional[str] = None
    owner_id: str
    default_currency: str = "EUR"
    tax_rate: float = 0.0
    created_at: datetime

    model_config = {"from_attributes": True}


class WorkspaceUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=200)
    default_currency: Optional[str] = Field(None, max_length=3)
    tax_rate: Optional[float] = None
    logo_url: Optional[str] = Field(None, max_length=500)


class MembershipResponse(BaseModel):
    id: str
    workspace_id: str
    user_id: str
    role: str
    accepted_at: Optional[datetime] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class InviteMemberRequest(BaseModel):
    email: str = Field(..., max_length=254)
    role: str = Field("viewer", max_length=20)


class MemberRoleUpdate(BaseModel):
    role: str = Field(..., max_length=20)


# ---------------------------------------------------------------------------
# Company (enhanced Client — same /api/clients contract)
# ---------------------------------------------------------------------------


class CompanyCreate(BaseModel):
    company_name: str = Field(..., max_length=200)
    company_type: str = Field("customer", max_length=20)
    contact_name: Optional[str] = Field(None, max_length=200)
    email: Optional[str] = Field(None, max_length=254)
    phone: Optional[str] = Field(None, max_length=50)
    website: Optional[str] = Field(None, max_length=500)
    industry: Optional[str] = Field(None, max_length=100)
    location: Optional[str] = Field(None, max_length=200)
    pipeline_stage: str = Field("lead", max_length=50)
    deal_value: Optional[float] = None
    notes: Optional[str] = Field(None, max_length=5000)


class CompanyUpdate(BaseModel):
    company_name: Optional[str] = Field(None, max_length=200)
    company_type: Optional[str] = Field(None, max_length=20)
    contact_name: Optional[str] = Field(None, max_length=200)
    email: Optional[str] = Field(None, max_length=254)
    phone: Optional[str] = Field(None, max_length=50)
    website: Optional[str] = Field(None, max_length=500)
    industry: Optional[str] = Field(None, max_length=100)
    location: Optional[str] = Field(None, max_length=200)
    pipeline_stage: Optional[str] = Field(None, max_length=50)
    deal_value: Optional[float] = None
    notes: Optional[str] = Field(None, max_length=5000)


class CompanyResponse(BaseModel):
    id: str
    workspace_id: str
    company_name: str
    company_type: str
    contact_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    industry: Optional[str] = None
    location: Optional[str] = None
    pipeline_stage: str
    deal_value: Optional[float] = None
    notes: Optional[str] = None
    enrichment_data: Optional[dict] = None
    last_contacted: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Product
# ---------------------------------------------------------------------------


class ProductCreate(BaseModel):
    sku: Optional[str] = Field(None, max_length=100)
    name: str = Field(..., max_length=200)
    description: Optional[str] = Field(None, max_length=2000)
    category: Optional[str] = Field(None, max_length=100)
    unit: str = Field("pcs", max_length=20)
    cost_price: Optional[float] = None
    sale_price: Optional[float] = None
    reorder_level: int = Field(0, ge=0)
    track_inventory: bool = True
    is_active: bool = True


class ProductUpdate(BaseModel):
    sku: Optional[str] = Field(None, max_length=100)
    name: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = Field(None, max_length=2000)
    category: Optional[str] = Field(None, max_length=100)
    unit: Optional[str] = Field(None, max_length=20)
    cost_price: Optional[float] = None
    sale_price: Optional[float] = None
    reorder_level: Optional[int] = Field(None, ge=0)
    track_inventory: Optional[bool] = None
    is_active: Optional[bool] = None


class ProductResponse(BaseModel):
    id: str
    workspace_id: str
    sku: Optional[str] = None
    name: str
    description: Optional[str] = None
    category: Optional[str] = None
    unit: str
    cost_price: Optional[float] = None
    sale_price: Optional[float] = None
    reorder_level: int
    track_inventory: bool
    is_active: bool
    created_at: datetime
    updated_at: datetime
    # populated by stock query
    stock_on_hand: Optional[float] = None
    stock_available: Optional[float] = None

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Warehouse
# ---------------------------------------------------------------------------


class WarehouseCreate(BaseModel):
    name: str = Field(..., max_length=200)
    location: Optional[str] = Field(None, max_length=500)
    is_default: bool = False


class WarehouseUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=200)
    location: Optional[str] = Field(None, max_length=500)
    is_default: Optional[bool] = None


class WarehouseResponse(BaseModel):
    id: str
    workspace_id: str
    name: str
    location: Optional[str] = None
    is_default: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Inventory / Stock Movement
# ---------------------------------------------------------------------------


class StockAdjustmentRequest(BaseModel):
    product_id: str
    warehouse_id: str
    quantity_delta: float
    notes: Optional[str] = Field(None, max_length=500)


class StockMovementResponse(BaseModel):
    id: str
    workspace_id: str
    product_id: str
    warehouse_id: str
    type: str
    quantity_delta: float
    reference_type: Optional[str] = None
    reference_id: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    # populated joins
    product_name: Optional[str] = None
    warehouse_name: Optional[str] = None

    model_config = {"from_attributes": True}


class StockLevelResponse(BaseModel):
    product_id: str
    product_name: str
    sku: Optional[str] = None
    warehouse_id: str
    warehouse_name: str
    on_hand: float
    reserved: float
    available: float
    reorder_level: int
    is_low_stock: bool


# ---------------------------------------------------------------------------
# Sales Order
# ---------------------------------------------------------------------------


class SalesOrderItemCreate(BaseModel):
    product_id: str
    quantity: float = Field(..., gt=0)
    unit_price: float = Field(..., ge=0)
    discount: float = Field(0.0, ge=0)


class SalesOrderItemResponse(BaseModel):
    id: str
    product_id: str
    quantity: float
    unit_price: float
    discount: float
    fulfilled_quantity: float
    # populated
    product_name: Optional[str] = None
    product_sku: Optional[str] = None
    subtotal: Optional[float] = None

    model_config = {"from_attributes": True}


class SalesOrderCreate(BaseModel):
    company_id: Optional[str] = None
    deal_id: Optional[str] = None
    currency: str = Field("EUR", max_length=3)
    notes: Optional[str] = Field(None, max_length=2000)
    due_date: Optional[datetime] = None
    items: list[SalesOrderItemCreate] = []


class SalesOrderUpdate(BaseModel):
    company_id: Optional[str] = None
    currency: Optional[str] = Field(None, max_length=3)
    notes: Optional[str] = Field(None, max_length=2000)
    due_date: Optional[datetime] = None


class SalesOrderResponse(BaseModel):
    id: str
    workspace_id: str
    order_number: str
    company_id: Optional[str] = None
    deal_id: Optional[str] = None
    status: str
    total_amount: float
    currency: str
    notes: Optional[str] = None
    due_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    items: list[SalesOrderItemResponse] = []
    company_name: Optional[str] = None

    model_config = {"from_attributes": True}


class FulfillOrderRequest(BaseModel):
    warehouse_id: str
    items: Optional[list[dict]] = None  # [{item_id, quantity}] — None = fulfill all remaining


# ---------------------------------------------------------------------------
# Purchase Order
# ---------------------------------------------------------------------------


class PurchaseOrderItemCreate(BaseModel):
    product_id: str
    quantity_ordered: float = Field(..., gt=0)
    unit_cost: float = Field(..., ge=0)


class PurchaseOrderItemResponse(BaseModel):
    id: str
    product_id: str
    quantity_ordered: float
    quantity_received: float
    unit_cost: float
    product_name: Optional[str] = None
    product_sku: Optional[str] = None
    subtotal: Optional[float] = None

    model_config = {"from_attributes": True}


class PurchaseOrderCreate(BaseModel):
    supplier_id: Optional[str] = None
    currency: str = Field("EUR", max_length=3)
    expected_date: Optional[datetime] = None
    notes: Optional[str] = Field(None, max_length=2000)
    items: list[PurchaseOrderItemCreate] = []


class PurchaseOrderUpdate(BaseModel):
    supplier_id: Optional[str] = None
    currency: Optional[str] = Field(None, max_length=3)
    expected_date: Optional[datetime] = None
    notes: Optional[str] = Field(None, max_length=2000)


class PurchaseOrderResponse(BaseModel):
    id: str
    workspace_id: str
    order_number: str
    supplier_id: Optional[str] = None
    status: str
    total_amount: float
    currency: str
    expected_date: Optional[datetime] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    items: list[PurchaseOrderItemResponse] = []
    supplier_name: Optional[str] = None

    model_config = {"from_attributes": True}


class ReceiveItemsRequest(BaseModel):
    warehouse_id: str
    items: list[dict]  # [{item_id, quantity_received}]


# ---------------------------------------------------------------------------
# Signal
# ---------------------------------------------------------------------------


class SignalResponse(BaseModel):
    id: str
    workspace_id: str
    signal_type: str
    severity: str
    entity_type: str
    entity_id: str
    title: str
    body: Optional[str] = None
    is_read: bool = False
    is_dismissed: bool = False
    created_at: datetime

    model_config = {"from_attributes": True}


class SignalSummary(BaseModel):
    total: int
    critical: int
    warning: int
    info: int
    unread: int


# ---------------------------------------------------------------------------
# Contact
# ---------------------------------------------------------------------------


class ContactCreate(BaseModel):
    company_id: Optional[str] = None
    first_name: str = Field(..., max_length=100)
    last_name: Optional[str] = Field(None, max_length=100)
    email: Optional[str] = Field(None, max_length=254)
    phone: Optional[str] = Field(None, max_length=50)
    title: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = Field(None, max_length=5000)


class ContactUpdate(BaseModel):
    company_id: Optional[str] = None
    first_name: Optional[str] = Field(None, max_length=100)
    last_name: Optional[str] = Field(None, max_length=100)
    email: Optional[str] = Field(None, max_length=254)
    phone: Optional[str] = Field(None, max_length=50)
    title: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = Field(None, max_length=5000)


class ContactResponse(BaseModel):
    id: str
    workspace_id: str
    company_id: Optional[str] = None
    first_name: str
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    title: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    company_name: Optional[str] = None

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Deal
# ---------------------------------------------------------------------------

DEAL_STAGES = ["lead", "qualified", "proposal", "negotiation", "won", "lost"]
DEAL_STAGE_PROBABILITY = {"lead": 10, "qualified": 30, "proposal": 50, "negotiation": 75, "won": 100, "lost": 0}


class DealCreate(BaseModel):
    title: str = Field(..., max_length=255)
    company_id: Optional[str] = None
    contact_id: Optional[str] = None
    value: Optional[float] = None
    currency: str = Field("EUR", max_length=3)
    stage: str = Field("lead", max_length=30)
    probability: Optional[int] = Field(None, ge=0, le=100)
    expected_close_date: Optional[datetime] = None
    notes: Optional[str] = Field(None, max_length=5000)


class DealUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=255)
    company_id: Optional[str] = None
    contact_id: Optional[str] = None
    value: Optional[float] = None
    currency: Optional[str] = Field(None, max_length=3)
    stage: Optional[str] = Field(None, max_length=30)
    probability: Optional[int] = Field(None, ge=0, le=100)
    expected_close_date: Optional[datetime] = None
    notes: Optional[str] = Field(None, max_length=5000)


class DealStageUpdate(BaseModel):
    stage: str = Field(..., max_length=30)
    probability: Optional[int] = Field(None, ge=0, le=100)


class DealResponse(BaseModel):
    id: str
    workspace_id: str
    company_id: Optional[str] = None
    contact_id: Optional[str] = None
    owner_id: Optional[str] = None
    title: str
    value: Optional[float] = None
    currency: str
    stage: str
    probability: int
    expected_close_date: Optional[datetime] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    company_name: Optional[str] = None
    contact_name: Optional[str] = None

    model_config = {"from_attributes": True}


class DealPipelineColumn(BaseModel):
    stage: str
    deals: list[DealResponse]
    count: int
    total_value: float


# ---------------------------------------------------------------------------
# Activity
# ---------------------------------------------------------------------------


class ActivityCreate(BaseModel):
    entity_type: str = Field(..., max_length=30)
    entity_id: str
    activity_type: str = Field(..., max_length=20)
    title: str = Field(..., max_length=255)
    body: Optional[str] = Field(None, max_length=10000)


class ActivityResponse(BaseModel):
    id: str
    workspace_id: str
    user_id: str
    entity_type: str
    entity_id: str
    activity_type: str
    title: str
    body: Optional[str] = None
    created_at: datetime
    user_name: Optional[str] = None

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Attachment
# ---------------------------------------------------------------------------


class AttachmentResponse(BaseModel):
    id: str
    workspace_id: str
    entity_type: str
    entity_id: str
    filename: str
    file_url: str
    file_size: Optional[int] = None
    mime_type: Optional[str] = None
    uploaded_by: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}
