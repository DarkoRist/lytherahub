"""Pydantic request/response schemas for all entities."""

from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel


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
    email: str
    name: str
    picture: Optional[str] = None
    plan: str = "free"
    timezone: str = "Europe/Berlin"


class UserCreate(UserBase):
    pass


class UserResponse(UserBase):
    id: str
    onboarding_completed: bool = False
    created_at: datetime

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    name: Optional[str] = None
    picture: Optional[str] = None
    timezone: Optional[str] = None
    plan: Optional[str] = None
    onboarding_completed: Optional[bool] = None


# ---------------------------------------------------------------------------
# Email
# ---------------------------------------------------------------------------


class EmailBase(BaseModel):
    from_addr: str
    to_addr: str
    subject: str
    snippet: Optional[str] = None
    body_preview: Optional[str] = None
    received_at: datetime


class EmailCreate(EmailBase):
    gmail_id: Optional[str] = None
    category: Optional[str] = None
    ai_summary: Optional[str] = None


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
    title: str
    description: Optional[str] = None
    start_time: datetime
    end_time: datetime
    location: Optional[str] = None
    attendees: Optional[list[dict]] = None
    is_meeting: bool = True


class CalendarEventCreate(CalendarEventBase):
    google_event_id: Optional[str] = None


class CalendarEventResponse(CalendarEventBase):
    id: str
    user_id: str
    google_event_id: Optional[str] = None
    prep_brief: Optional[str] = None
    action_items: Optional[list[str]] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class CalendarEventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    location: Optional[str] = None
    attendees: Optional[list[dict]] = None


class FreeSlotResponse(BaseModel):
    start: datetime
    end: datetime
    duration_minutes: int


# ---------------------------------------------------------------------------
# Client
# ---------------------------------------------------------------------------


class ClientBase(BaseModel):
    company_name: str
    contact_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    industry: Optional[str] = None
    location: Optional[str] = None
    pipeline_stage: str = "lead"
    deal_value: Optional[float] = None
    notes: Optional[str] = None


class ClientCreate(ClientBase):
    pass


class ClientResponse(ClientBase):
    id: str
    user_id: str
    enrichment_data: Optional[dict] = None
    last_contacted: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ClientUpdate(BaseModel):
    company_name: Optional[str] = None
    contact_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    industry: Optional[str] = None
    location: Optional[str] = None
    pipeline_stage: Optional[str] = None
    deal_value: Optional[float] = None
    notes: Optional[str] = None


class PipelineStageUpdate(BaseModel):
    pipeline_stage: str


class PipelineResponse(BaseModel):
    stage: str
    clients: list[ClientResponse]
    count: int
    total_value: float


# ---------------------------------------------------------------------------
# Invoice
# ---------------------------------------------------------------------------


class InvoiceBase(BaseModel):
    invoice_number: str
    amount: float
    currency: str = "EUR"
    status: str = "draft"
    issued_date: datetime
    due_date: datetime
    notes: Optional[str] = None


class InvoiceCreate(InvoiceBase):
    client_id: Optional[str] = None


class InvoiceResponse(InvoiceBase):
    id: str
    user_id: str
    client_id: Optional[str] = None
    paid_date: Optional[datetime] = None
    reminder_count: int = 0
    source: str = "manual"
    created_at: datetime

    model_config = {"from_attributes": True}


class InvoiceUpdate(BaseModel):
    amount: Optional[float] = None
    status: Optional[str] = None
    due_date: Optional[datetime] = None
    paid_date: Optional[datetime] = None
    notes: Optional[str] = None


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
    title: str
    description: Optional[str] = None
    priority: str = "medium"
    status: str = "todo"
    due_date: Optional[datetime] = None


class TaskCreate(TaskBase):
    client_id: Optional[str] = None
    source: str = "manual"


class TaskResponse(TaskBase):
    id: str
    user_id: str
    client_id: Optional[str] = None
    source: str = "manual"
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    due_date: Optional[datetime] = None


# ---------------------------------------------------------------------------
# Alert
# ---------------------------------------------------------------------------


class AlertBase(BaseModel):
    type: str
    title: str
    message: str
    severity: str = "info"


class AlertCreate(AlertBase):
    related_entity_type: Optional[str] = None
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
    name: str
    description: Optional[str] = None
    trigger_type: str = "manual"


class AutomationCreate(AutomationBase):
    n8n_workflow_id: Optional[str] = None


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
    type: str  # daily / weekly / monthly
    title: str
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
    command: str


class CommandBarResponse(BaseModel):
    action: str
    message: str
    data: Optional[dict] = None
    suggestions: Optional[list[str]] = None
