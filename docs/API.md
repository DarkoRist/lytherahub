# LytheraHub API Reference

Base URL: `http://localhost:8000`

Interactive docs: `http://localhost:8000/docs`

All protected endpoints require `Authorization: Bearer <token>` header.

---

## Authentication

### `GET /api/auth/google`
Redirect to Google OAuth consent screen. Callback returns JWT tokens via URL params.

### `GET /api/auth/google/callback?code=...`
Handle OAuth callback. Creates or updates user, returns redirect with tokens.

### `GET /api/auth/demo`
Instant demo login. No API keys needed. Returns access + refresh tokens and user object.

**Response:**
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer",
  "user": { "id": "demo-user-001", "email": "demo@lytherahub.ai", "name": "Darko (Demo)" }
}
```

### `POST /api/auth/refresh`
Refresh an expired access token.

### `GET /api/auth/me`
Get current user profile. Requires auth.

### `POST /api/auth/logout`
Logout (client-side token discard).

---

## Dashboard

### `GET /api/dashboard/briefing`
Morning briefing with email stats, meetings, invoices, tasks, and AI-generated priorities.

### `GET /api/dashboard/stats`
Dashboard stat cards: unread emails, meetings today, outstanding invoices, active clients.

### `POST /api/dashboard/command`
Natural language command bar. Send text, get structured action + response.

**Request:** `{ "text": "How much revenue this month?" }`

**Response:** `{ "action": "query_revenue", "response": "EUR 27,600 from 12 paid invoices.", "data": {...} }`

### `GET /api/dashboard/activity`
Recent activity feed (last 50 entries).

---

## Emails

### `GET /api/emails`
List emails. Query params: `category`, `is_read`, `needs_reply`, `page`, `per_page`.

### `GET /api/emails/{id}`
Single email with AI summary.

### `POST /api/emails/{id}/classify`
Trigger AI classification (urgent/client/invoice/newsletter/spam).

### `POST /api/emails/{id}/summarize`
Generate AI summary.

### `POST /api/emails/{id}/draft-reply`
Generate AI reply draft. Body: `{ "tone": "professional" }` (professional/friendly/brief).

### `POST /api/emails/{id}/send-reply`
Send the generated reply.

### `POST /api/emails/sync`
Sync latest emails from Gmail.

### `GET /api/emails/stats`
Inbox stats: unread count, by category, needs reply count.

---

## Calendar

### `GET /api/calendar/events`
List events. Query params: `start_date`, `end_date`.

### `GET /api/calendar/events/{id}`
Event detail with meeting prep brief.

### `POST /api/calendar/events`
Create new event. Body: `{ "title", "start_time", "end_time", "attendees" }`.

### `PUT /api/calendar/events/{id}`
Update event.

### `POST /api/calendar/events/{id}/prep`
Generate AI meeting prep brief.

### `GET /api/calendar/free-slots`
Find available time slots. Query params: `duration_minutes`, `days_ahead`.

### `GET /api/calendar/today`
Today's schedule.

---

## Invoices

### `GET /api/invoices`
List invoices. Query params: `status`, `client_id`, `date_from`, `date_to`, `page`, `per_page`.

### `POST /api/invoices`
Create invoice. Body: `{ "client_id", "amount", "due_date", "currency" }`.

### `PUT /api/invoices/{id}`
Update invoice (mark paid, change status, etc).

### `DELETE /api/invoices/{id}`
Delete invoice.

### `POST /api/invoices/import`
Bulk import from CSV file.

### `GET /api/invoices/stats`
Dashboard numbers: outstanding, overdue, paid this month, monthly revenue.

### `GET /api/invoices/forecast`
30-day cash flow forecast with AI predictions.

### `POST /api/invoices/{id}/remind`
Send AI-generated payment reminder email.

---

## Clients

### `GET /api/clients`
List clients. Query params: `stage`, `industry`, `search`, `page`, `per_page`.

### `POST /api/clients`
Create client.

### `GET /api/clients/{id}`
Client detail with activity timeline.

### `PUT /api/clients/{id}`
Update client.

### `DELETE /api/clients/{id}`
Delete client.

### `POST /api/clients/{id}/enrich`
Trigger AI enrichment (industry, size, description from company name/website).

### `GET /api/clients/pipeline`
Pipeline view — clients grouped by stage with counts and values.

### `PUT /api/clients/{id}/stage`
Move client in pipeline. Body: `{ "stage": "proposal" }`.

### `GET /api/clients/stale`
Leads not contacted in 7+ days.

---

## Tasks

### `GET /api/tasks`
List tasks. Query params: `status`, `priority`, `client_id`.

### `POST /api/tasks`
Create task.

### `PUT /api/tasks/{id}`
Update task.

### `DELETE /api/tasks/{id}`
Delete task.

### `GET /api/tasks/today`
Today's tasks sorted by priority.

### `GET /api/tasks/overdue`
Overdue tasks.

---

## Reports

### `GET /api/reports`
List past reports. Query params: `type` (daily/weekly/monthly).

### `GET /api/reports/briefing`
Today's AI briefing.

### `POST /api/reports/generate/{type}`
Generate report on demand (daily/weekly/monthly).

### `GET /api/reports/{id}`
View specific report.

---

## Analytics

### `GET /api/analytics/revenue`
Revenue metrics: monthly breakdown, by client, totals, growth.

### `GET /api/analytics/clients`
Client metrics: pipeline funnel, win rate, avg deal value, by industry.

### `GET /api/analytics/productivity`
Productivity: email volume, meetings, task completion, weekly trends.

### `GET /api/analytics/insights`
AI-generated business insights and recommendations.

---

## Alerts

### `GET /api/alerts`
List alerts. Query params: `severity`, `type`, `is_read`.

### `PUT /api/alerts/{id}/read`
Mark alert as read.

### `PUT /api/alerts/read-all`
Mark all alerts as read.

### `DELETE /api/alerts/{id}`
Dismiss alert.

### `GET /api/alerts/count`
Unread alert count (for notification bell).

---

## Chat

### `POST /api/chat`
Send message to AI assistant. Body: `{ "message": "...", "context": {"page": "clients"} }`.

Returns structured response with text, optional action buttons, and optional chart data.

---

## Automations

### `GET /api/automations`
List available automations with status and run history.

### `POST /api/automations/{id}/activate`
Enable automation.

### `POST /api/automations/{id}/deactivate`
Disable automation.

### `POST /api/automations/{id}/run`
Manual trigger.

### `GET /api/automations/{id}/history`
Execution history.

### `GET /api/automations/templates`
Available templates to install.

---

## Billing

### `GET /api/billing/plans`
Available plans with features.

### `POST /api/billing/checkout`
Create Stripe checkout session. Body: `{ "plan": "pro" }`.

### `GET /api/billing/subscription`
Current subscription details.

### `POST /api/billing/cancel`
Cancel subscription.

### `POST /api/billing/webhook`
Stripe webhook endpoint.

### `GET /api/billing/invoices`
Billing history.

---

## Slack

### `POST /api/slack/events`
Slack event webhook.

### `POST /api/slack/commands`
Handle slash commands (`/lytherahub briefing`, `/lytherahub tasks`).

### `GET /api/slack/channels`
List connected channels.

### `POST /api/slack/connect`
Initiate Slack OAuth flow.

### `POST /api/slack/notify`
Send notification from app.

---

## Onboarding

### `GET /api/onboarding/status`
Check if onboarding is complete.

### `POST /api/onboarding/profile`
Save profile info (business name, type, timezone).

### `POST /api/onboarding/preferences`
Save notification preferences.

### `POST /api/onboarding/complete`
Mark onboarding as done.

### `POST /api/onboarding/skip`
Skip onboarding.

---

## WebSocket

### `WS /ws/{user_id}`
Real-time event stream. Event types:

- `new_email` — new email arrived and classified
- `new_alert` — alert generated
- `task_completed` — automation finished
- `invoice_paid` — payment received
- `pipeline_change` — client moved stages
- `report_ready` — new report generated

---

## Health Check

### `GET /health`
```json
{
  "status": "healthy",
  "app": "LytheraHub AI",
  "version": "1.0.0",
  "demo_mode": true
}
```
