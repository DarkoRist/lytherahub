# How to Use These Files — LytheraHub AI

## Setup (do this once)

```bash
# 1. Create your project folder
mkdir lytherahub
cd lytherahub

# 2. Copy CLAUDE.md, BUILD_PLAN.md, and HOW_TO_USE.md into this folder

# 3. Initialize git
git init

# 4. Start Claude Code
claude
```

## Building the Project

Paste this as your first message:

```
You are building this project from scratch. Read BUILD_PLAN.md to understand the full plan. Execute phases one at a time, starting from the first ❌ phase. For each phase: 1) Build everything described 2) Test that it works 3) Mark the phase ✅ 4) Git commit with "Phase X: [description]" 5) Briefly tell me what you built. Then move to the next phase automatically. Don't stop to ask me design questions — make your best call. Only stop if something is broken after 2 attempts.
```

When you come back after a break or rate limit:

```
Read BUILD_PLAN.md and continue from the next ❌ phase. Same rules as before — build, test, mark ✅, commit, move on.
```

## Token-Saving Tips

- `/compact` after every 2 phases
- `/clear` between major sections (backend vs frontend)
- Stay on Sonnet
- If something breaks: `Fix the error in [filename]`

## Session Planning

This is a 34-phase build. Plan for 10-12 sessions over ~2 weeks:

| Session | Phases | What gets built |
|---------|--------|----------------|
| 1 | 1-3 | Scaffolding, database, auth |
| 2 | 4-6 | AI agent, Gmail, Calendar |
| 3 | 7-9 | Invoices, CRM, Slack |
| 4 | 10-12 | Stripe, alerts, reports |
| 5 | 13-15 | n8n, command bar, WebSocket |
| 6 | 16-18 | Frontend: layout, landing, dashboard |
| 7 | 19-21 | Frontend: inbox, calendar, invoices |
| 8 | 22-25 | Frontend: CRM, reports, automations, settings |
| 9 | 26-28 | Demo mode, tests, Docker |
| 10 | 29-30 | AI chat assistant, task manager |
| 11 | 31-32 | Analytics page, onboarding flow |
| 12 | 33-34 | Documentation and final polish |

## Prerequisites

Make sure you have installed:
- **Python 3.10+** ✅ (from previous projects)
- **Node.js 18+** ✅ (from Project 2)
- **Docker Desktop** — https://www.docker.com/products/docker-desktop
- **Git** ✅ (already using it)

## Running the Finished Product

```bash
# Demo mode (no API keys, no external services)
docker-compose -f docker-compose.yml -f docker-compose.demo.yml up --build

# Open http://localhost:3000
# Click "Try Demo" — instant access to everything
```

## After It's Built

1. Push to GitHub
2. Deploy demo on Railway or Render (~€5/month)
3. Record demo video with Loom
4. Add to Upwork + LinkedIn portfolio
5. Start pitching to small businesses
