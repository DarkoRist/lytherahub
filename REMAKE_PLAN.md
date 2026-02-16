# LytheraHub — Professional UI Remake Master Plan
# Quality target: Pipedrive / Linear / Stripe Dashboard
# Every section is an instruction, not a suggestion.

---

## CORE PROBLEM

The entire app renders in dark mode with navy (#0f1629) backgrounds.
This makes it look like a developer tool, not an enterprise SaaS.
The fix is NOT to remove dark mode — it's to make LIGHT MODE the default
and make it look like Pipedrive (white, clean, structured, professional).

---

## DESIGN SYSTEM — APPLY EVERYWHERE

### Colors (light mode default)
- Page background: `bg-white` or `bg-slate-50`
- Sidebar: `bg-white` with `border-r border-slate-200`
- Cards: `bg-white border border-slate-200 rounded-xl`
- Header: `bg-white border-b border-slate-200`
- Primary text: `text-slate-900`
- Secondary text: `text-slate-500`
- Muted text: `text-slate-400`
- Primary action: `bg-blue-600 hover:bg-blue-700 text-white`
- Danger: `bg-red-50 text-red-700 border border-red-200`
- Success badge: `bg-emerald-50 text-emerald-700`
- Warning badge: `bg-amber-50 text-amber-700`

### Typography
- Page title: `text-2xl font-semibold text-slate-900`
- Page subtitle: `text-sm text-slate-500 mt-1`
- Section header: `text-base font-semibold text-slate-900`
- Body: `text-sm text-slate-700`
- Label: `text-xs font-medium text-slate-500 uppercase tracking-wider`

### Spacing
- Page padding: `px-8 py-6`
- Card padding: `p-6`
- Section gap: `space-y-6`
- Between label and input: `mt-1.5`

### Inputs
```
className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm
text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none
focus:ring-2 focus:ring-blue-500/20"
```

### Buttons
Primary: `rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors`
Secondary: `rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors`
Danger: `rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors`
Ghost: `rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 transition-colors`

### Dark mode
Keep dark mode as opt-in toggle. When dark:
- Background: `dark:bg-slate-900`
- Cards: `dark:bg-slate-800 dark:border-slate-700`
- Text: `dark:text-white` / `dark:text-slate-400`

---

## FILE 1: ThemeContext.jsx
Force light as default. Prevent dark flash on load.

```jsx
const [dark, setDark] = useState(() => {
  const stored = localStorage.getItem('lytherahub_theme')
  return stored === 'dark'
})

useEffect(() => {
  if (dark) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
  localStorage.setItem('lytherahub_theme', dark ? 'dark' : 'light')
}, [dark])
```

Add to index.html <head> before any scripts:
```html
<script>
  if (localStorage.getItem('lytherahub_theme') === 'dark') {
    document.documentElement.classList.add('dark')
  }
</script>
```

---

## FILE 2: Layout.jsx + Sidebar.jsx + Header.jsx

### Sidebar — complete rebuild
Width: w-60 collapsed: w-16. Background: white with right border.

Logo area (h-16, border-bottom):
- Blue lightning bolt icon (Zap) in blue-600 rounded-lg
- "LytheraHub" text bold slate-900
- Clickable, navigates to /

Navigation groups with section labels:
```
MAIN
  Dashboard
  Inbox (show unread count badge if > 0)
  Calendar

WORK
  Invoices
  Clients
  Tasks

INSIGHTS
  Analytics
  Reports
  Automations

SYSTEM
  Settings
```

Each nav item:
- Icon (20px) + label
- Active state: `bg-blue-50 text-blue-700 font-medium` with left blue border accent `border-l-2 border-blue-600`
- Inactive: `text-slate-600 hover:bg-slate-50 hover:text-slate-900`
- Padding: `px-3 py-2` with gap-3 between icon and text

Section labels (when expanded):
`text-[10px] font-semibold uppercase tracking-widest text-slate-400 px-3 mt-4 mb-1`

Bottom of sidebar:
- User avatar + name + plan badge
- Collapse toggle button

### Header — complete rebuild
Height h-14. White background. Bottom border slate-200.

Left side:
- Mobile hamburger (md:hidden)
- Search bar: rounded-lg, border, slate-50 bg, placeholder "Search or type a command...", keyboard shortcut hint ⌘K

Right side (gap-2):
- Dark mode toggle (Sun/Moon icon, ghost button)
- Notification bell with red badge showing count
- User avatar (circle with initials or photo, 32px)
- Clicking avatar shows dropdown: name, email, divider, Settings link, Logout button

### Demo Banner
Slim. Not blue. Gray. Dismissible.
`bg-slate-100 border-b border-slate-200`
Text: `text-xs text-slate-600`
"Demo Mode — Exploring with sample data." + X dismiss button right-aligned.

---

## FILE 3: Dashboard.jsx + components

### Morning Briefing card
White card, blue left border accent (`border-l-4 border-blue-600`).
Header row: Sparkles icon + "Good morning, Darko" + date right-aligned.
AI summary text in slate-700.
Priority actions: 3 action items each with icon, text, and quick-action button.

### Command Bar
White card. Large search-style input (not a card within a card).
Placeholder: "Ask anything — 'How much revenue this month?' or 'Schedule a meeting with Hans'"
Send button right side of input (blue, icon + text).
Response appears below in a result box with subtle blue-50 background.
Quick chips below input: rounded-full, slate border, small text.

### Stats Grid — 4 cards
Each card: white, border, rounded-xl, p-5.
Layout: icon top-right (colored, 36px rounded-lg bg), metric value large bold, label small slate-500, trend arrow bottom.
No dark navy backgrounds on cards in light mode.

### Activity Feed + Alerts — 2 column
Both as white bordered cards.
Activity: timeline list with colored dot indicators.
Alerts: severity-colored left border per item (red=critical, amber=warning, blue=info).

---

## FILE 4: Inbox.jsx + components

### Layout
Full height split: email list (380px fixed width) left, detail panel right.
Both panels white with border between.

### Email list
Each item: hover bg-slate-50, cursor-pointer.
Selected: bg-blue-50 border-l-2 border-blue-600.
Shows: sender avatar (colored initial), name bold, subject, snippet muted, time right, category badge.
Unread: name and subject font-semibold, dot indicator.

### Email detail panel
Sticky header: from/to/date, action icons (Reply, Archive, Star).
AI Summary box: blue-50 bg, blue border-l-4, Sparkles icon, summary text.
Email body: clean prose, proper line height.
Action items section: checklist style if present.

### AI Reply section
Separate section below body.
Tone selector: 3 pill buttons (Professional selected=blue, Friendly, Brief).
Generated reply in white textarea with border.
Button row: "Generate Reply" (blue), "Copy" (secondary), "Send" (blue).

### Category tabs
All | Urgent (red badge) | Clients | Invoices | Newsletters | Other
Tab style: border-b-2 on active, text-blue-600.

---

## FILE 5: Calendar.jsx

### Layout
Left: main calendar grid. Right: today's schedule sidebar (280px).

### Calendar grid
White background. Day headers: slate-100 bg.
Today's date: blue-600 circle.
Event blocks: colored by type (meeting=blue, call=green, deadline=red).
Event block: rounded-md, colored bg, white text, time + title.

### View toggle
Day | Week | Month — pill toggle buttons, active=blue filled.

### Event detail panel
Slides in from right when event clicked (not a modal).
Shows: title, time range, location with map pin icon, attendees with avatar initials.
AI Prep section: blue-50 card with Sparkles icon, prep brief text.
Action buttons: Edit, Delete — bottom of panel.

### Add Event modal
Clean modal: white, rounded-2xl, shadow-xl.
Fields: Title, Date, Start Time, End Time, Location, Attendees (comma separated), Description.
Buttons: Cancel (secondary) + Create Event (blue).

---

## FILE 6: Invoices.jsx

### Stats bar — 4 metric cards
Same style as dashboard stats. Colors: Outstanding=blue, Overdue=red, Paid=green, Revenue=slate.

### Revenue chart
White card. Chart title + toggle buttons (Revenue / Forecast) top-right.
Recharts ComposedChart: bars for invoiced, line for collected.
X axis: month labels. Y axis: EUR amounts.

### Invoice table
Clean table. White bg. Alternating row hover (slate-50).
Columns: Invoice # (blue link style), Client, Amount (font-medium), Status (badge), Due Date, Actions (three dots).
Status badges: Draft=slate, Sent=blue, Paid=green, Overdue=red.
Three-dot menu: View Details, Mark as Paid, Send Reminder, Delete — all must work.

### Add Invoice modal
Fields: Invoice # (auto-generated), Client (text), Amount, Due Date, Notes.
Both Cancel and Create Invoice buttons must work.

---

## FILE 7: Clients.jsx

### Pipeline view (Kanban)
Columns: Lead | Contacted | Proposal | Negotiation | Won | Lost
Column header: label + count badge + total value.
Card: white, border, rounded-xl, shadow-sm.
Card content: company name bold, contact name muted, deal value, industry badge, last contact date.
Drag-and-drop: highlight column with blue ring on drag-over. Must call PUT /api/clients/{id}/stage on drop.

### Table view
Clean sortable table. Same columns as current but light themed.
Clickable rows → open client detail.

### Client detail slide-over
Full height panel from right (480px wide).
Header: company name, industry badge, pipeline stage badge.
Sections: Contact info, Deal value, AI Enrichment info, Notes.
Activity timeline at bottom: email/meeting/invoice events chronological.
Action buttons: Send Email, Schedule Meeting, Create Invoice, Edit.

### Add Client modal
All current fields. Clean layout. Both buttons work.

### Stale leads banner
Amber-50 background, amber border, warning icon.
"3 leads haven't been contacted in 7+ days" with names listed.
Dismiss button.

---

## FILE 8: Tasks.jsx

### Layout
Full-width kanban. 3 equal columns.
Column header: colored dot + title + count badge.

### Task cards
White, border, rounded-lg, shadow-sm. p-4.
Title: text-sm font-medium slate-900.
Description: text-xs slate-500 line-clamp-2.
Footer row: priority badge (urgent=red, high=orange, medium=blue, low=slate) + due date chip + source badge.
Drag handle icon (GripVertical) on hover.
Drag-and-drop must work between columns.

### Add Task
"+ Add task" button at top of To Do column.
Inline input appears: type title, press Enter or click Add.
Full modal on "+ New Task" button top-right: Title, Description, Priority, Due Date.

---

## FILE 9: Analytics.jsx

### Tab navigation
Revenue | Clients | Productivity | AI Insights
Clean tab style matching Settings tabs.

### Revenue tab
4 stat cards top (Total Collected, This Month, Outstanding, Overdue).
Monthly Revenue BarChart — blue bars, clean axes, proper EUR formatting.
Revenue by Client — PieChart with legend table right side.

### Clients tab
4 stat cards (Total, Win Rate, Avg Deal Value, Won/Lost).
Pipeline Funnel — horizontal funnel visualization with stage counts and values.
Top Clients by Deal Value — ranked list.
Clients by Industry — horizontal BarChart.

### Productivity tab
4 stat cards (Emails 30d, Meetings 30d, Tasks Completed, Tasks Overdue).
Weekly Email Volume — LineChart.
Task Completion Rate — radial/donut chart showing % complete.
Email Response Rate — donut chart.

### AI Insights tab
NOT just 2 items. Must show at least 6 insight cards:
- Revenue up/down trend
- Overdue invoice warning with names
- Stale leads alert
- Top performing client
- Task completion rate
- Win rate vs last month
Each card: icon (colored), title bold, description, optional action button.

---

## FILE 10: Reports.jsx

### Morning briefing hero card
Full width. Blue gradient or clean white with blue accent.
Sparkles icon. "Daily Briefing — February 16, 2026".
Rich content: email stats, meeting count, revenue, priorities.
NOT just a spinner icon with nothing else.

### Charts section
Email Volume (BarChart) + Revenue Trend (LineChart) side by side.

### Report tabs
Daily Briefing | Weekly | Monthly
Each tab shows list of past reports.
Each report row: expand on click to show full content.

### Generate Now button
Top right. Blue. On click: show loading spinner min 1.5s, then add new report to list.

---

## FILE 11: Automations.jsx

### Stats bar
Active | Total Runs | Time Saved | Success Rate — 4 metric cards.

### Automation cards
2-column grid. Each card: white, border, rounded-xl.
Card content: icon + title + description + trigger badge (EVENT/SCHEDULED) + last run + run count.
Toggle switch right side — must call activate/deactivate API. Optimistic update.
"Run Now" button — must show loading then success/error toast.
"View History" — expands inline table showing last 5 runs with timestamp, status badge, duration.

---

## FILE 12: Settings.jsx

### Layout
Left column: vertical nav tabs (like Pipedrive settings sidebar).
Right column: content area.

Nav tabs (left sidebar, not top tabs):
```
Account
  Profile
  Password & Security

Integrations
  Connected Apps

Notifications
  Alert Preferences

Billing
  Plan & Usage
  Billing History
```

Each section is a separate card with title, description, fields, save button.

### Profile section
Avatar (large, 80px) with change button.
Full Name, Email (disabled), Business Name, Timezone.
Save Changes button — must call API, show success toast.

### Integrations section
Each integration: icon, name, status pill (Connected=green / Not connected=slate), last synced, Connect/Disconnect button.
Connect buttons in demo: show modal "This integration is available in production. Connect your [Service] account to enable real-time sync."

### Notifications section
Toggle rows for Email / Push / Slack.
Morning briefing time picker.
Alert severity threshold selector.
Quiet hours start/end.
Save Preferences — must call API, show success toast.

### Billing section
Current plan card: clean white, plan name badge, price, feature list, renews date.
Change Plan button → modal with 3 plan cards (Free/Pro/Business), each with Select button.
Cancel Subscription → confirmation dialog: "Are you sure? You will lose access to Pro features." with Cancel and Confirm buttons.
Billing history table: Date, Description, Amount, Download receipt link.

---

## FILE 13: AIChatSidebar.jsx

Floating button: bottom-right, fixed position, z-50.
Blue circle button (56px), MessageSquare icon, white.
On click: slide-out panel from right. w-96, full height, white bg, left border.

Panel header: "AI Assistant" + close X button.
Quick action chips below header: "Revenue this month", "Overdue invoices", "Today's meetings", "Stale leads"

Chat area: flex-col, overflow-y-auto.
User messages: right-aligned, blue-600 bg, white text, rounded-2xl rounded-br-sm.
AI messages: left-aligned, slate-100 bg, slate-900 text, rounded-2xl rounded-bl-sm.
Timestamp under each message.
Typing indicator: 3 animated dots when waiting.

Input area: sticky bottom, white bg, border-top.
Text input + Send button (blue icon button).

Demo responses must be realistic and varied — not the same every time.
Session history persists while panel is open.

---

## WHAT MUST WORK — BUTTON CHECKLIST

### Dashboard
- [ ] Command bar input → submits on Enter or Send click → shows AI response
- [ ] Quick action chips → populate input and submit
- [ ] Alert "Read" button → marks alert as read, updates UI
- [ ] Alert "Dismiss" button → removes alert from list
- [ ] "View all activity" link → navigates somewhere useful

### Inbox
- [ ] Category tabs → filter email list
- [ ] Email row click → opens detail panel
- [ ] Star toggle → toggles star state
- [ ] "Draft Reply" → generates AI reply, shows in textarea
- [ ] Tone buttons (Professional/Friendly/Brief) → regenerates reply
- [ ] "Copy" button → copies to clipboard, shows toast
- [ ] "Send Reply" → shows success toast (demo: simulated)
- [ ] Search bar → filters email list

### Calendar
- [ ] Day/Week/Month toggle → switches view
- [ ] Previous/Next navigation → changes date range
- [ ] "Today" button → goes back to current date
- [ ] Event click → opens detail panel
- [ ] "Generate Prep Brief" button → shows prep content
- [ ] "+ Add Event" → opens modal
- [ ] Modal "Create Event" → closes modal, shows toast
- [ ] Modal "Cancel" → closes modal

### Invoices
- [ ] Status filter tabs (All/Draft/Sent/Paid/Overdue) → filters table
- [ ] Sort column headers → sorts table
- [ ] Three-dot menu → opens action dropdown
- [ ] "View Details" → shows invoice detail modal
- [ ] "Mark as Paid" → updates status badge in table
- [ ] "Send Reminder" → shows success toast
- [ ] "Delete" → confirms then removes from list
- [ ] Revenue/Forecast chart toggle → switches chart data
- [ ] "+ New Invoice" → opens creation modal
- [ ] Modal "Create Invoice" → adds to list, closes modal
- [ ] Modal "Cancel" → closes modal

### Clients
- [ ] Pipeline/Table view toggle → switches view
- [ ] Search bar → filters clients
- [ ] Card drag-and-drop → moves between columns, updates stage
- [ ] Card three-dot menu → Edit, View Details, Delete options
- [ ] Client click → opens detail slide-over
- [ ] "AI Enrich" button → shows enrichment data (demo: mock)
- [ ] "+ Add Client" → opens modal
- [ ] Modal "Add Client" → adds to board, closes modal
- [ ] Modal "Cancel" → closes modal
- [ ] Stale leads banner dismiss → hides banner

### Tasks
- [ ] Drag cards between columns → updates task status
- [ ] "+ Add task" inline → creates task in To Do
- [ ] "+ New Task" button → opens modal
- [ ] Modal "Add Task" → creates task, closes modal
- [ ] Priority filter → filters all columns
- [ ] Task card checkbox → marks complete, moves to Done

### Analytics
- [ ] Revenue/Clients/Productivity/AI Insights tabs → switches content
- [ ] Charts render with data (no empty charts)
- [ ] AI Insights shows minimum 6 insight cards

### Reports
- [ ] Daily Briefing/Weekly/Monthly tabs → shows respective reports
- [ ] Report row click → expands full report content
- [ ] "Generate Now" → loading state → adds new report

### Automations
- [ ] Toggle switches → call API, optimistic update, revert on error
- [ ] "Run Now" → loading state → success/error toast
- [ ] "View History" → expands execution history table
- [ ] History shows status badges (success=green dot, failed=red dot)

### Settings
- [ ] Profile "Save Changes" → API call → success toast
- [ ] Integration "Connect" → demo modal explaining feature
- [ ] Integration "Disconnect" → toggles to disconnected state
- [ ] Notification toggles → update state
- [ ] Notification "Save Preferences" → API call → success toast
- [ ] Billing "Change Plan" → opens plan selection modal
- [ ] Plan modal "Select" → shows "Plan updated" toast
- [ ] Billing "Cancel Subscription" → confirmation dialog
- [ ] Confirmation "Confirm" → shows cancellation toast
- [ ] Billing history "Download" → shows "Available in production" toast

### Header
- [ ] Search bar → focus shows command palette style UI
- [ ] Bell icon → shows notification dropdown
- [ ] Notification item click → marks as read
- [ ] "Mark all read" → clears badge count
- [ ] Dark mode toggle → switches theme, persists in localStorage
- [ ] User avatar click → shows dropdown
- [ ] Dropdown "Settings" → navigates to /settings
- [ ] Dropdown "Logout" → logs out, navigates to /

### AI Chat Sidebar
- [ ] Chat button → opens panel
- [ ] Close button → closes panel
- [ ] Quick chips → populate input and send
- [ ] Input + Enter → sends message
- [ ] Send button → sends message
- [ ] AI response → appears with typing indicator first
- [ ] Multiple messages → scroll works, history preserved

---

## ISSUES VISIBLE IN CURRENT SCREENSHOTS

1. **DARK MODE DEFAULT** — entire app is dark navy. Fix ThemeContext.
2. **Dashboard** — content floats in dark void, cards barely visible.
3. **Inbox** — "Generate Reply" button is just a purple bar with no visible text. Fix button styling.
4. **Calendar** — actually looks decent structurally, just needs light mode.
5. **Invoices** — stats cards look dark/flat. Table has no row hover. Three-dot menus need verification.
6. **Clients Pipeline** — dark cards on dark bg. Column values show but cards need more contrast.
7. **Tasks** — tiny text unreadable at this zoom level. Cards need more padding and better contrast.
8. **Analytics AI Insights** — only 2 insights shown, large empty space below. Needs 6+ insights.
9. **Reports** — morning briefing section shows just a spinner icon, no content. Fix.
10. **Automations** — actually structured well. Just needs light mode.
11. **Settings** — narrow layout (max-w leaving huge empty space). Left sidebar nav needed.

---

## EXECUTION INSTRUCTIONS FOR CLAUDE CODE

Read all modified files first before touching anything.
Apply changes in this order to avoid breaking dependencies:
1. ThemeContext.jsx + index.html (flash prevention)
2. index.css (any global overrides needed)
3. Layout.jsx + Sidebar.jsx + Header.jsx (shell)
4. Dashboard.jsx + sub-components
5. Inbox.jsx + sub-components
6. Calendar.jsx
7. Invoices.jsx
8. Clients.jsx
9. Tasks.jsx
10. Analytics.jsx
11. Reports.jsx
12. Automations.jsx
13. Settings.jsx
14. AIChatSidebar.jsx

After ALL changes:
```bash
cd frontend && npm run build 2>&1 | tail -20 && echo "BUILD:$?"
```
Must exit 0 with no errors.

```bash
git add -A && git commit -m "feat: complete professional UI remake — light mode, enterprise quality, all buttons working"
git push origin main
```

---

## QUALITY BAR

Before marking done, verify each page against this standard:
- Could this page appear in a Pipedrive or Linear demo? If no → not done.
- Does every button do something? If no → not done.
- Is the light mode clean with white backgrounds? If no → not done.
- Do modals open AND close properly? If no → not done.
- Are there loading states on async actions? If no → not done.
- Are there toast notifications on save/error? If no → not done.


---

## PER-FILE SELF-TESTS
# Run these after each file is edited. Fix failures before moving to next file.

### After ThemeContext.jsx + index.html
```bash
grep -c "classList.remove('dark')" frontend/src/context/ThemeContext.jsx && echo "PASS: dark remove exists"
grep -c "lytherahub_theme" frontend/index.html && echo "PASS: flash prevention exists"
```

### After Sidebar.jsx
```bash
grep -c "Tasks\|Analytics" frontend/src/components/layout/Sidebar.jsx && echo "PASS: all nav items present"
grep -c "border-l-2 border-blue-600\|bg-blue-50" frontend/src/components/layout/Sidebar.jsx && echo "PASS: active state styled"
grep -c "bg-white" frontend/src/components/layout/Sidebar.jsx && echo "PASS: light bg applied"
```

### After Header.jsx
```bash
grep -c "notification\|Notification\|bell\|Bell" frontend/src/components/layout/Header.jsx && echo "PASS: notification bell exists"
grep -c "setDark\|toggleDark\|dark mode" frontend/src/components/layout/Header.jsx && echo "PASS: dark mode toggle exists"
grep -c "logout\|Logout\|signOut" frontend/src/components/layout/Header.jsx && echo "PASS: logout exists"
grep -c "dropdown\|Dropdown\|menu\|Menu" frontend/src/components/layout/Header.jsx && echo "PASS: user dropdown exists"
```

### After Dashboard.jsx
```bash
grep -c "onSubmit\|handleSubmit\|handleCommand\|sendCommand" frontend/src/pages/Dashboard.jsx frontend/src/components/dashboard/CommandBar.jsx 2>/dev/null && echo "PASS: command bar submit handler exists"
grep -c "onClick.*read\|markRead\|handleRead" frontend/src/pages/Dashboard.jsx && echo "PASS: alert read handler exists"
grep -c "placeholderData\|DEMO\|demo\|fallback" frontend/src/pages/Dashboard.jsx && echo "PASS: demo fallback exists"
```

### After Inbox.jsx
```bash
grep -c "selectedEmail\|setSelectedEmail" frontend/src/pages/Inbox.jsx && echo "PASS: email selection state exists"
grep -c "draftReply\|draft-reply\|generateReply\|handleReply" frontend/src/pages/Inbox.jsx frontend/src/components/inbox/ReplyDraft.jsx 2>/dev/null && echo "PASS: reply draft handler exists"
grep -c "navigator.clipboard\|copyToClipboard\|handleCopy" frontend/src/pages/Inbox.jsx frontend/src/components/inbox/ReplyDraft.jsx 2>/dev/null && echo "PASS: copy handler exists"
grep -c "setCategory\|filterCategory\|activeCategory" frontend/src/pages/Inbox.jsx && echo "PASS: category filter exists"
grep -c "toast\|Toast\|notification" frontend/src/pages/Inbox.jsx frontend/src/components/inbox/ReplyDraft.jsx 2>/dev/null && echo "PASS: toast notifications exist"
```

### After Calendar.jsx
```bash
grep -c "viewMode\|setViewMode\|Day\|Week\|Month" frontend/src/pages/Calendar.jsx && echo "PASS: view toggle exists"
grep -c "selectedEvent\|setSelectedEvent\|handleEventClick" frontend/src/pages/Calendar.jsx && echo "PASS: event selection exists"
grep -c "showModal\|setShowModal\|addEvent\|isModalOpen" frontend/src/pages/Calendar.jsx && echo "PASS: add event modal exists"
grep -c "onClose\|closeModal\|Cancel" frontend/src/pages/Calendar.jsx && echo "PASS: modal close exists"
grep -c "currentDate\|setCurrentDate\|handlePrev\|handleNext" frontend/src/pages/Calendar.jsx && echo "PASS: date navigation exists"
```

### After Invoices.jsx
```bash
grep -c "actionMenu\|showMenu\|openMenu\|MoreVertical" frontend/src/pages/Invoices.jsx && echo "PASS: three-dot menu exists"
grep -c "markPaid\|handleMarkPaid\|status.*paid" frontend/src/pages/Invoices.jsx && echo "PASS: mark paid handler exists"
grep -c "sendReminder\|handleReminder\|remind" frontend/src/pages/Invoices.jsx && echo "PASS: send reminder handler exists"
grep -c "handleDelete\|deleteInvoice\|window.confirm" frontend/src/pages/Invoices.jsx && echo "PASS: delete handler exists"
grep -c "showAddModal\|setShowModal\|isModalOpen\|newInvoice" frontend/src/pages/Invoices.jsx && echo "PASS: add invoice modal exists"
grep -c "sortBy\|setSortBy\|handleSort" frontend/src/pages/Invoices.jsx && echo "PASS: sort handler exists"
grep -c "toast\|Toast" frontend/src/pages/Invoices.jsx && echo "PASS: toast notifications exist"
```

### After Clients.jsx
```bash
grep -c "onDragStart\|handleDragStart" frontend/src/pages/Clients.jsx && echo "PASS: drag start handler exists"
grep -c "onDrop\|handleDrop" frontend/src/pages/Clients.jsx && echo "PASS: drop handler exists"
grep -c "onDragOver\|handleDragOver" frontend/src/pages/Clients.jsx && echo "PASS: drag over handler exists"
grep -c "selectedClient\|setSelectedClient\|clientDetail" frontend/src/pages/Clients.jsx && echo "PASS: client detail state exists"
grep -c "showAddModal\|setShowModal\|addClient" frontend/src/pages/Clients.jsx && echo "PASS: add client modal exists"
grep -c "pipelineView\|tableView\|viewMode" frontend/src/pages/Clients.jsx && echo "PASS: view toggle exists"
grep -c "toast\|Toast" frontend/src/pages/Clients.jsx && echo "PASS: toast notifications exist"
```

### After Tasks.jsx
```bash
grep -c "onDragStart\|handleDragStart" frontend/src/pages/Tasks.jsx && echo "PASS: drag start exists"
grep -c "onDrop\|handleDrop" frontend/src/pages/Tasks.jsx && echo "PASS: drop handler exists"
grep -c "addTask\|handleAddTask\|createTask" frontend/src/pages/Tasks.jsx && echo "PASS: add task handler exists"
grep -c "showModal\|setShowModal\|isModalOpen" frontend/src/pages/Tasks.jsx && echo "PASS: task modal exists"
grep -c "To Do\|todo\|In Progress\|inProgress\|Done\|done" frontend/src/pages/Tasks.jsx && echo "PASS: 3 columns defined"
```

### After Analytics.jsx
```bash
grep -c "Revenue\|Clients\|Productivity\|AI Insights" frontend/src/pages/Analytics.jsx && echo "PASS: all 4 tabs defined"
grep -c "BarChart\|LineChart\|PieChart\|RadialBar" frontend/src/pages/Analytics.jsx && echo "PASS: charts present"
grep -c "insight\|Insight" frontend/src/pages/Analytics.jsx | awk '{if($1>=6) print "PASS: 6+ insights"; else print "FAIL: need more insights, found "$1}'
grep -c "ResponsiveContainer" frontend/src/pages/Analytics.jsx && echo "PASS: responsive charts"
```

### After Reports.jsx
```bash
grep -c "generateReport\|handleGenerate\|Generate Now" frontend/src/pages/Reports.jsx && echo "PASS: generate handler exists"
grep -c "isGenerating\|loading\|setLoading" frontend/src/pages/Reports.jsx && echo "PASS: loading state exists"
grep -c "Daily\|Weekly\|Monthly" frontend/src/pages/Reports.jsx && echo "PASS: 3 report tabs exist"
grep -c "briefing\|Briefing\|morning" frontend/src/pages/Reports.jsx && echo "PASS: briefing content exists"
grep -c "expandedReport\|setExpanded\|accordion\|isOpen" frontend/src/pages/Reports.jsx && echo "PASS: expandable reports exist"
```

### After Automations.jsx
```bash
grep -c "handleToggle\|toggleAutomation\|activate\|deactivate" frontend/src/pages/Automations.jsx && echo "PASS: toggle handler exists"
grep -c "handleRun\|runNow\|isRunning" frontend/src/pages/Automations.jsx && echo "PASS: run now handler exists"
grep -c "viewHistory\|showHistory\|expandHistory" frontend/src/pages/Automations.jsx && echo "PASS: view history handler exists"
grep -c "toast\|Toast" frontend/src/pages/Automations.jsx && echo "PASS: toast notifications exist"
grep -c "optimistic\|previousData\|revert\|rollback" frontend/src/pages/Automations.jsx && echo "PASS: optimistic update exists"
```

### After Settings.jsx
```bash
grep -c "handleSaveProfile\|saveProfile\|Save Changes" frontend/src/pages/Settings.jsx && echo "PASS: save profile handler exists"
grep -c "handleSaveNotifications\|savePreferences\|Save Preferences" frontend/src/pages/Settings.jsx && echo "PASS: save notifications handler exists"
grep -c "changePlan\|showPlanModal\|Change Plan" frontend/src/pages/Settings.jsx && echo "PASS: change plan handler exists"
grep -c "cancelSubscription\|window.confirm\|Cancel Subscription" frontend/src/pages/Settings.jsx && echo "PASS: cancel subscription handler exists"
grep -c "connectIntegration\|handleConnect\|Connect" frontend/src/pages/Settings.jsx && echo "PASS: connect integration handler exists"
grep -c "toast\|Toast" frontend/src/pages/Settings.jsx && echo "PASS: toast notifications exist"
```

### After AIChatSidebar.jsx
```bash
grep -c "isOpen\|setIsOpen\|showChat\|toggleChat" frontend/src/components/shared/AIChatSidebar.jsx && echo "PASS: open/close state exists"
grep -c "handleSend\|sendMessage\|onSubmit" frontend/src/components/shared/AIChatSidebar.jsx && echo "PASS: send handler exists"
grep -c "isTyping\|typing\|loading" frontend/src/components/shared/AIChatSidebar.jsx && echo "PASS: typing indicator exists"
grep -c "messages\|setMessages\|history" frontend/src/components/shared/AIChatSidebar.jsx && echo "PASS: message history state exists"
grep -c "chip\|quickAction\|suggested" frontend/src/components/shared/AIChatSidebar.jsx && echo "PASS: quick action chips exist"
```

### FINAL BUILD TEST — Run last
```bash
cd frontend && npm run build 2>&1 | tail -20
echo "Build exit code: $?"
echo ""
echo "=== HANDLER SUMMARY ==="
echo "Command bar:" $(grep -c "handleCommand\|sendCommand\|handleSubmit" frontend/src/components/dashboard/CommandBar.jsx 2>/dev/null)
echo "Inbox reply:" $(grep -c "generateReply\|draftReply" frontend/src/pages/Inbox.jsx frontend/src/components/inbox/ReplyDraft.jsx 2>/dev/null)
echo "Invoice actions:" $(grep -c "markPaid\|sendReminder\|handleDelete" frontend/src/pages/Invoices.jsx 2>/dev/null)
echo "Client DnD:" $(grep -c "onDragStart\|onDrop" frontend/src/pages/Clients.jsx 2>/dev/null)
echo "Task DnD:" $(grep -c "onDragStart\|onDrop" frontend/src/pages/Tasks.jsx 2>/dev/null)
echo "Settings save:" $(grep -c "handleSave\|saveProfile\|savePreferences" frontend/src/pages/Settings.jsx 2>/dev/null)
echo "All toasts:" $(grep -rn "toast\." frontend/src/pages/ 2>/dev/null | wc -l)
echo "=== END SUMMARY ==="
```

