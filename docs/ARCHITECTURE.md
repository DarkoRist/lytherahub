# LytheraHub Architecture

## System Overview

```
                          ┌─────────────────┐
                          │    Browser       │
                          │  (React SPA)     │
                          └────────┬────────┘
                                   │ HTTP / WS
                          ┌────────┴────────┐
                          │   Nginx :3000    │
                          │  Reverse Proxy   │
                          └────────┬────────┘
                                   │
                 ┌─────────────────┼─────────────────┐
                 │                 │                  │
          Static Files      /api/* proxy       /ws/* upgrade
                 │                 │                  │
          ┌──────┴──────┐  ┌──────┴──────┐           │
          │ React Build │  │ FastAPI     │───────────┘
          │ (Vite)      │  │ :8000       │
          └─────────────┘  └──────┬──────┘
                                  │
               ┌──────────────────┼──────────────────┐
               │                  │                   │
        ┌──────┴──────┐   ┌──────┴──────┐    ┌──────┴──────┐
        │ PostgreSQL   │   │   Redis     │    │  n8n :5678  │
        │ :5432        │   │   :6379     │    │  Workflows  │
        └──────────────┘   └──────┬──────┘    └─────────────┘
                                  │
                           ┌──────┴──────┐
                           │   Celery    │
                           │  Workers    │
                           └──────┬──────┘
                                  │
               ┌──────────────────┼──────────────────┐
               │                  │                   │
        ┌──────┴──────┐   ┌──────┴──────┐    ┌──────┴──────┐
        │  Gmail API   │   │ Calendar   │    │ Claude AI   │
        │  Drive API   │   │ Sheets API │    │ (Anthropic) │
        └──────────────┘   └────────────┘    └─────────────┘
```

## Component Breakdown

### Backend (FastAPI)

The backend follows a **layered architecture**:

1. **Routers** (`app/routers/`) — HTTP endpoint definitions, request validation, response formatting
2. **Services** (`app/services/`) — Business logic, external API wrappers, AI orchestration
3. **Models** (`app/models/`) — SQLAlchemy ORM models and Pydantic schemas
4. **Tasks** (`app/tasks/`) — Celery background tasks for async operations
5. **Auth** (`app/auth/`) — Google OAuth + JWT token management

**Key design decisions:**

- **Async everywhere**: All database queries and external API calls use `async/await`
- **Multi-tenant**: Every database query is filtered by `user_id`
- **Single AI entry point**: All AI operations go through `ai_agent.py`
- **Service wrappers**: Google APIs are never called directly from routers
- **Demo mode**: Every service has a demo fallback that returns realistic mock data

### Frontend (React)

The frontend follows a **component-based architecture**:

1. **Pages** (`src/pages/`) — Top-level route components (11 pages)
2. **Components** (`src/components/`) — Reusable UI components organized by domain
3. **Hooks** (`src/hooks/`) — Custom hooks for data fetching and state
4. **Context** (`src/context/`) — Global state (Auth, Theme, Notifications)
5. **API** (`src/api/`) — Axios client with interceptors + WebSocket manager

**Key design decisions:**

- **React Query**: All API data fetched via `useQuery` with automatic caching and refresh
- **Tailwind + dark mode**: Every component supports light/dark mode via CSS classes
- **Demo fallbacks**: Every `useQuery` has `placeholderData` with demo data so the UI always renders
- **Mobile-first responsive**: All layouts work on phone, tablet, and desktop

### Database

PostgreSQL in production, SQLite in demo/dev mode.

**10 core tables:**
- `users` — Auth, profile, preferences
- `emails` — Gmail sync with AI classification
- `calendar_events` — Google Calendar with prep briefs
- `invoices` — Payment tracking with reminders
- `clients` — CRM with pipeline stages
- `tasks` — Kanban with auto-generation
- `alerts` — Smart notifications
- `automations` — n8n workflow tracking
- `reports` — AI-generated business reports
- `activity_log` — Audit trail

### Real-Time (WebSocket)

- FastAPI WebSocket endpoint at `/ws/{user_id}`
- `ConnectionManager` tracks connected clients per user
- Services broadcast events (new email, alert, payment, etc.)
- Frontend `useWebSocket` hook auto-connects and dispatches events
- Demo mode simulates events every 30 seconds

### Background Tasks (Celery)

Celery workers handle:
- Email sync and classification (every 5 min)
- Meeting prep generation (daily at 8pm)
- Overdue invoice checks (daily)
- Alert monitoring (every 30 min)
- Report generation (daily/weekly/monthly schedules)

### Automation Engine (n8n)

Self-hosted n8n instance for complex multi-step workflows:
- Workflow templates stored as JSON in the repo
- Managed via REST API from the backend
- 6 pre-built templates: lead onboarding, invoice reminders, meeting prep, weekly report, client onboarding, Slack briefing

## Security

- **Authentication**: Google OAuth 2.0 + JWT (access token 1hr, refresh token 30 days)
- **Authorization**: Every endpoint checks `get_current_user` dependency
- **Multi-tenancy**: All queries filtered by `user_id` — no cross-tenant data access
- **Secrets**: All API keys in `.env`, never in code
- **CORS**: Configurable allowed origins
- **Token storage**: Session storage (not localStorage) on frontend

## Deployment

Docker Compose orchestrates 7 services:

| Service | Port | Purpose |
|---|---|---|
| frontend | 3000 | React SPA + Nginx |
| backend | 8000 | FastAPI API |
| postgres | 5432 | Database |
| redis | 6379 | Cache + message broker |
| celery-worker | — | Background tasks |
| celery-beat | — | Scheduled tasks |
| n8n | 5678 | Workflow engine |

All services have health checks, restart policies, and shared Docker volumes.
