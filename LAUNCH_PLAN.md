# LYTHERAHUB — SaaS Launch Plan

You're turning LytheraHub from a portfolio project into a real SaaS product.
3 phases. 3 Claude Code sessions. Each session = 1 prompt + let it run.

---

## PHASE A: UI OVERHAUL (Session 1)
Complete all unfinished features in LytheraHub. No explanations — execute only.
Read these files first before touching anything:

frontend/src/components/dashboard/CommandBar.jsx
frontend/src/components/shared/AIChatSidebar.jsx
frontend/src/pages/Inbox.jsx
frontend/src/pages/Calendar.jsx
frontend/src/pages/Clients.jsx
frontend/src/pages/Invoices.jsx
frontend/src/pages/Reports.jsx
frontend/src/pages/Automations.jsx
frontend/src/pages/Tasks.jsx
frontend/src/pages/Analytics.jsx
frontend/src/pages/Settings.jsx
frontend/src/components/layout/Header.jsx
frontend/src/pages/Dashboard.jsx



COMMAND BAR — frontend/src/components/dashboard/CommandBar.jsx


Input calls POST /api/dashboard/command with { command: text }
Show loading spinner while waiting
Display AI response in result box below input
Quick-action chips populate input and auto-submit
Demo fallback (if API fails) based on keywords:

revenue/money → "€27,600 collected this month across 8 invoices. Up 12% from last month."
inbox/email → "12 unread emails. 3 urgent, 2 need replies."
schedule/meeting → "2 meetings today: 10am Standup, 3pm Client Call with Hans Weber."
default → "Here's your business overview. Check the dashboard for the latest updates."





AI CHAT SIDEBAR — frontend/src/components/shared/AIChatSidebar.jsx
Full working chat panel:


Floating button bottom-right (MessageSquare icon, bg-brand-600, rounded-full, w-14 h-14)
Click opens slide-out panel from right (w-96, full height, z-50)
Chat messages: user right (blue bubble), AI left (gray bubble)
Input at bottom with send button
Calls POST /api/chat with { message, history: [] }
Typing indicator (3 animated dots) while waiting
Demo fallback responses if API fails:

revenue → "Your revenue this month is €27,600, up 12% from January."
client/clients → "You have 15 active clients. 3 deals in negotiation worth €85,000."
invoice → "2 invoices overdue totaling €11,700. CloudFirst AG and MediaWave GmbH."
email → "12 unread emails. TechVision sent an urgent message about the Q1 contract."
default → "I'm your AI business assistant. Ask me anything about your clients, revenue, emails, or tasks."


Session history in useState
Close button (X) top-right



INBOX — frontend/src/pages/Inbox.jsx


Ensure DEMO_EMAILS array exists and loads as placeholderData
Split layout: email list left (w-2/5), email detail right (w-3/5)
Clicking email sets selectedEmail state and shows detail panel
Detail panel shows: sender avatar, name, subject, time, AI summary box (bg-blue-50 border-blue-200), body, action items list
"Draft Reply" button calls POST /api/emails/{id}/draft-reply, shows result in textarea
3 tone buttons (Professional/Friendly/Brief) re-call with tone param
Copy button: navigator.clipboard.writeText() + toast "Copied to clipboard"
Category tabs filter email list



CALENDAR — frontend/src/pages/Calendar.jsx


Day/Week/Month toggle switches views (controlled by viewMode state)
If demo events missing for current week, add 5 hardcoded events for current week dates
Click event → side panel with: title, time, location, attendees, AI prep brief text
"Add Event" button opens modal: title, date, time, description fields
Modal submit calls POST /api/calendar/events, closes on success



CLIENTS — drag and drop — frontend/src/pages/Clients.jsx


Pipeline board uses HTML5 drag events only (no new libraries)
onDragStart: set dragging client id in state
onDragOver: preventDefault + highlight column (add ring-2 ring-brand-400)
onDrop: call PUT /api/clients/{id}/stage, update local state optimistically, clear highlight
Client card click opens detail side panel (if not already implemented)



INVOICES — frontend/src/pages/Invoices.jsx


Three-dot (MoreVertical icon) action menu per row
Menu options: View Details, Mark as Paid, Send Reminder, Delete
Mark as Paid → PUT /api/invoices/{id} status=paid + update local state + toast
Send Reminder → POST /api/invoices/{id}/remind + toast "Reminder sent"
Delete → window.confirm() then DELETE /api/invoices/{id} + remove from list
Add Invoice modal: client_name, amount, due_date fields → POST /api/invoices



REPORTS — frontend/src/pages/Reports.jsx


"Generate Now" button → POST /api/reports/generate/{type}
Show spinner for min 1.5s then display result
Daily/Weekly/Monthly tabs each show their report content
Empty state: "No report yet — click Generate Now"



AUTOMATIONS — frontend/src/pages/Automations.jsx


Toggle switches → POST /api/automations/{id}/activate or /deactivate
Optimistic UI update immediately, revert on error
"Run Now" → POST /api/automations/{id}/run → toast "Running..." then "Completed"
"View History" → expand inline showing last 5 runs with status badges (success=green, failed=red)



SETTINGS — frontend/src/pages/Settings.jsx


Profile "Save Changes" → PUT /api/settings + toast "Profile saved"
Notifications "Save Preferences" → PUT /api/settings + toast "Preferences saved"
Billing "Change Plan" → modal with 3 plan cards (Free/Pro/Business), close button
Billing "Cancel Subscription" → window.confirm("Cancel your Pro subscription?") before acting



ANALYTICS — frontend/src/pages/Analytics.jsx
All 4 sections render with Recharts using demo data:


Revenue: BarChart monthly (12 months), stat cards for total/outstanding/growth
Clients: PieChart by industry, bar chart for pipeline funnel
Productivity: LineChart emails per week, task completion rate
AI Insights: 4 cards with TrendingUp/AlertTriangle/CheckCircle/Info icons + title + description
All charts use ResponsiveContainer. Loading skeletons while fetching.



TASKS — frontend/src/pages/Tasks.jsx


3 columns: To Do, In Progress, Done
HTML5 drag-and-drop between columns
On drop: PUT /api/tasks/{id} with new status, update local state
Task cards: title, priority badge (urgent=red, high=orange, medium=blue, low=gray), due date chip, source badge (manual/ai/automation)
Inline "Add Task" input at top of To Do column → POST /api/tasks
Demo tasks pre-populated across all 3 columns



NOTIFICATIONS — frontend/src/components/layout/Header.jsx


Bell icon: GET /api/alerts/count on mount, show red badge if count > 0
Click bell: toggle dropdown showing GET /api/alerts?limit=5
Each alert row: severity icon, title, time ago
"Mark all read" button: PUT /api/alerts/read-all + refetch count
Click outside dropdown closes it (useEffect with mousedown listener)
Demo fallback: show 3 hardcoded alerts if API fails


SELF-TEST:
bashcd frontend && npm run build 2>&1 | tail -10 && echo "EXIT:$?"
grep -l "onDragStart" src/pages/Clients.jsx src/pages/Tasks.jsx
grep "POST.*command\|dashboard/command" src/components/dashboard/CommandBar.jsx
grep "MessageSquare" src/components/shared/AIChatSidebar.jsx
grep "draft-reply\|draftReply" src/pages/Inbox.jsx
grep "MoreVertical\|action.*menu\|actionMenu" src/pages/Invoices.jsx
Fix all build errors before committing.
COMMIT: git add -A && git commit -m "feat: complete all features — chat, inbox, calendar, CRM, invoices, reports, analytics, tasks, notifications"

## PHASE B: FEATURE COMPLETION (Session 2)
**Goal:** Every feature works end-to-end. No dead buttons. No fake data that breaks.

### Before starting: Run `/clear` in Claude Code to reset context.

### Prompt to paste in Claude Code:

```
You are completing all unfinished features in LytheraHub. This is a real SaaS launching for paying customers. Every button must work. Every page must have real functionality. No placeholder text. No dead ends.

Read the codebase first, then fix these in order:

COMMAND BAR (Dashboard):
1. The command bar on the dashboard must actually process natural language. When user types "How much revenue this month?" it should call /api/dashboard/command and display the AI response below the input. The quick-action chips (Schedule meeting, How much revenue, Summarize inbox) must also work when clicked.

AI CHAT SIDEBAR:
2. The chat icon in the bottom-right corner must open a slide-out chat panel. User types a message, it calls /api/chat, and displays the AI response. Conversation history should persist during the session. The chat must work in demo mode with mock AI responses.

INBOX — FULL FUNCTIONALITY:
3. Clicking an email in the inbox list must open the email detail in the right panel showing: full email body, AI summary, category badge, action items. The "Draft Reply" button must generate an AI reply with tone options (Professional, Friendly, Brief). Copy button must copy reply text to clipboard.

CALENDAR — EVENT INTERACTIONS:
4. Clicking an event on the calendar must show event detail in a side panel with: title, time, location, attendees, AI meeting prep brief. The "Add Event" button must open a modal to create a new event. Day/Week/Month view toggles must all work.

CLIENTS — DRAG AND DROP:
5. The pipeline kanban board must support drag-and-drop to move clients between stages. When a card is dropped in a new column, it should call PUT /api/clients/{id}/stage to update the backend. Verify this works in demo mode.

INVOICES — ACTIONS:
6. Every invoice row's action menu (the three dots) must work: View Details, Mark as Paid, Send Reminder, Delete. "Send Reminder" should call the backend and show a toast notification. "Add Invoice" button must open a working creation modal.

REPORTS — GENERATE:
7. The "Generate Now" button must call /api/reports/generate/{type} and show a loading state while generating, then display the new report. Weekly and Monthly tabs must show their respective reports.

AUTOMATIONS — TOGGLES AND RUN:
8. Toggle switches must call activate/deactivate endpoints and update UI state. "Run Now" buttons must call the run endpoint and show success/error toast. "View History" must expand to show execution history.

SETTINGS — ALL TABS:
9. Profile tab: "Save Changes" must call PUT /api/settings and show success toast.
10. Integrations tab: "Connect" buttons should show a modal explaining what the integration does (in demo mode, show "Available in production" message). "Disconnect" should toggle state.
11. Notifications tab: Toggle switches and time pickers must save via API.
12. Billing tab: "Change Plan" must open a modal showing all 3 plans with select buttons. "Cancel Subscription" must show a confirmation dialog.

ANALYTICS PAGE:
13. Revenue, Client, Productivity, and AI Insights sections must all render with Recharts charts using demo data. The AI insights panel must show 3-4 actionable insights.

TASKS PAGE:
14. Kanban board (To Do, In Progress, Done) must render with demo tasks. Drag-and-drop between columns must work. "Add Task" input must create new tasks. Each task card shows: title, priority badge, due date, source badge.

ONBOARDING:
15. New users (first visit) should see the onboarding wizard. For demo mode, skip onboarding and go straight to dashboard. Verify the /onboarding route works if accessed directly.

NOTIFICATIONS:
16. The bell icon in the header must show unread count badge and dropdown with recent alerts. Clicking an alert marks it as read. "Mark all read" button must work.

After ALL changes:
- Run: cd frontend && npm run build — must pass
- Test: cd backend && python -m pytest tests/ -x — must pass
- Git commit: "feat: complete all features — chat, inbox, calendar, CRM, invoices, reports, analytics, tasks"
```

### What this fixes:
- Every button on every page actually does something
- AI chat sidebar works
- Command bar processes queries
- Inbox shows and opens emails with AI features
- Calendar event interactions
- CRM drag-and-drop
- Invoice actions
- Report generation
- Automation controls
- Settings save properly
- Analytics charts render
- Tasks kanban works
- Notifications dropdown works

---

## PHASE C: PRODUCTION HARDENING (Session 3)
**Goal:** Make it deployable, secure, and ready for real users.

### Before starting: Run `/clear` in Claude Code to reset context.

### Prompt to paste in Claude Code:

```
You are preparing LytheraHub for production deployment. This is a real SaaS that will have paying customers. Every change must be production-grade.

SECURITY:
1. Verify all API endpoints require authentication except: /health, /api/auth/google, /api/auth/google/callback, /api/auth/demo, /api/auth/refresh, and all landing page routes.
2. Add rate limiting to /api/auth/demo (max 10 requests per minute per IP).
3. Verify JWT tokens have proper expiration (access: 1 hour, refresh: 30 days).
4. Ensure CORS is configured to only allow the frontend origin in production (read from env var ALLOWED_ORIGINS).
5. Verify all user data queries are filtered by user_id (multi-tenant safety).

ERROR HANDLING:
6. Add global error boundary in React (ErrorBoundary component) that catches crashes and shows a friendly "Something went wrong" page with a "Go to Dashboard" button.
7. Verify all API calls in frontend have try/catch with user-friendly toast error messages (not raw error dumps).
8. Add 404 page for unknown routes.

PERFORMANCE:
9. Add React.lazy + Suspense for all page components in App.jsx (code splitting).
10. Add loading skeletons for Dashboard, Inbox, Invoices, Clients pages (not just spinners).

SEO & META:
11. Landing page must have proper meta tags: description, og:title, og:description, og:image (use a placeholder URL).
12. Add robots.txt to frontend/public allowing search engines.
13. Add sitemap.xml with landing page URL.

DEPLOYMENT:
14. Verify docker-compose.yml works: all services start, frontend serves at :3000, backend at :8000, n8n at :5678.
15. Verify docker-compose.demo.yml override works for demo mode.
16. Add health check endpoints that Docker can use for container health monitoring.
17. Create a .env.production.example with all required production environment variables documented.

README:
18. Update README.md to reflect the current state: all features, screenshots section (placeholder paths), deployment instructions, environment variables table, and a "Quick Start" that actually works.

After ALL changes:
- Run: cd frontend && npm run build — must pass
- Run: cd backend && python -m pytest tests/ -x — must pass
- Run: docker-compose config — must be valid
- Git commit: "feat: production hardening — security, errors, performance, SEO, deployment"
- Git tag: v2.0.0
```

### What this fixes:
- Security (auth, rate limiting, CORS, multi-tenant)
- Error handling (error boundary, 404 page, toast errors)
- Performance (code splitting, loading skeletons)
- SEO (meta tags, robots.txt, sitemap)
- Deployment (Docker verified, env documented)
- README updated

---

## EXECUTION ORDER

| Session | Phase | Time | What happens |
|---------|-------|------|-------------|
| 1 | A: UI Overhaul | ~45 min | App looks professional |
| 2 | B: Features | ~60 min | Everything works |
| 3 | C: Production | ~30 min | Ready to deploy |

After all 3 sessions: review everything together and decide next steps.

## RULES FOR EACH SESSION
- Start with `/clear` (except Session 1)
- Set permissions: `/permissions` → `allow Write *` → `allow Bash *`
- Paste the prompt
- Let it run — don't interrupt
- When done, test in browser
- Come back here with screenshots of anything broken
- We fix and move to next phase

## AFTER ALL 3 PHASES
- Review the full product together
- Decide what needs more work
- Decide if/when to deploy
- Your call on next steps
