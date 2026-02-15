# LytheraHub Integrations Guide

## Google Workspace

### Prerequisites
1. Create a project in [Google Cloud Console](https://console.cloud.google.com)
2. Enable these APIs:
   - Gmail API
   - Google Calendar API
   - Google Drive API
   - Google Sheets API
3. Create OAuth 2.0 credentials (Web application)
4. Add authorized redirect URI: `http://localhost:8000/api/auth/google/callback`

### Configuration

Add to `backend/.env`:

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8000/api/auth/google/callback
```

### Scopes Requested

When a user logs in via Google, LytheraHub requests:
- `openid`, `email`, `profile` — basic user info
- `https://www.googleapis.com/auth/gmail.readonly` — read emails
- `https://www.googleapis.com/auth/gmail.compose` — draft and send replies
- `https://www.googleapis.com/auth/calendar` — read/write calendar events
- `https://www.googleapis.com/auth/drive.file` — create client folders
- `https://www.googleapis.com/auth/spreadsheets` — export reports

---

## Slack

### Setup
1. Create a Slack app at [api.slack.com](https://api.slack.com/apps)
2. Enable Bot Token Scopes: `chat:write`, `channels:history`, `commands`, `im:write`
3. Install the app to your workspace
4. Set up slash command: `/lytherahub` pointing to `https://your-domain.com/api/slack/commands`
5. Set up event subscriptions URL: `https://your-domain.com/api/slack/events`

### Configuration

```env
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_SIGNING_SECRET=your-signing-secret
```

### Capabilities
- **Morning briefing DM** — daily AI summary sent to your Slack DM
- **Alert notifications** — overdue invoices, stale leads, etc.
- **Slash commands** — `/lytherahub briefing`, `/lytherahub tasks`, `/lytherahub invoice status`
- **Channel summaries** — summarize recent channel activity on demand

---

## Stripe

### Setup
1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Get API keys from the Stripe Dashboard
3. Set up webhook endpoint: `https://your-domain.com/api/billing/webhook`
4. Subscribe to events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`

### Configuration

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_BUSINESS_PRICE_ID=price_...
```

### Plans
| Plan | Price | Features |
|---|---|---|
| Free | EUR 0/mo | 1 email, 5 clients, basic reports |
| Pro | EUR 49/mo | Unlimited everything, all integrations |
| Business | EUR 149/mo | Team features, priority support, API access |

---

## n8n Workflow Engine

### Setup
n8n runs as a Docker container alongside the other services. No external setup required.

### Configuration

```env
N8N_HOST=http://n8n:5678
N8N_API_KEY=your-n8n-api-key
```

### Pre-built Workflows
1. **New Lead Onboarding** — New client email → Create in CRM → Send welcome → Create Drive folder
2. **Invoice Reminder** — Invoice overdue → Check days → Send escalating reminder
3. **Meeting Prep** — Calendar event tomorrow → Fetch client data → Generate brief → Email
4. **Weekly Report** — Every Monday → Gather metrics → Generate report → Email + Slack
5. **Client Onboarding** — Client won → Create folders → Send onboarding email → Schedule kickoff
6. **Slack Daily Briefing** — Every morning → Generate briefing → Post to Slack DM

### Custom Workflows
Access the n8n editor at `http://localhost:5678` to create custom workflows. LytheraHub manages workflow activation/deactivation and tracks execution history via the n8n REST API.

---

## Claude AI (Anthropic)

### Configuration

```env
ANTHROPIC_API_KEY=sk-ant-...
```

### AI Capabilities
All AI operations go through `backend/app/services/ai_agent.py`:

- **Email**: classify, summarize, draft replies, extract action items, detect urgency
- **Calendar**: generate meeting prep, extract action items, suggest times
- **Business**: enrich clients, daily briefing, weekly/monthly reports, command parsing
- **Invoices**: predict payment risk, generate reminders, forecast cash flow

### Demo Mode
When no API key is configured (or `DEMO_MODE=true`), all AI methods return realistic mock responses. This allows the full app to function without any Anthropic API costs.

---

## Future Integrations

Planned for upcoming releases:
- **Notion** — sync tasks and notes
- **WhatsApp Business** — client messaging
- **Xero / QuickBooks** — accounting sync
- **HubSpot** — CRM import/export
- **Discord** — team notifications bot
