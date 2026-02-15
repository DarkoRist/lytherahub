# LytheraHub AI — Your Business on Autopilot

Full-stack AI-powered business operations command center. One dashboard that connects all business tools, automates admin work, and gives business owners their time back.

## Stack

### Backend (Python)
- **API**: FastAPI (async, auto-docs at /docs)
- **Auth**: Google OAuth 2.0 + JWT tokens + python-jose
- **AI**: anthropic SDK (Claude API) for summaries, classification, drafts, reports
- **Database**: PostgreSQL via SQLAlchemy (async) — multi-tenant
- **Cache**: Redis (sessions, rate limiting, real-time)
- **Task Queue**: Celery + Redis (background automations)
- **WebSockets**: FastAPI WebSocket for real-time dashboard updates
- **Email**: Gmail API (read, classify, draft replies)
- **Calendar**: Google Calendar API (read, create, update events)
- **Drive**: Google Drive API (create folders, upload files)
- **Sheets**: Google Sheets API (export reports)
- **Slack**: Slack API + Bot (notifications, commands, channel summaries)
- **Payments**: Stripe API (subscriptions, invoices, webhooks)
- **n8n**: n8n API + workflow JSON templates for automations

### Frontend (React)
- **Framework**: React 18 + Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **Routing**: React Router v6
- **HTTP**: Axios + React Query (caching + auto-refresh)
- **Real-time**: WebSocket client for live updates
- **Charts**: Recharts (revenue, pipeline, activity)
- **Calendar**: react-big-calendar or custom grid
- **DnD**: dnd-kit (pipeline drag-and-drop)
- **Icons**: Lucide React
- **Auth**: Google OAuth flow + token management
- **Notifications**: react-hot-toast
- **Dark Mode**: Tailwind dark mode with toggle

### Integrations
- **Gmail API**: Read inbox, classify, draft replies, send
- **Google Calendar API**: Read events, create meetings, update
- **Google Drive API**: Create client folders, upload docs
- **Google Sheets API**: Export reports and data
- **Slack API**: Bot notifications, slash commands, channel summaries
- **Stripe API**: Subscription billing, payment tracking, webhooks
- **n8n**: Self-hosted workflow engine for automations
- **Future**: Notion, WhatsApp Business, Xero, HubSpot, Discord

### Infrastructure
- **Docker**: docker-compose (backend + frontend + postgres + redis + n8n)
- **Nginx**: Reverse proxy, frontend serving, API routing
- **Testing**: pytest (backend), Vitest (frontend)
- **CI**: GitHub Actions

## Project Structure
```
lytherahub/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI app, lifespan, CORS, WebSocket
│   │   ├── config.py                # Pydantic Settings
│   │   ├── auth/
│   │   │   ├── google_oauth.py      # Google OAuth flow
│   │   │   ├── jwt_handler.py       # JWT token create/verify
│   │   │   └── dependencies.py      # get_current_user dependency
│   │   ├── models/
│   │   │   ├── database.py          # SQLAlchemy models (User, Email, Event, Invoice, Client, Task, Alert, Automation)
│   │   │   └── schemas.py           # Pydantic request/response schemas
│   │   ├── routers/
│   │   │   ├── auth.py              # Login, callback, logout, me
│   │   │   ├── dashboard.py         # Morning briefing, stats, command bar
│   │   │   ├── emails.py            # Inbox, classify, summarize, reply
│   │   │   ├── calendar.py          # Events, scheduling, prep briefs
│   │   │   ├── invoices.py          # Invoice tracking, reminders, forecasts
│   │   │   ├── clients.py           # CRM CRUD, pipeline, enrichment
│   │   │   ├── reports.py           # Daily, weekly, monthly AI reports
│   │   │   ├── alerts.py            # Smart alerts and notifications
│   │   │   ├── automations.py       # n8n workflow management
│   │   │   ├── slack.py             # Slack bot events, commands
│   │   │   ├── billing.py           # Stripe subscriptions, webhooks
│   │   │   └── settings.py          # User preferences, integrations
│   │   ├── services/
│   │   │   ├── ai_agent.py          # Core AI: classify, summarize, draft, analyze
│   │   │   ├── gmail_service.py     # Gmail API wrapper
│   │   │   ├── calendar_service.py  # Google Calendar wrapper
│   │   │   ├── drive_service.py     # Google Drive wrapper
│   │   │   ├── sheets_service.py    # Google Sheets wrapper
│   │   │   ├── slack_service.py     # Slack API wrapper
│   │   │   ├── stripe_service.py    # Stripe billing wrapper
│   │   │   ├── n8n_service.py       # n8n API wrapper + workflow templates
│   │   │   ├── invoice_service.py   # Invoice tracking + predictions
│   │   │   ├── crm_service.py       # Client enrichment + pipeline
│   │   │   ├── report_service.py    # AI report generation
│   │   │   └── alert_service.py     # Smart alert engine
│   │   ├── tasks/
│   │   │   ├── worker.py            # Celery app config
│   │   │   ├── email_tasks.py       # Background email sync + classification
│   │   │   ├── calendar_tasks.py    # Meeting prep generation
│   │   │   ├── invoice_tasks.py     # Payment reminder automation
│   │   │   ├── report_tasks.py      # Scheduled report generation
│   │   │   └── alert_tasks.py       # Alert monitoring
│   │   └── n8n_workflows/
│   │       ├── new_lead_onboarding.json
│   │       ├── invoice_reminder.json
│   │       ├── meeting_prep.json
│   │       ├── weekly_report.json
│   │       ├── client_onboarding.json
│   │       └── slack_notifications.json
│   ├── tests/
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── api/
│   │   │   ├── client.js            # Axios instance + interceptors
│   │   │   └── websocket.js         # WebSocket connection manager
│   │   ├── auth/
│   │   │   ├── AuthProvider.jsx      # Auth context + Google OAuth
│   │   │   ├── ProtectedRoute.jsx    # Route guard
│   │   │   └── LoginPage.jsx         # Google sign-in page
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx         # Home: briefing, stats, command bar
│   │   │   ├── Inbox.jsx             # Smart email inbox
│   │   │   ├── Calendar.jsx          # AI calendar view
│   │   │   ├── Invoices.jsx          # Invoice & payment tracker
│   │   │   ├── Clients.jsx           # CRM with pipeline
│   │   │   ├── Tasks.jsx             # Smart task manager (kanban)
│   │   │   ├── Reports.jsx           # AI-generated reports
│   │   │   ├── Analytics.jsx         # Business intelligence & charts
│   │   │   ├── Automations.jsx       # n8n workflow manager
│   │   │   ├── Settings.jsx          # Integrations, preferences, billing
│   │   │   └── Landing.jsx           # Public marketing landing page
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Sidebar.jsx       # Main navigation
│   │   │   │   ├── Header.jsx        # Top bar + notifications
│   │   │   │   └── Layout.jsx        # Page wrapper
│   │   │   ├── dashboard/
│   │   │   │   ├── MorningBriefing.jsx
│   │   │   │   ├── CommandBar.jsx    # Natural language input
│   │   │   │   ├── StatsGrid.jsx
│   │   │   │   └── ActivityFeed.jsx
│   │   │   ├── inbox/
│   │   │   │   ├── EmailList.jsx
│   │   │   │   ├── EmailCard.jsx
│   │   │   │   ├── ReplyDraft.jsx
│   │   │   │   └── CategoryFilter.jsx
│   │   │   ├── calendar/
│   │   │   │   ├── CalendarGrid.jsx
│   │   │   │   ├── EventCard.jsx
│   │   │   │   └── MeetingPrep.jsx
│   │   │   ├── invoices/
│   │   │   │   ├── InvoiceTable.jsx
│   │   │   │   ├── PaymentChart.jsx
│   │   │   │   └── ReminderStatus.jsx
│   │   │   ├── clients/
│   │   │   │   ├── ClientList.jsx
│   │   │   │   ├── ClientDetail.jsx
│   │   │   │   ├── PipelineBoard.jsx
│   │   │   │   └── ActivityTimeline.jsx
│   │   │   ├── reports/
│   │   │   │   ├── ReportCard.jsx
│   │   │   │   └── RevenueChart.jsx
│   │   │   ├── automations/
│   │   │   │   ├── WorkflowCard.jsx
│   │   │   │   └── WorkflowToggle.jsx
│   │   │   └── shared/
│   │   │       ├── LoadingSpinner.jsx
│   │   │       ├── StatusBadge.jsx
│   │   │       ├── AlertBanner.jsx
│   │   │       ├── EmptyState.jsx
│   │   │       ├── SearchBar.jsx
│   │   │       ├── NotificationBell.jsx
│   │   │       └── AIChatSidebar.jsx  # Always-available AI chat panel
│   │   ├── hooks/
│   │   │   ├── useAuth.js
│   │   │   ├── useWebSocket.js
│   │   │   ├── useEmails.js
│   │   │   ├── useCalendar.js
│   │   │   ├── useInvoices.js
│   │   │   ├── useClients.js
│   │   │   └── useAlerts.js
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   ├── ThemeContext.jsx
│   │   │   └── NotificationContext.jsx
│   │   └── utils/
│   │       ├── formatters.js
│   │       ├── constants.js
│   │       └── helpers.js
│   ├── public/
│   │   └── assets/
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── Dockerfile
│   └── nginx.conf
├── n8n/
│   ├── workflows/                   # Importable n8n workflow JSONs
│   └── docker-data/                 # n8n persistent data
├── demo/                            # Demo data for portfolio
├── docs/
│   ├── API.md
│   ├── ARCHITECTURE.md
│   ├── INTEGRATIONS.md
│   └── DEPLOYMENT.md
├── landing/                         # Static landing page (optional separate deploy)
├── docker-compose.yml
├── docker-compose.demo.yml
├── Makefile
├── README.md
└── .github/
    └── workflows/
        └── ci.yml
```

## Commands
- Full stack: `docker-compose up --build`
- Demo mode: `docker-compose -f docker-compose.yml -f docker-compose.demo.yml up`
- Backend dev: `cd backend && uvicorn app.main:app --reload --port 8000`
- Frontend dev: `cd frontend && npm run dev`
- n8n: `http://localhost:5678` (runs in Docker)
- Backend tests: `cd backend && pytest tests/ -v`
- Frontend tests: `cd frontend && npm test`
- API docs: `http://localhost:8000/docs`

## Code Style
- Backend: Google-style docstrings, type hints, black formatting, async everywhere
- Frontend: ESLint + Prettier, functional components, custom hooks pattern
- Git: conventional commits (feat:, fix:, docs:, etc.)

## Key Rules
- DEMO MODE must work WITHOUT any API keys, OAuth, or external services
- All Google API calls go through service wrappers (never direct in routers)
- All AI calls go through ai_agent.py service (single point of control)
- Every page must have loading states, empty states, and error states
- Mobile responsive — every page must work on phone screens
- Dark mode must work on every component
- WebSocket updates for: new emails, alerts, task completions
- Multi-tenant: every DB query filtered by user_id
- All secrets in .env, never hardcoded
- n8n workflows stored as JSON in repo, importable via API

## Build Plan
The full step-by-step build plan is in `BUILD_PLAN.md`. To continue building this project, read that file and execute the next incomplete phase.
