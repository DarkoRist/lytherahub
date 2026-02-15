# BUILD PLAN — LytheraHub AI

This file contains the step-by-step build plan for this project.
Claude: when asked to "continue building" or "do the next phase", find the first phase marked ❌ and execute it. After completing a phase, update its status to ✅ in this file.

## Context Management Rules (IMPORTANT — follow these strictly):
- When you see **⚡ CONTEXT CHECKPOINT**: Run `/compact` to compress conversation history before continuing to the next phase.
- When you see **🔴 MAJOR CONTEXT RESET**: STOP and tell the user to run `/clear` and re-paste the master prompt. Do NOT continue past a 🔴 checkpoint — the context must be reset for quality.
- These checkpoints save tokens and prevent context degradation. Never skip them.

---

## Phase 1: Project Scaffolding & Infrastructure ✅

Set up the full monorepo with all services:

### Backend
1. Create `backend/` with FastAPI project structure (all directories from CLAUDE.md)
2. `backend/app/main.py` — FastAPI app with CORS, lifespan, health check, WebSocket endpoint stub
3. `backend/app/config.py` — Pydantic Settings loading all env vars with defaults
4. `backend/requirements.txt` — all dependencies pinned:
   - fastapi, uvicorn[standard], python-multipart, python-jose[cryptography], passlib[bcrypt]
   - anthropic, python-dotenv
   - sqlalchemy[asyncio], asyncpg, aiosqlite (dev fallback)
   - celery[redis], redis, aioredis
   - google-auth, google-auth-oauthlib, google-api-python-client
   - slack-sdk, slack-bolt
   - stripe
   - httpx (for n8n API calls)
   - pandas, Pillow
   - pytest, pytest-asyncio, httpx (testing)
5. `backend/.env.example` with all variables documented
6. `backend/Dockerfile`

### Frontend
1. Initialize React + Vite project in `frontend/`
2. Install all dependencies: react-router-dom, axios, @tanstack/react-query, tailwindcss, @headlessui/react, lucide-react, recharts, react-hot-toast, react-dropzone
3. Configure Tailwind with dark mode (class strategy), custom color palette (brand blue + slate)
4. `frontend/src/App.jsx` — React Router with all page routes (placeholder components)
5. `frontend/vite.config.js` — proxy /api to backend
6. `frontend/Dockerfile` + `frontend/nginx.conf`

### Root
1. `docker-compose.yml` — backend, frontend, postgres, redis, n8n (5 services)
2. `docker-compose.demo.yml` — override with DEMO_MODE=true, SQLite instead of Postgres
3. `Makefile` — shortcuts: make dev, make demo, make test, make build
4. `.gitignore` — Python, Node, Docker, env files, uploads
5. `.github/workflows/ci.yml` — lint + test on push

**Done when:** `docker-compose up` starts all services. Frontend loads at :3000, backend health check at :8000/health, n8n at :5678.

---

## Phase 2: Database Models & Schemas ✅

Create the complete data layer:

### SQLAlchemy Models (`backend/app/models/database.py`):

1. **User** — id, email, name, picture, google_token (encrypted), slack_token, stripe_customer_id, plan (free/pro/business), timezone, created_at
2. **Email** — id, user_id, gmail_id, from_addr, to_addr, subject, snippet, body_preview, category (urgent/client/invoice/newsletter/spam/other), ai_summary, is_read, is_starred, needs_reply, reply_draft, received_at
3. **CalendarEvent** — id, user_id, google_event_id, title, description, start_time, end_time, location, attendees (JSON), prep_brief, action_items, is_meeting
4. **Invoice** — id, user_id, client_id (FK), invoice_number, amount, currency, status (draft/sent/paid/overdue/cancelled), issued_date, due_date, paid_date, reminder_count, source (manual/stripe/import)
5. **Client** — id, user_id, company_name, contact_name, email, phone, website, industry, location, pipeline_stage (lead/contacted/proposal/negotiation/won/lost), deal_value, notes, enrichment_data (JSON), last_contacted, created_at
6. **Task** — id, user_id, client_id (FK nullable), title, description, priority (low/medium/high/urgent), status (todo/in_progress/done), due_date, source (manual/ai/automation), created_at
7. **Alert** — id, user_id, type (overdue_invoice/no_reply/missed_meeting/anomaly/reminder), title, message, severity (info/warning/critical), is_read, related_entity_type, related_entity_id, created_at
8. **Automation** — id, user_id, name, description, n8n_workflow_id, trigger_type, is_active, last_run, run_count, created_at
9. **Report** — id, user_id, type (daily/weekly/monthly), title, content (JSON), period_start, period_end, created_at
10. **ActivityLog** — id, user_id, entity_type (email/event/invoice/client), entity_id, action, description, created_at

### Pydantic Schemas (`backend/app/models/schemas.py`):
- Request/Response models for every entity
- List responses with pagination
- Dashboard stats response
- Morning briefing response
- Command bar request/response

### Database init:
- Create all tables on startup
- Async session dependency for routers

**Done when:** All models create tables. Schemas validate test data correctly.

---

## Phase 3: Authentication System ✅

Build Google OAuth + JWT auth:

1. `backend/app/auth/google_oauth.py`:
   - Google OAuth 2.0 flow (authorization URL + callback)
   - Exchange code for tokens
   - Get user info (email, name, picture)
   - Store/refresh Google tokens in database
   - Request scopes: email, profile, gmail.readonly, gmail.compose, calendar, drive, spreadsheets

2. `backend/app/auth/jwt_handler.py`:
   - Create JWT access token (1 hour) + refresh token (30 days)
   - Verify and decode tokens
   - Token refresh endpoint

3. `backend/app/auth/dependencies.py`:
   - `get_current_user` — FastAPI dependency that extracts user from JWT
   - `require_auth` — decorator version

4. `backend/app/routers/auth.py`:
   - `GET /api/auth/google` — redirect to Google OAuth
   - `GET /api/auth/google/callback` — handle callback, create/update user, return JWT
   - `POST /api/auth/refresh` — refresh access token
   - `GET /api/auth/me` — get current user profile
   - `POST /api/auth/logout` — invalidate token
   - `GET /api/auth/demo` — instant demo login (no Google needed)

5. Frontend auth:
   - `frontend/src/auth/AuthProvider.jsx` — context with login/logout/user state
   - `frontend/src/auth/LoginPage.jsx` — beautiful login page with Google button + demo button
   - `frontend/src/auth/ProtectedRoute.jsx` — redirect to login if not authenticated
   - Token storage in memory (not localStorage for security), refresh on app load

**Demo mode:** `/api/auth/demo` returns a JWT for a fake user with pre-loaded demo data. No Google OAuth needed.

**Done when:** Can log in with Google (or demo mode), access protected endpoints, token refresh works.

---

### ⚡ CONTEXT CHECKPOINT — Run `/compact` now before continuing.

---

## Phase 4: Core AI Agent Service ✅

Build the central AI brain:

1. `backend/app/services/ai_agent.py` — single service that handles ALL AI operations:

   **Email Intelligence:**
   - `classify_email(subject, body, from_addr)` → category (urgent/client/invoice/newsletter/spam)
   - `summarize_email(body)` → 1-line summary
   - `draft_reply(email, tone="professional")` → reply text
   - `extract_action_items(body)` → list of tasks
   - `detect_urgency(subject, body)` → urgency score 0-100

   **Calendar Intelligence:**
   - `generate_meeting_prep(event, client_history, recent_emails)` → prep brief
   - `extract_meeting_actions(notes)` → action items
   - `suggest_meeting_time(preferences, busy_slots)` → suggested slots

   **Business Intelligence:**
   - `enrich_client(company_name, website)` → industry, size, description
   - `generate_daily_briefing(emails, events, invoices, tasks, alerts)` → morning summary
   - `generate_weekly_report(week_data)` → formatted report
   - `generate_monthly_report(month_data)` → formatted report with trends
   - `analyze_command(natural_language_input)` → structured intent + action

   **Invoice Intelligence:**
   - `predict_payment_risk(client_history)` → risk score
   - `generate_reminder_email(invoice, reminder_number)` → polite escalating reminder
   - `forecast_cashflow(invoices, history)` → 30-day forecast

2. All methods:
   - Use Claude API with carefully crafted system prompts
   - Have demo mode fallback returning realistic mock responses
   - Include retry logic with exponential backoff
   - Log token usage for cost tracking

**Done when:** All AI methods work with both real API and demo mode. Each returns structured data.

---

## Phase 5: Gmail Integration Service ✅

Build Gmail connection:

1. `backend/app/services/gmail_service.py`:
   - `GmailService` class initialized with user's Google token
   - `fetch_emails(max_results=50)` → fetch recent emails
   - `get_email(gmail_id)` → full email content
   - `send_email(to, subject, body)` → send email
   - `create_draft(to, subject, body)` → save draft
   - `mark_read(gmail_id)` / `mark_starred(gmail_id)`
   - `search_emails(query)` → search with Gmail query syntax
   - Auto-refresh Google token when expired
   - Rate limiting (Gmail API quota: 250 units/second)

2. `backend/app/routers/emails.py`:
   - `GET /api/emails` — list emails (paginated, filterable by category)
   - `GET /api/emails/{id}` — single email with AI summary
   - `POST /api/emails/{id}/classify` — trigger AI classification
   - `POST /api/emails/{id}/summarize` — trigger AI summary
   - `POST /api/emails/{id}/draft-reply` — generate AI reply draft
   - `POST /api/emails/{id}/send-reply` — send the reply
   - `POST /api/emails/sync` — sync latest emails from Gmail
   - `GET /api/emails/stats` — inbox stats (unread, by category, needs reply)

3. `backend/app/tasks/email_tasks.py`:
   - `sync_user_emails` — background task: fetch new emails, classify, summarize
   - Runs every 5 minutes per user (configurable)

**Demo mode:** Return pre-built email list with realistic business emails, already classified and summarized.

**Done when:** Can fetch real Gmail emails, classify them, generate summaries and reply drafts. Demo mode works standalone.

---

## Phase 6: Google Calendar Integration ✅

Build Calendar connection:

1. `backend/app/services/calendar_service.py`:
   - `CalendarService` class
   - `fetch_events(days_ahead=7)` → upcoming events
   - `get_event(event_id)` → event details
   - `create_event(title, start, end, attendees)` → create meeting
   - `update_event(event_id, updates)` → modify event
   - `find_free_slots(duration_minutes, days_ahead=7)` → available time slots

2. `backend/app/routers/calendar.py`:
   - `GET /api/calendar/events` — list events (date range filter)
   - `GET /api/calendar/events/{id}` — event detail with prep brief
   - `POST /api/calendar/events` — create new event
   - `PUT /api/calendar/events/{id}` — update event
   - `POST /api/calendar/events/{id}/prep` — generate AI meeting prep
   - `GET /api/calendar/free-slots` — find available times
   - `GET /api/calendar/today` — today's schedule

3. `backend/app/tasks/calendar_tasks.py`:
   - `generate_meeting_preps` — auto-generate prep briefs for tomorrow's meetings
   - Runs daily at user's configured time (default 8pm)

**Demo mode:** Pre-built calendar with realistic meetings for next 7 days including prep briefs.

**Done when:** Can read Google Calendar, create events, generate meeting prep. Demo mode works.

---

### ⚡ CONTEXT CHECKPOINT — Run `/compact` now before continuing.

---

## Phase 7: Invoice & Payment System ✅

Build invoice tracking:

1. `backend/app/services/invoice_service.py`:
   - `InvoiceService` class
   - `create_invoice(client_id, amount, due_date)` → new invoice
   - `import_from_csv(file)` → bulk import invoices
   - `get_overdue_invoices(user_id)` → overdue list
   - `get_dashboard_stats(user_id)` → total outstanding, overdue, paid this month, monthly revenue
   - `predict_late_payments(user_id)` → clients likely to pay late
   - `generate_cashflow_forecast(user_id, days=30)` → projected cash flow
   - `send_payment_reminder(invoice_id, reminder_number)` → escalating reminder via email

2. `backend/app/routers/invoices.py`:
   - `GET /api/invoices` — list (filterable: status, client, date range)
   - `POST /api/invoices` — create invoice
   - `PUT /api/invoices/{id}` — update (mark paid, change status)
   - `DELETE /api/invoices/{id}` — delete
   - `POST /api/invoices/import` — CSV upload
   - `GET /api/invoices/stats` — dashboard numbers
   - `GET /api/invoices/forecast` — 30-day cash flow
   - `POST /api/invoices/{id}/remind` — send reminder

3. `backend/app/tasks/invoice_tasks.py`:
   - `check_overdue_invoices` — daily: find overdue, create alerts, auto-send reminders at day 7/14/30
   - `generate_monthly_revenue_report` — first of month

**Demo mode:** Pre-loaded invoices in various states (paid, pending, overdue) with realistic amounts and clients.

**Done when:** Full invoice CRUD, overdue detection, auto-reminders, cash flow forecast. Demo mode with sample data.

---

## Phase 8: CRM / Client Management ✅

Build the client tracker:

1. `backend/app/services/crm_service.py`:
   - `CRMService` class
   - `create_client(data)` → new client record
   - `enrich_client(client_id)` → AI fills in industry, size, description from company name/website
   - `get_pipeline(user_id)` → clients grouped by pipeline stage
   - `get_client_timeline(client_id)` → all activity (emails, meetings, invoices, notes) chronologically
   - `get_stale_leads(user_id, days=7)` → leads not contacted in X days
   - `update_pipeline_stage(client_id, new_stage)` → move client in pipeline

2. `backend/app/routers/clients.py`:
   - `GET /api/clients` — list (filterable: stage, industry, search)
   - `POST /api/clients` — create
   - `GET /api/clients/{id}` — detail with timeline
   - `PUT /api/clients/{id}` — update
   - `DELETE /api/clients/{id}` — delete
   - `POST /api/clients/{id}/enrich` — trigger AI enrichment
   - `GET /api/clients/pipeline` — pipeline view data
   - `PUT /api/clients/{id}/stage` — move in pipeline (drag-and-drop support)
   - `GET /api/clients/stale` — leads needing follow-up

**Demo mode:** 15 sample clients across all pipeline stages with enrichment data and activity history.

**Done when:** Full CRM with pipeline, enrichment, timeline, stale lead detection. Demo with sample clients.

---

## Phase 9: Slack Integration ✅

Build Slack connection:

1. `backend/app/services/slack_service.py`:
   - `SlackService` class
   - `send_notification(user_slack_id, message)` → send DM
   - `send_channel_message(channel, message)` → post to channel
   - `get_channel_messages(channel, limit=50)` → recent messages
   - `summarize_channel(channel)` → AI summary of recent channel activity
   - Handle Slack slash commands: `/lytherahub briefing`, `/lytherahub tasks`, `/lytherahub invoice status`

2. `backend/app/routers/slack.py`:
   - `POST /api/slack/events` — Slack event webhook (message events, commands)
   - `POST /api/slack/commands` — handle slash commands
   - `GET /api/slack/channels` — list connected channels
   - `POST /api/slack/connect` — OAuth flow to connect Slack workspace
   - `POST /api/slack/notify` — send notification from app

3. Slack bot capabilities:
   - Morning briefing DM at configured time
   - Alert notifications (overdue invoice, missed follow-up)
   - Slash command responses with formatted blocks
   - Channel summary on demand

**Demo mode:** Mock Slack responses showing what notifications would look like.

**Done when:** Can connect Slack, send notifications, handle slash commands. Demo mode shows sample interactions.

---

### ⚡ CONTEXT CHECKPOINT — Run `/compact` now before continuing.

---

## Phase 10: Stripe Billing Integration ✅

Build subscription billing:

1. `backend/app/services/stripe_service.py`:
   - `StripeService` class
   - `create_customer(user)` → Stripe customer
   - `create_checkout_session(user, plan)` → Stripe Checkout URL
   - `get_subscription(user)` → current plan details
   - `cancel_subscription(user)` → cancel
   - `handle_webhook(event)` → process Stripe events (payment success/fail, subscription changes)
   - Plans: Free (limited), Pro €49/month (full), Business €149/month (team + priority)

2. `backend/app/routers/billing.py`:
   - `GET /api/billing/plans` — available plans with features
   - `POST /api/billing/checkout` — create checkout session
   - `GET /api/billing/subscription` — current subscription
   - `POST /api/billing/cancel` — cancel subscription
   - `POST /api/billing/webhook` — Stripe webhook endpoint
   - `GET /api/billing/invoices` — billing history

**Demo mode:** Fake subscription data showing Pro plan active. Checkout button shows mock flow.

**Done when:** Full Stripe integration with checkout, subscription management, webhooks. Demo mode works.

---

## Phase 11: Smart Alerts & Notification Engine ✅

Build the alert system:

1. `backend/app/services/alert_service.py`:
   - `AlertService` class
   - `check_overdue_invoices(user_id)` → create alerts for overdue
   - `check_stale_leads(user_id)` → alert for leads not contacted in 7+ days
   - `check_upcoming_meetings(user_id)` → alert for unprepared meetings
   - `check_unanswered_emails(user_id)` → alert for emails waiting 3+ days
   - `detect_anomalies(user_id)` → unusual patterns (spending spike, missed meetings)
   - `create_alert(user_id, type, title, message, severity)` → create + push via WebSocket

2. `backend/app/routers/alerts.py`:
   - `GET /api/alerts` — list (filterable: severity, type, read/unread)
   - `PUT /api/alerts/{id}/read` — mark as read
   - `PUT /api/alerts/read-all` — mark all read
   - `DELETE /api/alerts/{id}` — dismiss
   - `GET /api/alerts/count` — unread count (for notification bell)

3. `backend/app/tasks/alert_tasks.py`:
   - `run_alert_checks` — periodic task: run all checks, create alerts, push to WebSocket + Slack
   - Runs every 30 minutes

4. WebSocket push: new alerts → instant notification on dashboard

**Demo mode:** Pre-loaded alerts of various types and severities.

**Done when:** Alerts auto-generate, push via WebSocket, show in notification bell. Demo mode with sample alerts.

---

## Phase 12: AI Reports Service ✅

Build automated reporting:

1. `backend/app/services/report_service.py`:
   - `ReportService` class
   - `generate_daily_briefing(user_id)` → morning summary:
     * Emails: X new, Y urgent, Z need reply
     * Calendar: today's meetings with prep status
     * Invoices: outstanding total, newly overdue
     * Clients: pipeline changes, stale leads
     * Tasks: due today, overdue
     * Top 3 priorities for today
   - `generate_weekly_report(user_id)` → week in review:
     * Emails handled vs received
     * Meetings held, action items completed
     * Revenue: invoices sent/paid/overdue
     * Client pipeline movement
     * Productivity score
     * AI recommendations for next week
   - `generate_monthly_report(user_id)` → business health:
     * Revenue trends (chart data)
     * Client acquisition/churn
     * Top clients by revenue
     * Cash flow analysis
     * Automation ROI (time saved)
     * AI insights and predictions

2. `backend/app/routers/reports.py`:
   - `GET /api/reports` — list past reports
   - `GET /api/reports/briefing` — today's briefing
   - `POST /api/reports/generate/{type}` — generate on demand
   - `GET /api/reports/{id}` — view specific report

3. `backend/app/tasks/report_tasks.py`:
   - `generate_morning_briefing` — daily at user's wake time
   - `generate_weekly_summary` — every Monday 8am
   - `generate_monthly_review` — first of month

**Demo mode:** Pre-generated reports for past 30 days with realistic metrics.

**Done when:** Daily/weekly/monthly reports auto-generate with real insights. Demo mode with sample reports.

---

### ⚡ CONTEXT CHECKPOINT — Run `/compact` now before continuing.

---

## Phase 13: n8n Workflow Integration ✅

Build n8n automation management:

1. `backend/app/services/n8n_service.py`:
   - `N8nService` class
   - `list_workflows()` → get all workflows from n8n
   - `get_workflow(id)` → workflow details
   - `activate_workflow(id)` / `deactivate_workflow(id)`
   - `execute_workflow(id, data)` → trigger manual execution
   - `import_workflow(json_data)` → import from template
   - `get_execution_history(workflow_id)` → recent runs

2. Create n8n workflow JSON templates in `backend/app/n8n_workflows/`:
   - `new_lead_onboarding.json` — new client email → create in CRM → send welcome → create Drive folder
   - `invoice_reminder.json` — invoice overdue → check days → send escalating reminder
   - `meeting_prep.json` — calendar event tomorrow → fetch client data → generate brief → email to user
   - `weekly_report.json` — every Monday → gather metrics → generate report → email + Slack
   - `client_onboarding.json` — client won → create folders → send onboarding email → schedule kickoff
   - `slack_daily_briefing.json` — every morning → generate briefing → post to Slack DM

3. `backend/app/routers/automations.py`:
   - `GET /api/automations` — list available automations
   - `POST /api/automations/{id}/activate` — turn on
   - `POST /api/automations/{id}/deactivate` — turn off
   - `POST /api/automations/{id}/run` — manual trigger
   - `GET /api/automations/{id}/history` — execution history
   - `GET /api/automations/templates` — available templates to install

**Demo mode:** Show automations list with mock execution history. Toggle on/off works visually.

**Done when:** Can manage n8n workflows via API, import templates, view execution history. Demo mode shows all automations.

---

## Phase 14: Natural Language Command Bar ✅

Build the AI command interface:

1. Add to `backend/app/services/ai_agent.py`:
   - `parse_command(text)` → analyze natural language and return structured action:
     * "schedule a meeting with Hans next Tuesday 2pm" → {action: "create_event", params: {title, time, attendee}}
     * "remind me to follow up with TechVision in 3 days" → {action: "create_task", params: {title, due_date, client}}
     * "how much revenue this month" → {action: "query_revenue", params: {period: "this_month"}}
     * "send payment reminder to CloudFirst" → {action: "send_reminder", params: {client}}
     * "summarize my inbox" → {action: "inbox_summary", params: {}}
     * "what's my schedule tomorrow" → {action: "tomorrow_schedule", params: {}}
     * "add new client: TechVision GmbH, Berlin, SaaS" → {action: "create_client", params: {name, location, industry}}

2. `backend/app/routers/dashboard.py`:
   - `POST /api/dashboard/command` — process natural language command
   - `GET /api/dashboard/briefing` — morning briefing data
   - `GET /api/dashboard/stats` — dashboard statistics
   - `GET /api/dashboard/activity` — recent activity feed

3. Command execution: parse → confirm → execute → return result

**Demo mode:** Commands return realistic responses. "how much revenue this month" → "€12,450 from 8 paid invoices."

**Done when:** Can type natural language commands and get intelligent responses/actions. Demo mode works.

---

## Phase 15: WebSocket Real-Time System ✅

Build live updates:

1. Update `backend/app/main.py`:
   - WebSocket endpoint at `/ws/{user_id}`
   - Connection manager (track connected clients per user)
   - Broadcast function to push events to user's connected clients

2. Event types pushed via WebSocket:
   - `new_email` — new email arrived and classified
   - `new_alert` — new alert generated
   - `task_completed` — automation finished
   - `invoice_paid` — payment received
   - `pipeline_change` — client moved stages
   - `report_ready` — new report generated

3. `frontend/src/api/websocket.js`:
   - WebSocket connection manager with auto-reconnect
   - Event listener registration
   - Connection status indicator

4. `frontend/src/hooks/useWebSocket.js`:
   - React hook for WebSocket events
   - Auto-connect on auth, disconnect on logout
   - Event callback registration

**Demo mode:** Simulate WebSocket events every 30 seconds (new email, alert, etc.) to show live updates.

**Done when:** Dashboard updates in real-time when events happen. Demo mode simulates live activity.

---

### 🔴 MAJOR CONTEXT RESET — Run `/clear` now. The backend is complete. Starting frontend from scratch with clean context. After clearing, re-read CLAUDE.md and BUILD_PLAN.md before continuing with Phase 16.

---

## Phase 16: Frontend — Layout, Navigation & Theme ✅

Build the app shell:

1. `frontend/src/components/layout/Layout.jsx`:
   - Collapsible sidebar (hamburger on mobile)
   - Top header with search bar, notification bell, user avatar, dark mode toggle
   - Main content area with breadcrumbs
   - Responsive: sidebar becomes bottom nav on mobile

2. `frontend/src/components/layout/Sidebar.jsx`:
   - Logo + app name
   - Navigation links with icons (Lucide):
     * Dashboard (home icon)
     * Inbox (mail icon + unread badge)
     * Calendar (calendar icon)
     * Invoices (receipt icon + overdue badge)
     * Clients (users icon)
     * Reports (chart icon)
     * Automations (zap icon)
     * Settings (gear icon)
   - Collapse/expand toggle
   - Active page highlight
   - User plan badge (Free/Pro/Business)

3. `frontend/src/components/layout/Header.jsx`:
   - Command bar (search icon + input that opens command palette)
   - Notification bell with unread count (red badge)
   - Notification dropdown (recent alerts)
   - User avatar + dropdown (profile, settings, billing, logout)
   - Dark/light mode toggle (sun/moon icons)

4. Theme system:
   - `frontend/src/context/ThemeContext.jsx` — dark mode state + localStorage persistence
   - Tailwind dark: classes on all components
   - Brand colors: blue-600 primary, slate backgrounds
   - Professional, clean, SaaS aesthetic

**Done when:** Full responsive layout with sidebar, header, navigation, dark mode, notification bell. Looks beautiful on desktop and mobile.

---

## Phase 17: Frontend — Landing Page ✅

Build a beautiful marketing page:

1. `frontend/src/pages/Landing.jsx` — public page (no auth required):

   **Hero Section:**
   - Headline: "Your Business on Autopilot"
   - Subheadline: "One AI-powered dashboard that connects your email, calendar, invoices, and clients. Stop switching tabs. Start running your business."
   - CTA buttons: "Start Free" + "Watch Demo"
   - Hero image/illustration: dashboard screenshot or animated mockup

   **Features Grid (6 features):**
   - Smart Inbox, AI Calendar, Invoice Tracker, CRM Pipeline, AI Reports, Automations
   - Each with icon, title, 2-line description

   **How It Works (3 steps):**
   - Connect your tools → AI organizes everything → You focus on what matters

   **Social Proof Section:**
   - Metrics: "93% time saved", "50+ automations", "10,000+ emails classified"
   - Testimonial placeholders (3 cards)

   **Pricing Cards (3 plans):**
   - Free: 1 email account, 5 clients, basic reports
   - Pro €49/month: unlimited, all integrations, AI reports, Slack
   - Business €149/month: team, priority support, custom automations, API access

   **FAQ Section** (6 questions)

   **Footer** with links, social icons, copyright

2. Animated, modern design. Smooth scroll. Responsive.

**Done when:** Landing page is stunning and would make someone want to sign up. Responsive on all devices.

---

## Phase 18: Frontend — Dashboard Page ✅

Build the main dashboard:

1. `frontend/src/pages/Dashboard.jsx`:

   **Morning Briefing Card** (top, full width):
   - AI-generated natural language summary
   - "Good morning, Darko. You have 3 urgent emails, 2 meetings today, and €4,200 in overdue invoices. Here's what to focus on..."
   - 3 priority action items with quick-action buttons

   **Command Bar** (prominent, below briefing):
   - Large input: "Ask anything or give a command..."
   - Examples shown as placeholder: "schedule meeting with...", "how much revenue..."
   - Response area below for AI answers

   **Stats Grid** (4 cards):
   - Unread Emails (with trend arrow)
   - Today's Meetings (with next meeting countdown)
   - Outstanding Invoices (with overdue count in red)
   - Active Clients (with pipeline movement)

   **Two-column layout below:**

   **Left: Activity Feed**
   - Recent actions: "AI classified 12 new emails", "Meeting prep generated for Hans call", "Invoice reminder sent to CloudFirst"
   - Timestamps, icons per type
   - "View all" link

   **Right: Alerts Panel**
   - Critical alerts at top (red)
   - Warnings in middle (yellow)
   - Info at bottom (blue)
   - Mark as read, dismiss buttons

   **Bottom: Quick Access Cards**
   - "Emails needing reply" (count + list)
   - "Overdue invoices" (count + total amount)
   - "Stale leads" (count + oldest)

2. All data from API endpoints. Loading skeletons while fetching.
3. WebSocket updates: new data → cards refresh automatically.

**Done when:** Dashboard shows complete business overview. Real-time updates work. Beautiful on desktop and mobile.

---

### ⚡ CONTEXT CHECKPOINT — Run `/compact` now before continuing.

---

## Phase 19: Frontend — Smart Inbox Page ✅

Build the email interface:

1. `frontend/src/pages/Inbox.jsx`:

   **Category Tabs** (top):
   - All | Urgent (red badge) | Clients | Invoices | Newsletters | Other
   - Count per category

   **Email List** (left panel on desktop, full on mobile):
   - Each email card shows:
     * Sender avatar (first letter) + name
     * Subject line (bold if unread)
     * AI summary (1 line, gray)
     * Category badge (colored)
     * Time received
     * Star toggle
     * "Needs reply" indicator
   - Click to expand

   **Email Detail** (right panel on desktop, full on mobile):
   - Full email header (from, to, date)
   - AI Summary box (highlighted)
   - Email body
   - Action items extracted by AI (if any)
   - AI Reply section:
     * 3 tone buttons: Professional, Friendly, Brief
     * Generated reply in editable textarea
     * "Send Reply" button
   - "Mark as read" / "Star" / "Archive" buttons

   **Search bar** at top with Gmail-style search

2. Synced with Gmail. WebSocket: new email → appears instantly with classification.

**Done when:** Full email client with AI classification, summaries, and reply drafts. Beautiful split-pane layout.

---

## Phase 20: Frontend — Calendar Page ✅

Build the calendar interface:

1. `frontend/src/pages/Calendar.jsx`:

   **Views**: Day | Week | Month (toggle buttons)

   **Calendar Grid**:
   - Color-coded events by type (meeting=blue, call=green, deadline=red, personal=purple)
   - Click event → side panel with details

   **Event Detail Side Panel**:
   - Event title, time, location, attendees
   - AI Meeting Prep section:
     * Client background
     * Last interaction summary
     * Open invoices
     * Suggested talking points
   - Action items from previous meeting
   - "Generate Prep Brief" button (if not yet generated)
   - Edit / Delete buttons

   **Today's Schedule** (sidebar on desktop):
   - Timeline view of today's events
   - Next meeting countdown
   - "Add Event" quick button

   **Quick Schedule**:
   - "Find free slot" button → shows available times
   - Quick create: title + attendee + duration → auto-find time

**Done when:** Full calendar with day/week/month views, meeting prep, and smart scheduling.

---

## Phase 21: Frontend — Invoices Page ✅

Build the invoice tracker:

1. `frontend/src/pages/Invoices.jsx`:

   **Stats Bar** (top):
   - Total Outstanding | Overdue | Paid This Month | Monthly Revenue
   - Each with amount and trend arrow

   **Revenue Chart** (Recharts):
   - Bar chart: monthly revenue last 6 months
   - Line overlay: cumulative trend
   - Toggle: revenue vs cash flow forecast

   **Invoice Table**:
   - Columns: Invoice #, Client, Amount, Status, Due Date, Actions
   - Status badges: Draft (gray), Sent (blue), Paid (green), Overdue (red)
   - Sort by any column
   - Filter by status, client, date range
   - Bulk actions: send reminder, mark paid

   **Actions per invoice**:
   - View details
   - Mark as paid
   - Send reminder (shows AI-generated reminder preview)
   - Edit / Delete

   **Add Invoice** modal:
   - Client dropdown, amount, due date, notes
   - Or "Import CSV" button

   **Cash Flow Forecast** section:
   - 30-day projected chart based on due dates and payment history
   - AI prediction: "Based on history, expect €8,200 collected this month"

**Done when:** Full invoice management with charts, predictions, and auto-reminders.

---

### ⚡ CONTEXT CHECKPOINT — Run `/compact` now before continuing.

---

## Phase 22: Frontend — Clients / CRM Page ✅

Build the CRM interface:

1. `frontend/src/pages/Clients.jsx`:

   **Two views** (toggle):

   **Pipeline Board View** (Kanban):
   - Columns: Lead | Contacted | Proposal | Negotiation | Won | Lost
   - Client cards with: name, company, deal value, last contacted
   - Drag-and-drop between columns (dnd-kit)
   - Card count + total value per column

   **Table View**:
   - Sortable/filterable table of all clients
   - Quick actions: edit, enrich, change stage

   **Client Detail** (click on client → side panel or full page):
   - Header: company name, contact, industry badge, pipeline stage
   - Enrichment data: website, size, description (AI-generated)
   - Deal value + notes
   - **Activity Timeline**: every email, meeting, invoice, note — chronological
   - Quick actions: send email, schedule meeting, create invoice, add note
   - "Enrich with AI" button

   **Add Client** modal:
   - Company name, contact, email, phone
   - "Auto-enrich" checkbox → AI fills in the rest

   **Stale Leads Alert**: banner showing leads not contacted in 7+ days

**Done when:** Full CRM with pipeline drag-and-drop, client detail with timeline, AI enrichment.

---

## Phase 23: Frontend — Reports Page ✅

Build the reports viewer:

1. `frontend/src/pages/Reports.jsx`:

   **Report Type Tabs**: Daily Briefing | Weekly | Monthly

   **Latest Report** (hero card):
   - Full AI-generated report content
   - Rich formatting: sections, metrics, highlights
   - Charts embedded (Recharts): revenue trend, email volume, pipeline changes

   **Report History** (below):
   - List of past reports with date, type, preview
   - Click to expand full report

   **Generate On Demand**:
   - "Generate Now" button per report type
   - Loading animation while AI generates

   **Key Metrics Dashboard** within reports:
   - Emails: sent/received/avg response time
   - Meetings: held/cancelled/avg duration
   - Revenue: invoiced/collected/outstanding
   - Clients: new/won/lost
   - Automations: runs/time saved

**Done when:** Beautiful report viewer with charts, history, and on-demand generation.

---

## Phase 24: Frontend — Automations Page ✅

Build the automation manager:

1. `frontend/src/pages/Automations.jsx`:

   **Available Automations** (card grid):
   Each card shows:
   - Icon + title (e.g., "Invoice Reminder", "Meeting Prep", "Lead Onboarding")
   - Description (2 lines)
   - Trigger type badge (scheduled, event-triggered, manual)
   - On/Off toggle switch
   - Last run timestamp
   - Run count
   - "Run Now" button (manual trigger)
   - "View History" expand

   **Automation Categories**:
   - Email Automations
   - Calendar Automations
   - Invoice Automations
   - Client Automations
   - Reporting Automations
   - Slack Automations

   **Execution History** (per automation):
   - Table: run time, status (success/failed), trigger, duration
   - Error details for failed runs

   **Stats Bar**:
   - Total automations active | Runs this week | Time saved | Success rate

   **n8n Link**: "Advanced Editor" button → opens n8n dashboard in new tab

**Done when:** Can view, toggle, and manually trigger all automations. History shows past runs.

---

### ⚡ CONTEXT CHECKPOINT — Run `/compact` now before continuing.

---

## Phase 25: Frontend — Settings Page ✅

Build user settings:

1. `frontend/src/pages/Settings.jsx`:

   **Tabs**: Profile | Integrations | Notifications | Billing

   **Profile Tab**:
   - Avatar, name, email (from Google)
   - Timezone selector
   - Business name + type
   - Default language

   **Integrations Tab**:
   - Connection cards for each service:
     * Gmail — Connected ✓ (green) / Connect (button)
     * Google Calendar — Connected ✓ / Connect
     * Google Drive — Connected ✓ / Connect
     * Slack — Connected ✓ / Connect
     * Stripe — Connected ✓ / Connect
     * n8n — Running ✓ / Configure
   - Each shows: status, last synced, disconnect button
   - "Connect" buttons trigger OAuth flows

   **Notifications Tab**:
   - Toggle per alert type: email, push, Slack
   - Morning briefing time picker
   - Alert severity threshold
   - Quiet hours

   **Billing Tab**:
   - Current plan card with features
   - Usage this month (emails classified, reports generated, etc.)
   - Upgrade/Downgrade buttons
   - Billing history table
   - Cancel subscription

**Done when:** Full settings page with working integrations panel and billing management.

---

## Phase 26: Demo Mode & Sample Data ✅

Create the complete demo experience:

1. `demo/` directory with comprehensive sample data:
   - `demo_user.json` — fake user profile
   - `demo_emails.json` — 50 realistic business emails (classified, summarized)
   - `demo_events.json` — 2 weeks of calendar events with prep briefs
   - `demo_invoices.json` — 20 invoices in various states
   - `demo_clients.json` — 15 clients across all pipeline stages with enrichment
   - `demo_alerts.json` — 10 alerts of various types/severities
   - `demo_reports.json` — daily, weekly, monthly reports for past 30 days
   - `demo_automations.json` — 6 automations with execution history
   - `demo_activity.json` — 50 recent activity log entries

2. Backend demo seeding:
   - On startup with DEMO_MODE=true: create demo user + load all sample data
   - `/api/auth/demo` — instant login as demo user
   - All services return demo data when in demo mode
   - Simulated WebSocket events every 30 seconds

3. Frontend demo:
   - "Demo Mode" banner at top of every page
   - "Try Demo" button on landing page → instant access
   - Everything works identically to real mode
   - Command bar works with demo responses

**Done when:** Click "Try Demo" → instant access to fully populated dashboard. Every feature works with realistic data.

---

## Phase 27: Backend Tests ✅

Create comprehensive test suite:

1. `backend/tests/conftest.py` — fixtures: test client, test db, mock user, demo data
2. `backend/tests/test_auth.py` — OAuth flow, JWT, demo login
3. `backend/tests/test_dashboard.py` — briefing, stats, command bar
4. `backend/tests/test_emails.py` — CRUD, classification, summarization, reply drafts
5. `backend/tests/test_calendar.py` — events, prep briefs, free slots
6. `backend/tests/test_invoices.py` — CRUD, stats, reminders, forecast
7. `backend/tests/test_clients.py` — CRUD, pipeline, enrichment, timeline
8. `backend/tests/test_reports.py` — generation, listing
9. `backend/tests/test_alerts.py` — creation, WebSocket push, read/dismiss
10. `backend/tests/test_automations.py` — list, toggle, execute
11. `backend/tests/test_ai_agent.py` — all AI methods with mock responses
12. `backend/tests/test_slack.py` — notifications, commands
13. `backend/tests/test_billing.py` — Stripe checkout, webhooks

All external APIs mocked. Target: >80% coverage.

**Done when:** `pytest tests/ -v` — all tests pass.

---

### 🔴 MAJOR CONTEXT RESET — Run `/clear` now. All features are built. Starting deployment and polish with clean context. After clearing, re-read CLAUDE.md and BUILD_PLAN.md before continuing with Phase 28.

---

## Phase 28: Docker & Deployment ✅

Finalize containerization:

1. `backend/Dockerfile` — Python 3.11, all deps, uvicorn
2. `frontend/Dockerfile` — Node 20, build React, serve with nginx
3. `frontend/nginx.conf` — serve static files, proxy /api to backend, WebSocket upgrade
4. `docker-compose.yml`:
   - `postgres` — PostgreSQL 15
   - `redis` — Redis 7
   - `backend` — FastAPI (port 8000)
   - `celery-worker` — background tasks
   - `celery-beat` — scheduled tasks
   - `n8n` — workflow engine (port 5678)
   - `frontend` — React + nginx (port 3000)
   - Shared volumes, health checks, restart policies
5. `docker-compose.demo.yml` — override: DEMO_MODE=true, SQLite, no external deps needed
6. `scripts/start.sh` — production startup
7. `scripts/dev.sh` — development with hot-reload

**Done when:** `docker-compose up --build` starts everything. Demo mode works with single command.

---

## Phase 29: AI Chat Assistant (Conversational AI) ✅

Build a chat sidebar that's always available on every page:

1. `frontend/src/components/shared/AIChatSidebar.jsx`:
   - Slide-out panel from right side (toggle button always visible)
   - Chat interface like ChatGPT — message bubbles, typing indicator
   - User can ask ANYTHING about their business in natural language:
     * "Who are my top 5 clients by revenue?"
     * "Draft a follow-up email to Hans about the delayed invoice"
     * "What happened in my business this week?"
     * "Create a proposal for a new SaaS client in Berlin"
     * "Why did my revenue drop last month?"
     * "Summarize all emails from TechVision GmbH"
   - AI responds with formatted answers, charts, action buttons
   - Context-aware: knows which page you're on (e.g., on client page → answers about that client)
   - Quick action chips: "Draft email", "Schedule meeting", "Create invoice", "Add task"

2. `backend/app/routers/chat.py`:
   - `POST /api/chat` — send message, get AI response
   - Maintains conversation history per session
   - AI has access to all user data (emails, clients, invoices, calendar) for context
   - Can execute actions: "send reminder to CloudFirst" → actually sends it

3. `backend/app/services/chat_service.py`:
   - Builds context from user's data
   - Routes to appropriate service (email, invoice, client, calendar)
   - Returns structured response with text + optional action buttons + optional chart data

**Demo mode:** Chat works with demo data. Pre-seeded conversation starter: "Welcome! I'm your AI business assistant. Ask me anything about your business."

**Done when:** Can have natural conversations about your business data. AI can answer questions AND take actions.

---

## Phase 30: Task Manager & To-Do System ✅

Build a smart task system that ties everything together:

1. `frontend/src/pages/Tasks.jsx`:
   - Kanban board: To Do | In Progress | Done
   - Drag-and-drop cards
   - Each task shows: title, priority badge (color-coded), due date, source badge (manual/AI/automation)
   - Filter by: priority, source, client, overdue
   - "Add Task" quick input at top

2. `backend/app/routers/tasks.py`:
   - Full CRUD for tasks
   - `GET /api/tasks/today` — today's tasks sorted by priority
   - `GET /api/tasks/overdue` — overdue tasks
   - Auto-generated tasks from:
     * AI email analysis: "Reply to Hans by Friday" → task created
     * Meeting action items: "Send proposal to TechVision" → task created
     * Overdue invoices: "Follow up on Invoice #1042" → task created
     * Stale leads: "Contact CloudFirst — 10 days since last interaction" → task created

3. Tasks appear on Dashboard in priority order
4. Slack notification for overdue tasks

**Demo mode:** Pre-loaded tasks from various sources showing the smart auto-creation.

**Done when:** Full task management with auto-creation from emails, meetings, invoices, and CRM.

---

## Phase 31: Analytics & Business Intelligence Page ✅

Build a comprehensive analytics dashboard:

1. `frontend/src/pages/Analytics.jsx`:

   **Revenue Analytics** (Recharts):
   - Monthly revenue bar chart (last 12 months)
   - Revenue by client (pie chart)
   - Revenue by industry (donut chart)
   - MRR trend line
   - Cash flow forecast (30/60/90 days)

   **Client Analytics**:
   - Pipeline conversion funnel (lead → won percentage at each stage)
   - Average deal size trend
   - Client acquisition rate
   - Client lifetime value ranking
   - Churn indicators

   **Productivity Analytics**:
   - Emails handled per day/week (line chart)
   - Average response time trend
   - Meetings per week
   - Tasks completed vs created
   - Automation runs + time saved

   **AI Insights Panel**:
   - "Your revenue is up 12% this month, driven by 3 new SaaS clients"
   - "Response time has improved by 30% since enabling email automation"
   - "Warning: 2 clients haven't been contacted in 14+ days"
   - "Recommendation: Follow up with TechVision — they have a €5,000 proposal pending"

2. `backend/app/routers/analytics.py`:
   - `GET /api/analytics/revenue` — revenue metrics
   - `GET /api/analytics/clients` — client metrics
   - `GET /api/analytics/productivity` — activity metrics
   - `GET /api/analytics/insights` — AI-generated insights

**Demo mode:** Pre-calculated analytics with 6 months of realistic data and trends.

**Done when:** Full analytics page with interactive charts and AI-generated insights.

---

## Phase 32: Onboarding Flow & First-Time Experience ✅

Build a guided onboarding for new users:

1. `frontend/src/components/onboarding/OnboardingWizard.jsx`:
   - Step 1: "Welcome to LytheraHub!" — name, business type, timezone
   - Step 2: "Connect your tools" — Gmail, Calendar, Slack buttons (skip option)
   - Step 3: "Import your clients" — CSV upload or manual add (skip option)
   - Step 4: "Set your preferences" — morning briefing time, notification preferences
   - Step 5: "You're ready!" — redirect to dashboard with guided tooltips

2. Dashboard tooltips (first-time only):
   - Arrow pointing to command bar: "Type anything here — ask questions, give commands"
   - Arrow pointing to notification bell: "Smart alerts appear here"
   - Arrow pointing to sidebar: "Navigate your business tools"
   - Dismiss after clicking through all

3. `backend/app/routers/onboarding.py`:
   - `GET /api/onboarding/status` — check if onboarding complete
   - `POST /api/onboarding/complete` — mark as done
   - `POST /api/onboarding/skip` — skip to dashboard

4. Empty states on every page:
   - Inbox with no emails: "Connect Gmail to see your smart inbox" + connect button
   - Calendar with no events: "Connect Google Calendar to see AI-powered meeting prep" + connect button
   - Clients with no data: "Add your first client" + import CSV button
   - Each empty state has illustration + clear CTA

**Demo mode:** Skip onboarding, go straight to pre-loaded dashboard.

**Done when:** New user gets smooth guided setup. Every empty page has a clear next action.

---

### ⚡ CONTEXT CHECKPOINT — Run `/compact` now before continuing.

---

## Phase 33: README & Documentation ✅

Create portfolio-quality docs:

1. `README.md` — stunning README:
   - Hero: LytheraHub AI logo + tagline + screenshot
   - Problem → Solution narrative
   - Feature showcase (6 features with descriptions)
   - Architecture diagram
   - Tech stack with badges
   - Quick start (3 steps)
   - Demo mode instructions
   - Screenshots of every page
   - API documentation link
   - Pricing section
   - Roadmap
   - License

2. `docs/API.md` — complete API reference
3. `docs/ARCHITECTURE.md` — system design with diagrams
4. `docs/INTEGRATIONS.md` — how to connect each service
5. `docs/DEPLOYMENT.md` — production deployment guide (Docker, Railway, AWS)

**Done when:** README makes someone want to use the product. All docs complete.

---

## Phase 34: Final Polish ✅

1. Backend: black + flake8 on all files
2. Frontend: ESLint + Prettier on all files
3. Run all backend tests — pass
4. Run frontend build — no errors
5. Test docker-compose up — all services start
6. Test complete demo flow: landing → login → dashboard → inbox → calendar → invoices → clients → reports → automations → settings → export
7. Test mobile responsiveness on all pages
8. Test dark mode on all pages
9. Test WebSocket real-time updates
10. Test command bar with 5 different commands
11. Review README for typos
12. Git tag v1.0.0, push everything

**Done when:** Every feature works. Every page is beautiful. Demo is flawless. Ready to show the world.
