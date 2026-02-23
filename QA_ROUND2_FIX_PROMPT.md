# LytheraHub QA Round 2 — Comprehensive Fix Prompt

You are the engineering lead for LytheraHub. Fix every issue below. Read each file before editing. Do not refactor unrelated areas.

---

## FIX 1: Calendar — Meeting Prep shows same content for every event

**Root cause:** In `generateDemoEvents()`, `prep_brief` is only set for events where `dayOffset <= 1` (today/tomorrow), and it uses the SAME generic text for all meetings regardless of event title, attendees, or type.

**File:** `frontend/src/pages/Calendar.jsx`

**Fix:** Replace the `prep_brief` assignment (around line 94) so that EACH event gets a UNIQUE prep brief based on the event's actual title, attendees, and type. Generate varied content per event.

Replace this block (line 94-96):
```js
prep_brief: dayOffset <= 1 && t.is_meeting
  ? `Background: This is a ${t.is_meeting ? 'recurring' : 'one-time'} ${t.type} with key stakeholders.\n\nLast Interaction: Discussed project milestones and deliverables two weeks ago. All action items were completed.\n\nOpen Invoices: No outstanding invoices for this client.\n\nTalking Points:\n- Review progress on current deliverables\n- Discuss timeline for next phase\n- Align on budget and resource allocation\n- Address any blockers or concerns`
  : null,
```

With this logic:
```js
prep_brief: t.is_meeting ? generatePrepBrief(t, attendees) : null,
```

Add a helper function ABOVE `generateDemoEvents()`:
```js
function generatePrepBrief(template, attendees) {
  const attendeeNames = attendees.map(a => a.name).join(', ') || 'team members'
  const briefTemplates = [
    {
      bg: `Recurring ${template.type} with ${attendeeNames}. This team has been collaborating for 3 months on the current project phase.`,
      last: `Last sync was 5 days ago. Discussed feature prioritization and Q2 roadmap alignment. All 3 action items were completed on time.`,
      invoices: `No outstanding invoices for this engagement.`,
      points: ['Review deliverables completed since last meeting', 'Discuss any blockers or resource constraints', 'Align on priorities for the coming week', 'Confirm next milestone deadlines']
    },
    {
      bg: `${template.title} — key client relationship meeting. ${attendeeNames} representing the client side. Deal value: €45,000.`,
      last: `Exchanged 4 emails last week regarding contract terms. Client requested updated pricing for add-on modules. Proposal sent on Friday — awaiting feedback.`,
      invoices: `1 open invoice: INV-2026-024 (€5,500) due in 6 days. Payment expected on time based on history.`,
      points: ['Follow up on proposal feedback', 'Discuss implementation timeline', 'Review service level requirements', 'Confirm budget allocation for Q2']
    },
    {
      bg: `Strategy session with ${attendeeNames}. Focus area: growth planning and operational efficiency improvements.`,
      last: `Last meeting 2 weeks ago covered pipeline review. Won 1 new deal (€22K). Lost 1 lead due to timing. Overall win rate trending up to 60%.`,
      invoices: `€8,500 overdue from related accounts. Follow-up reminders sent at 7 and 14 day marks.`,
      points: ['Review pipeline conversion metrics', 'Discuss high-value prospects in negotiation', 'Plan outreach for stale leads (3 clients, 10+ days)', 'Set targets for next quarter']
    },
    {
      bg: `Technical review with ${attendeeNames}. Agenda covers product updates, integration status, and client feedback analysis.`,
      last: `Sprint retrospective identified 2 improvement areas. Team velocity increased 15% this sprint. 1 critical bug resolved ahead of deadline.`,
      invoices: `All invoices current. €12,300 in payments expected this week.`,
      points: ['Demo new features completed this sprint', 'Review client feedback and support tickets', 'Discuss technical debt priorities', 'Plan capacity for upcoming integrations']
    },
  ]
  const idx = Math.abs(template.title.length + attendees.length) % briefTemplates.length
  const b = briefTemplates[idx]
  return `Background: ${b.bg}\n\nLast Interaction: ${b.last}\n\nOpen Invoices: ${b.invoices}\n\nTalking Points:\n- ${b.points.join('\n- ')}`
}
```

Also in `MeetingPrep.jsx`: when "Generate Prep" button is clicked and API fails, generate a demo prep brief instead of showing error. Update the `generatePrep` mutation:

**File:** `frontend/src/components/calendar/MeetingPrep.jsx`

Replace the `generatePrep` mutation (lines 18-27) with:
```js
const generatePrep = useMutation({
  mutationFn: () => api.post(`/calendar/events/${event.id}/prep`),
  onSuccess: (res) => {
    const brief = res.data.prep_brief
    setPrep(brief)
    onPrepGenerated?.(brief)
    toast.success('Meeting prep generated')
  },
  onError: () => {
    // Demo fallback: generate a prep brief locally
    const attendeeNames = event.attendees?.map(a => a.name || a.email).join(', ') || 'team'
    const fallbackPrep = `Background: ${event.title} — session with ${attendeeNames}. This is a ${event.type || 'meeting'} scheduled at ${event.location || 'online'}.\n\nLast Interaction: Previous session covered project milestones and next steps. Key deliverables were reviewed and approved.\n\nOpen Invoices: No outstanding invoices identified for this engagement.\n\nTalking Points:\n- Review progress since last meeting\n- Discuss upcoming deliverables and deadlines\n- Address any open questions or blockers\n- Confirm next steps and action items`
    setPrep(fallbackPrep)
    toast.success('Meeting prep generated')
  },
})
```

---

## FIX 2: Invoices — Create Invoice does nothing / submenu actions don't work in demo

**Root cause 1:** `createInvoice` mutation calls `api.post('/invoices')` which fails. The catch block returns `{ fromApi: false }`, which goes to `onSuccess` — but `onSuccess` sets query data using `['invoices', statusFilter]` as key. If the actual query key doesn't match (e.g., filter changed), the new invoice never appears.

**Root cause 2:** `markPaid`, `sendReminder`, and `deleteInvoice` mutations all call the API which fails in demo mode, triggering `onError` with a toast.error. They need demo fallbacks.

**File:** `frontend/src/pages/Invoices.jsx`

Replace the `markPaid` mutation (lines 132-141):
```js
const markPaid = useMutation({
  mutationFn: (id) =>
    api.put(`/invoices/${id}`, { status: 'paid', paid_date: new Date().toISOString() }),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['invoices'] })
    queryClient.invalidateQueries({ queryKey: ['invoice-stats'] })
    toast.success('Invoice marked as paid')
  },
  onError: (_err, id) => {
    // Demo fallback: update local cache
    queryClient.setQueryData(['invoices', statusFilter], (old) => {
      const current = Array.isArray(old) ? old : DEMO_INVOICES
      return current.map(inv => inv.id === id ? { ...inv, status: 'paid', paid_date: new Date().toISOString().split('T')[0] } : inv)
    })
    toast.success('Invoice marked as paid')
  },
})
```

Replace the `sendReminder` mutation (lines 144-148):
```js
const sendReminder = useMutation({
  mutationFn: (id) => api.post(`/invoices/${id}/remind`),
  onSuccess: () => toast.success('Payment reminder sent'),
  onError: () => toast.success('Payment reminder sent'),  // Demo: always succeed
})
```

Replace the `deleteInvoice` mutation (lines 189-197):
```js
const deleteInvoice = useMutation({
  mutationFn: (id) => api.delete(`/invoices/${id}`),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['invoices'] })
    queryClient.invalidateQueries({ queryKey: ['invoice-stats'] })
    toast.success('Invoice deleted')
  },
  onError: (_err, id) => {
    // Demo fallback: remove from local cache
    queryClient.setQueryData(['invoices', statusFilter], (old) => {
      const current = Array.isArray(old) ? old : DEMO_INVOICES
      return current.filter(inv => inv.id !== id)
    })
    toast.success('Invoice deleted')
  },
})
```

Also add `window.confirm` before delete in `handleAction`:
```js
case 'delete':
  if (window.confirm(`Delete invoice ${invoice.invoice_number}?`)) {
    deleteInvoice.mutate(invoice.id)
  }
  break
```

For `createInvoice`, ensure the demo fallback also invalidates all invoice queries:
After `queryClient.setQueryData(...)` (around line 180), add:
```js
queryClient.invalidateQueries({ queryKey: ['invoices'] })
```

---

## FIX 3: Clients — Uploaded documents not openable

**Root cause:** When a user uploads a document in the client detail panel, the uploaded file is added to `uploadedDocs` state, but the click handler just shows `toast.success('Document preview available in production')` — it doesn't open any preview.

**File:** `frontend/src/pages/Clients.jsx`

Find the section where `uploadedDocs` are rendered (search for `uploadedDocs.map`). Change the onClick handler from showing a toast to opening a preview. For uploaded files in demo mode, show the file name and a "Download" style interaction:

```js
onClick={() => {
  // For uploaded files, create a temporary URL and open it
  if (doc.file) {
    const url = URL.createObjectURL(doc.file)
    window.open(url, '_blank')
  } else {
    toast.success(`Opening ${doc.name}...`)
  }
}}
```

Also, the demo documents (Proposal_v2.pdf, Contract_Draft.docx, etc.) should show a preview modal instead of just a toast. Find where DEMO_DOCUMENTS click handlers are and change them:
```js
onClick={() => toast.success('Document preview available in production')}
```
Change to:
```js
onClick={() => window.open(`#preview-${doc.name}`, '_blank') || toast('Preview: ' + doc.name + ' — Available in production deployment', { icon: '📄' })}
```

---

## FIX 4: Tasks — Cards not clickable, no detail view

**Root cause:** `TaskCard` component only supports drag-and-drop and hover-action buttons (status change, delete). There's no click handler to show task details.

**File:** `frontend/src/pages/Tasks.jsx`

Add a `selectedTask` state to the main `Tasks` component and a detail panel:

1. Add state: `const [selectedTask, setSelectedTask] = useState(null)`

2. Add `onClick` to TaskCard (line 89-98 area). The outer div should also have:
```js
onClick={(e) => {
  // Don't trigger click when dragging
  if (!e.defaultPrevented) onSelect?.(task)
}}
```

3. Pass `onSelect={setSelectedTask}` to TaskCard in KanbanColumn.

4. Add a TaskDetailPanel that slides in from the right when a task is selected. It should show:
   - Task title, description, priority, status, due date, source
   - "Mark Complete" / "Start" button
   - "Delete" button
   - Close button

Add this component after AddTaskModal:
```jsx
function TaskDetailPanel({ task, onClose, onStatusChange, onDelete }) {
  if (!task) return null
  const priority = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium
  const source = SOURCE_CONFIG[task.source] || SOURCE_CONFIG.manual
  const PriorityIcon = priority.icon
  const dueInfo = formatDueDate(task.due_date)

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={onClose}>
      <div
        className="w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-xl overflow-y-auto border-l border-slate-200 dark:border-slate-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 px-6 py-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Task Details</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6 space-y-5">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${priority.color}`}>
              <PriorityIcon className="h-3.5 w-3.5" />
              {priority.label}
            </span>
            <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-400 capitalize">
              {task.status.replace('_', ' ')}
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">{task.title}</h2>
          {task.description && (
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{task.description}</p>
          )}
          {dueInfo && (
            <div className={`flex items-center gap-2 text-sm ${dueInfo.className}`}>
              <CalendarIcon className="h-4 w-4" />
              {dueInfo.text}
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span>Source:</span>
            <span className="capitalize font-medium">{task.source}</span>
          </div>
          <div className="flex gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
            {task.status !== 'done' && (
              <button
                onClick={() => { onStatusChange(task.id, task.status === 'todo' ? 'in_progress' : 'done'); onClose() }}
                className="flex-1 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
              >
                {task.status === 'todo' ? 'Start Task' : 'Mark Complete'}
              </button>
            )}
            <button
              onClick={() => { onDelete(task.id); onClose() }}
              className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
```

5. Render it in the main Tasks component return, after the AddTaskModal:
```jsx
{selectedTask && (
  <TaskDetailPanel
    task={selectedTask}
    onClose={() => setSelectedTask(null)}
    onStatusChange={handleStatusChange}
    onDelete={handleDelete}
  />
)}
```

---

## FIX 5: Analytics — Productivity stat cards and bars do nothing when clicked

**Root cause:** The stat cards in Revenue/Clients tabs have `onClick` handlers that navigate, but the Productivity tab stat cards (`StatCard` component) have NO click handlers. The charts also have no click navigation.

**File:** `frontend/src/pages/Analytics.jsx`

Make Productivity stat cards clickable by passing navigation targets. Find the productivity stat cards section (around line 456-461) and wrap each in a clickable container:

```jsx
<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
  <div className="cursor-pointer" onClick={() => navigate('/inbox')}>
    <StatCard icon={Mail} label="Emails (30d)" value={productivity.emails_received} suffix={`${productivity.email_response_rate}% read`} color="text-brand-600" />
  </div>
  <div className="cursor-pointer" onClick={() => navigate('/calendar')}>
    <StatCard icon={Calendar} label="Meetings (30d)" value={productivity.meetings_held} color="text-purple-600" />
  </div>
  <div className="cursor-pointer" onClick={() => navigate('/tasks')}>
    <StatCard icon={CheckCircle2} label="Tasks Completed" value={productivity.tasks_completed} suffix={`/ ${productivity.tasks_total}`} color="text-emerald-600" />
  </div>
  <div className="cursor-pointer" onClick={() => navigate('/tasks')}>
    <StatCard icon={AlertTriangle} label="Tasks Overdue" value={productivity.tasks_overdue} color="text-red-600" />
  </div>
</div>
```

---

## FIX 6: Reports — Generate Now doesn't ask for report type, always generates current tab

**Root cause:** This is actually working as designed — it generates a report for the active tab. But the UX should make this clearer with a label.

**File:** `frontend/src/pages/Reports.jsx`

Update the "Generate Now" button text to include the report type:
Find the Generate Now button (around line 170-180) and change:
```jsx
<button
  onClick={handleGenerate}
  disabled={generating}
  className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
>
  {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
  Generate {activeTab === 'daily' ? 'Daily' : activeTab === 'weekly' ? 'Weekly' : 'Monthly'} Report
</button>
```

---

## FIX 7: Automations — Run Now and View History do nothing

**Root cause:** `runAutomation` calls the API which fails in demo mode, triggering `onError` with `toast.error`. `View History` works (I can see the toggle in code), but the demo data for some automations has an empty `history: []` array (like automation a5).

**File:** `frontend/src/pages/Automations.jsx`

Fix `runAutomation` mutation to succeed in demo:
```js
const runAutomation = useMutation({
  mutationFn: (id) => api.post(`/automations/${id}/run`),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['automations'] })
    toast.success('Automation completed successfully')
  },
  onError: (_err, id) => {
    // Demo fallback: show success and add to history
    toast.success('Automation completed successfully')
  },
})
```

Fix `toggleAutomation` mutation similarly:
```js
const toggleAutomation = useMutation({
  mutationFn: ({ id, active }) =>
    active ? api.post(`/automations/${id}/deactivate`) : api.post(`/automations/${id}/activate`),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['automations'] })
    toast.success('Automation updated')
  },
  onError: (_err, variables) => {
    // Demo fallback: toggle locally
    queryClient.setQueryData(['automations'], (old) => {
      if (!Array.isArray(old)) return old
      return old.map(a => a.id === variables.id ? { ...a, is_active: !variables.active } : a)
    })
    toast.success('Automation updated')
  },
})
```

For View History — when `history` is empty, show a message instead of nothing:
After line 234 (`{isExpanded && automation.history?.length > 0 && (`), add an else case:
```jsx
{isExpanded && (!automation.history || automation.history.length === 0) && (
  <div className="border-t border-slate-200 dark:border-slate-700 p-4 text-center text-sm text-slate-400">
    No execution history available yet.
  </div>
)}
```

---

## FIX 8: Dashboard — Nothing clickable, stats/briefing/activity are display-only

**Root cause:**
- StatsGrid cards have no `onClick` or navigation
- MorningBriefing priority actions show a generic toast instead of navigating
- Activity feed items are not clickable

**File 1:** `frontend/src/components/dashboard/StatsGrid.jsx`

Add navigation to stat cards. Import `useNavigate` from react-router-dom, then make each card clickable:

```jsx
import { useNavigate } from 'react-router-dom'
```

In the StatsGrid component:
```jsx
const navigate = useNavigate()
const navTargets = {
  unread_emails: '/inbox',
  today_meetings: '/calendar',
  outstanding_invoices: '/invoices',
  active_clients: '/clients',
}
```

Wrap each stat card div (around line 151) with `onClick`:
```jsx
<div
  key={card.key}
  onClick={() => navigate(navTargets[card.key])}
  className="group cursor-pointer rounded-xl border ..."
>
```

**File 2:** `frontend/src/components/dashboard/MorningBriefing.jsx`

Import `useNavigate`, add navigation targets for priority actions:
```jsx
import { useNavigate } from 'react-router-dom'
```

In the component:
```jsx
const navigate = useNavigate()
```

Replace the `handleAction` function:
```jsx
const handleAction = (action) => {
  const routes = {
    email: '/inbox',
    meeting: '/calendar',
    invoice: '/invoices',
    follow_up: '/clients',
    review: '/tasks',
    deadline: '/tasks',
  }
  const route = routes[action.type] || '/dashboard'
  navigate(route)
  toast.success(`Navigating to ${action.label || action.type}`)
}
```

Also, make the priority action cards clickable even without `action_label`:
Change line 200-208 area. Replace the conditional `{item.action_label && (` block with an always-present click handler on the card itself:

On the priority card div (line 181-183), add onClick:
```jsx
<div
  key={index}
  onClick={() => handleAction(item)}
  className={`group cursor-pointer rounded-xl border p-4 transition-all hover:shadow-md ${urgencyColors[urgency]}`}
>
```

But the demo briefing data from the API returns no `priorities` array with `type` fields. The MorningBriefing falls back to `briefing?.priorities || []` which will be empty in demo mode (API fails, no demo fallback for briefing).

Add a demo fallback for the briefing data. After line 117:
```jsx
const priorities = briefing?.priorities?.length > 0 ? briefing.priorities : [
  { type: 'email', title: 'Reply to 3 urgent emails', description: 'Check your inbox for...', urgency: 'high', action_label: 'Go to Inbox' },
  { type: 'invoice', title: `Follow up on EUR 8,500 overdue`, description: 'Send payment reminder...', urgency: 'high', action_label: 'View Invoices' },
  { type: 'meeting', title: `Prepare for 1 meetings`, description: 'Review meeting prep...', urgency: 'medium', action_label: 'View Calendar' },
]
```

**File 3:** `frontend/src/components/dashboard/ActivityFeed.jsx`

Make activity items clickable. Find where activity items are rendered and add navigation. Each item should navigate to its relevant page based on `type` field. Add `useNavigate` import and wrap items in clickable containers:

```jsx
import { useNavigate } from 'react-router-dom'
```

Add `const navigate = useNavigate()` in the component.

Add navigation mapping:
```js
const typeRoutes = {
  email: '/inbox',
  calendar: '/calendar',
  invoice: '/invoices',
  client: '/clients',
  task: '/tasks',
  automation: '/automations',
  alert: '/dashboard',
}
```

Make each activity item clickable by adding `onClick={() => navigate(typeRoutes[item.type] || '/dashboard')}` and `cursor-pointer` class.

---

## FIX 9: Landing — FAQ sections need visual separation with icons/images

**Root cause:** User wants FAQ items to be visually distinct sections, not just plain accordion items.

**File:** `frontend/src/pages/Landing.jsx`

Update the FAQS array to include icons per question. Then update the FAQItem component to show an icon next to each question:

Add icons to FAQS:
```js
const FAQS = [
  { q: 'What is LytheraHub?', icon: '🚀', a: '...' },
  { q: 'Do I need to connect all my tools?', icon: '🔗', a: '...' },
  { q: 'Is my data secure?', icon: '🔒', a: '...' },
  { q: 'Can I try it for free?', icon: '🎁', a: '...' },
  { q: 'How does the AI work?', icon: '🤖', a: '...' },
  { q: 'Can I use it with my team?', icon: '👥', a: '...' },
  { q: 'Can I cancel anytime?', icon: '✨', a: '...' },
  { q: 'Do you offer refunds?', icon: '💳', a: '...' },
]
```

Update FAQItem to render icon:
```jsx
function FAQItem({ question, answer, icon }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left bg-white dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3">
          {icon && <span className="text-2xl">{icon}</span>}
          <span className="text-base font-semibold text-slate-900 dark:text-white">{question}</span>
        </div>
        ...
      </button>
      ...
    </div>
  )
}
```

Pass `icon` prop in the FAQ section:
```jsx
<FAQItem key={faq.q} question={faq.q} answer={faq.a} icon={faq.icon} />
```

---

## FIX 10: Invoice "View Details" and "Edit" in submenu do nothing

**File:** `frontend/src/pages/Invoices.jsx`

In the `handleAction` function, add cases for 'view' and 'edit':

```js
const handleAction = (action, invoice) => {
  switch (action) {
    case 'view':
      toast(`Invoice ${invoice.invoice_number}\nClient: ${invoice.client_name}\nAmount: €${invoice.amount?.toLocaleString()}\nStatus: ${invoice.status}\nDue: ${invoice.due_date}`, { icon: '📄', duration: 5000 })
      break
    case 'edit':
      toast('Edit mode available in production', { icon: '✏️' })
      break
    case 'mark_paid':
      markPaid.mutate(invoice.id)
      break
    case 'remind':
      sendReminder.mutate(invoice.id)
      break
    case 'delete':
      if (window.confirm(`Delete invoice ${invoice.invoice_number}?`)) {
        deleteInvoice.mutate(invoice.id)
      }
      break
    default:
      break
  }
}
```

Also in InvoiceTable.jsx, make the "Send Reminder" action available for ALL non-paid invoices (not just overdue):
Line 106: Change `invoice.status === 'overdue'` to `invoice.status !== 'paid'`.

---

## FINAL BUILD TEST

After ALL fixes:

```bash
cd frontend && npm run build 2>&1 | tail -20
echo "Build exit code: $?"

# Verify fixes
echo "=== Fix Verification ==="
echo "Fix 1 - Calendar prep:" $(grep -c "generatePrepBrief" src/pages/Calendar.jsx)
echo "Fix 2 - Invoice demo:" $(grep -c "Demo fallback" src/pages/Invoices.jsx)
echo "Fix 4 - Task detail:" $(grep -c "TaskDetailPanel\|selectedTask" src/pages/Tasks.jsx)
echo "Fix 5 - Analytics nav:" $(grep -c "navigate.*inbox\|navigate.*calendar\|navigate.*tasks" src/pages/Analytics.jsx)
echo "Fix 7 - Automation demo:" $(grep -c "Demo fallback" src/pages/Automations.jsx)
echo "Fix 8 - Stats nav:" $(grep -c "useNavigate\|navigate" src/components/dashboard/StatsGrid.jsx)
echo "Fix 8 - Briefing nav:" $(grep -c "useNavigate\|navigate" src/components/dashboard/MorningBriefing.jsx)
echo "=== END ==="
```

Build MUST pass (exit 0) before committing.

```bash
git add -A && git commit -m "fix: QA round 2 — clickable dashboard, task details, invoice actions, calendar prep variety, automation demo fallbacks"
git push origin main
```
