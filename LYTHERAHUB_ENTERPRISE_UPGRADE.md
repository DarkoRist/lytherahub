# LytheraHub — Enterprise Grade Upgrade
# Benchmark: Linear (speed + keyboard-first), Attio (data model + UX elegance),
#             Stripe (dashboard clarity), Notion (composability + AI-native)
#
# Read every relevant file before writing a single line.
# This prompt is autonomous — execute all blocks end to end without stopping.

---

## WHAT THE RESEARCH SHOWS

Linear's secret: not features, it's SPEED + keyboard-first. Every action feels instant.
Attio's secret: data feels alive. Real-time updates, no page reloads, AI enriches automatically.
Stripe's secret: radical information hierarchy. One truth per card. No noise.
Notion's secret: composability. Users build the experience they need, not a preset.

The gap between LytheraHub and these products is not features — it is FEEL.
The app needs to feel instant, intelligent, and professional.
These 12 blocks close that gap permanently.

---

## BLOCK 1 — GLOBAL: True ⌘K Command Palette (Linear-style)

**What Linear does:** ⌘K opens a full modal command palette that can navigate anywhere,
create anything, and execute any action — fuzzy search, keyboard navigation, instant results.
LytheraHub has a dashboard-only command bar. Power users need global access from any page.

**File to create:** `frontend/src/components/shared/CommandPalette.jsx`

Build a full command palette component:

```jsx
import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, LayoutDashboard, Mail, Calendar, Receipt, Users,
  CheckSquare, LineChart, BarChart3, Zap, Settings, Plus,
  ArrowRight, Hash, FileText, Clock
} from 'lucide-react'

const COMMANDS = [
  // Navigation
  { id: 'nav-dashboard', group: 'Navigate', label: 'Go to Dashboard', icon: LayoutDashboard, shortcut: 'G D', action: 'nav', route: '/dashboard' },
  { id: 'nav-inbox', group: 'Navigate', label: 'Go to Inbox', icon: Mail, shortcut: 'G I', action: 'nav', route: '/inbox' },
  { id: 'nav-calendar', group: 'Navigate', label: 'Go to Calendar', icon: Calendar, shortcut: 'G C', action: 'nav', route: '/calendar' },
  { id: 'nav-invoices', group: 'Navigate', label: 'Go to Invoices', icon: Receipt, shortcut: 'G V', action: 'nav', route: '/invoices' },
  { id: 'nav-clients', group: 'Navigate', label: 'Go to Clients', icon: Users, shortcut: 'G P', action: 'nav', route: '/clients' },
  { id: 'nav-tasks', group: 'Navigate', label: 'Go to Tasks', icon: CheckSquare, shortcut: 'G T', action: 'nav', route: '/tasks' },
  { id: 'nav-analytics', group: 'Navigate', label: 'Go to Analytics', icon: LineChart, shortcut: 'G A', action: 'nav', route: '/analytics' },
  { id: 'nav-reports', group: 'Navigate', label: 'Go to Reports', icon: BarChart3, shortcut: 'G R', action: 'nav', route: '/reports' },
  { id: 'nav-automations', group: 'Navigate', label: 'Go to Automations', icon: Zap, shortcut: 'G U', action: 'nav', route: '/automations' },
  { id: 'nav-settings', group: 'Navigate', label: 'Go to Settings', icon: Settings, shortcut: 'G S', action: 'nav', route: '/settings' },
  // Create
  { id: 'create-invoice', group: 'Create', label: 'New Invoice', icon: Plus, shortcut: 'N I', action: 'nav', route: '/invoices?new=1' },
  { id: 'create-client', group: 'Create', label: 'New Client', icon: Plus, shortcut: 'N C', action: 'nav', route: '/clients?new=1' },
  { id: 'create-task', group: 'Create', label: 'New Task', icon: Plus, shortcut: 'N T', action: 'nav', route: '/tasks?new=1' },
  { id: 'create-event', group: 'Create', label: 'New Calendar Event', icon: Plus, shortcut: 'N E', action: 'nav', route: '/calendar?new=1' },
  // Quick info
  { id: 'info-revenue', group: 'Quick Info', label: 'Revenue this month', icon: Hash, action: 'info', info: '€27,600 collected this month. Up 12% from January.' },
  { id: 'info-overdue', group: 'Quick Info', label: 'Overdue invoices', icon: Clock, action: 'info', info: '2 overdue invoices totaling €11,700. CloudFirst AG and MediaWave GmbH.' },
  { id: 'info-tasks', group: 'Quick Info', label: 'Tasks due today', icon: CheckSquare, action: 'info', info: '2 tasks due today: Finalize TechVision contract (Urgent), Follow up on overdue invoices (Urgent).' },
  { id: 'info-meetings', group: 'Quick Info', label: "Today's meetings", icon: Calendar, action: 'info', info: '2 meetings today: 10:00 AM Standup, 3:00 PM Client Call with Hans Weber.' },
]

function fuzzyMatch(text, query) {
  if (!query) return true
  const t = text.toLowerCase()
  const q = query.toLowerCase()
  let i = 0
  for (const ch of q) {
    const idx = t.indexOf(ch, i)
    if (idx === -1) return false
    i = idx + 1
  }
  return true
}

export default function CommandPalette({ open, onClose }) {
  const [query, setQuery] = useState('')
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [infoResult, setInfoResult] = useState(null)
  const inputRef = useRef(null)
  const navigate = useNavigate()

  const filtered = COMMANDS.filter(cmd => fuzzyMatch(cmd.label, query))
  const grouped = filtered.reduce((acc, cmd) => {
    if (!acc[cmd.group]) acc[cmd.group] = []
    acc[cmd.group].push(cmd)
    return acc
  }, {})
  const flat = Object.values(grouped).flat()

  useEffect(() => {
    if (open) {
      setQuery('')
      setSelectedIdx(0)
      setInfoResult(null)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  useEffect(() => { setSelectedIdx(0) }, [query])

  const execute = useCallback((cmd) => {
    if (!cmd) return
    if (cmd.action === 'nav') {
      navigate(cmd.route)
      onClose()
    } else if (cmd.action === 'info') {
      setInfoResult(cmd.info)
    }
  }, [navigate, onClose])

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') { onClose(); return }
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIdx(i => Math.min(i + 1, flat.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIdx(i => Math.max(i - 1, 0)) }
    if (e.key === 'Enter') { e.preventDefault(); execute(flat[selectedIdx]) }
  }

  if (!open) return null

  let globalIdx = 0

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Palette */}
      <div
        className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3.5 dark:border-slate-700">
          <Search className="h-5 w-5 shrink-0 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search commands, navigate, create..."
            className="flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-white"
          />
          <kbd className="shrink-0 rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400">
            Esc
          </kbd>
        </div>

        {/* Info result banner */}
        {infoResult && (
          <div className="border-b border-blue-100 bg-blue-50 px-4 py-3 dark:border-blue-900/30 dark:bg-blue-900/20">
            <p className="text-sm font-medium text-blue-800 dark:text-blue-200">{infoResult}</p>
          </div>
        )}

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto py-2">
          {flat.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-slate-400">
              No commands found for "{query}"
            </div>
          ) : (
            Object.entries(grouped).map(([group, cmds]) => (
              <div key={group}>
                <div className="px-4 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  {group}
                </div>
                {cmds.map((cmd) => {
                  const isSelected = globalIdx === selectedIdx
                  const currentIdx = globalIdx++
                  const Icon = cmd.icon
                  return (
                    <button
                      key={cmd.id}
                      onClick={() => execute(cmd)}
                      onMouseEnter={() => setSelectedIdx(currentIdx)}
                      className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                        isSelected
                          ? 'bg-blue-50 dark:bg-blue-900/20'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                        isSelected ? 'bg-blue-100 dark:bg-blue-800/40' : 'bg-slate-100 dark:bg-slate-800'
                      }`}>
                        <Icon className={`h-4 w-4 ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`} />
                      </div>
                      <span className={`flex-1 text-sm font-medium ${
                        isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-slate-300'
                      }`}>
                        {cmd.label}
                      </span>
                      {cmd.shortcut && (
                        <div className="flex items-center gap-0.5">
                          {cmd.shortcut.split(' ').map((k, i) => (
                            <kbd key={i} className="rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-400">
                              {k}
                            </kbd>
                          ))}
                        </div>
                      )}
                      {cmd.action === 'nav' && (
                        <ArrowRight className={`h-3.5 w-3.5 shrink-0 ${isSelected ? 'text-blue-400' : 'text-slate-300'}`} />
                      )}
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 px-4 py-2 dark:border-slate-700">
          <div className="flex items-center gap-3 text-[10px] text-slate-400">
            <span className="flex items-center gap-1"><kbd className="rounded border border-slate-200 bg-slate-100 px-1 py-0.5 font-mono dark:border-slate-700 dark:bg-slate-800">↑↓</kbd> navigate</span>
            <span className="flex items-center gap-1"><kbd className="rounded border border-slate-200 bg-slate-100 px-1 py-0.5 font-mono dark:border-slate-700 dark:bg-slate-800">↵</kbd> select</span>
            <span className="flex items-center gap-1"><kbd className="rounded border border-slate-200 bg-slate-100 px-1 py-0.5 font-mono dark:border-slate-700 dark:bg-slate-800">Esc</kbd> close</span>
          </div>
          <span className="text-[10px] text-slate-400">{flat.length} commands</span>
        </div>
      </div>
    </div>
  )
}
```

Wire it into `frontend/src/App.jsx`:
- Add `import CommandPalette from './components/shared/CommandPalette'`
- Add `const [paletteOpen, setPaletteOpen] = useState(false)` 
- Add global keydown listener: Ctrl/Cmd+K opens palette
- Render `<CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />` inside the router

Wire it into `frontend/src/components/layout/Header.jsx`:
- The search bar placeholder should read: `Search or type a command... ⌘K`
- onClick on the search input should call `onOpenPalette()` prop instead of focusing
- Pass `onOpenPalette` prop from Layout → Header
- The search bar should visually look like a trigger button (cursor-pointer, readonly)

Wire it into `frontend/src/components/layout/Layout.jsx`:
- Add `const [paletteOpen, setPaletteOpen] = useState(false)` 
- Pass `onOpenPalette={() => setPaletteOpen(true)}` to Header
- Render CommandPalette at Layout level

---

## BLOCK 2 — GLOBAL: Undo Toast System (Linear-style)

**What Linear does:** Every destructive action (delete, stage change, dismiss) shows a toast
with an Undo button. Clicking Undo instantly reverses the action. This eliminates confirmation
dialogs and makes the app feel safe and fast simultaneously.

**File to create:** `frontend/src/hooks/useUndoable.js`

```js
import { useRef, useCallback } from 'react'
import toast from 'react-hot-toast'

export function useUndoable() {
  const undoRef = useRef(null)

  const withUndo = useCallback((
    label,           // "Invoice deleted"
    doAction,        // () => { /* remove from state */ }
    undoAction,      // () => { /* restore to state */ }
    apiCall = null,  // async () => { /* call API */ } — only runs if not undone
  ) => {
    doAction()

    let undone = false
    const toastId = toast(
      (t) => (
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-700">{label}</span>
          <button
            onClick={() => {
              undone = true
              undoAction()
              toast.dismiss(t.id)
              toast.success('Action undone')
            }}
            className="text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            Undo
          </button>
        </div>
      ),
      { duration: 5000 }
    )

    if (apiCall) {
      setTimeout(async () => {
        if (!undone) {
          try { await apiCall() } catch { /* demo */ }
        }
      }, 5100) // wait past toast duration
    }
  }, [])

  return { withUndo }
}
```

Apply this hook in `Invoices.jsx`:
- Import `useUndoable`
- Replace `handleDelete` with:
```js
const { withUndo } = useUndoable()

const handleDelete = (invoice) => {
  const prev = invoices
  withUndo(
    `Invoice #${invoice.invoice_number} deleted`,
    () => setInvoices(prev => prev.filter(i => i.id !== invoice.id)),
    () => setInvoices(prev),
    () => api.delete(`/invoices/${invoice.id}`)
  )
}
```

Apply the same pattern in `Clients.jsx` for delete:
```js
const handleDeleteClient = (client) => {
  const prev = clients
  withUndo(
    `${client.company_name} deleted`,
    () => setClients(prev => prev.filter(c => c.id !== client.id)),
    () => setClients(prev),
    () => api.delete(`/clients/${client.id}`)
  )
}
```

Apply in `Tasks.jsx` for delete:
```js
const handleDelete = (task) => {
  const prev = tasks
  withUndo(
    `"${task.title}" deleted`,
    () => setTasks(prev => prev.filter(t => t.id !== task.id)),
    () => setTasks(prev),
    () => api.delete(`/tasks/${task.id}`)
  )
}
```

Apply in `Dashboard.jsx` AlertsPanel for dismiss:
```js
const { withUndo } = useUndoable()
const handleDismiss = (alertId) => {
  const alert = alerts.find(a => a.id === alertId)
  withUndo(
    'Alert dismissed',
    () => setAlerts(prev => prev.filter(a => a.id !== alertId)),
    () => setAlerts(prev => [...prev, alert]),
    () => api.delete(`/alerts/${alertId}`)
  )
}
```

---

## BLOCK 3 — INVOICES: Right-click context menu (enterprise standard)

**What enterprise tools do:** Right-clicking a row in any data table opens a context menu
with all available actions. This is the mark of professional business software.

**File to create:** `frontend/src/components/shared/ContextMenu.jsx`

```jsx
import { useEffect, useRef } from 'react'

export default function ContextMenu({ x, y, items, onClose }) {
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', handler)
    document.addEventListener('contextmenu', onClose)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('contextmenu', onClose)
    }
  }, [onClose])

  // Clamp to viewport
  const top = Math.min(y, window.innerHeight - 200)
  const left = Math.min(x, window.innerWidth - 220)

  return (
    <div
      ref={ref}
      style={{ top, left }}
      className="fixed z-50 min-w-[200px] overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl dark:border-slate-700 dark:bg-slate-800"
    >
      {items.map((item, i) =>
        item === 'divider' ? (
          <div key={i} className="my-1 border-t border-slate-100 dark:border-slate-700" />
        ) : (
          <button
            key={i}
            onClick={() => { item.onClick(); onClose() }}
            className={`flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/60 ${
              item.danger ? 'text-red-600 dark:text-red-400' : 'text-slate-700 dark:text-slate-300'
            }`}
          >
            {item.icon && <item.icon className="h-4 w-4 shrink-0 text-slate-400" />}
            {item.label}
            {item.shortcut && (
              <span className="ml-auto text-xs text-slate-400">{item.shortcut}</span>
            )}
          </button>
        )
      )}
    </div>
  )
}
```

Apply to `Invoices.jsx` — add right-click to each table row:

```jsx
import ContextMenu from '../components/shared/ContextMenu'
import { Eye, CheckCircle2, Bell, Edit, Trash2 } from 'lucide-react'

// In component state:
const [contextMenu, setContextMenu] = useState(null) // { x, y, invoice }

// On each table row:
onContextMenu={(e) => {
  e.preventDefault()
  setContextMenu({ x: e.clientX, y: e.clientY, invoice })
}}

// Context menu render (at bottom of component):
{contextMenu && (
  <ContextMenu
    x={contextMenu.x}
    y={contextMenu.y}
    onClose={() => setContextMenu(null)}
    items={[
      { icon: Eye, label: 'View Details', onClick: () => setDetailInvoice(contextMenu.invoice) },
      { icon: CheckCircle2, label: 'Mark as Paid', onClick: () => handleMarkPaid(contextMenu.invoice.id) },
      { icon: Bell, label: 'Send Reminder', onClick: () => handleSendReminder(contextMenu.invoice.id) },
      'divider',
      { icon: Edit, label: 'Edit Invoice', onClick: () => setEditInvoice(contextMenu.invoice) },
      { icon: Trash2, label: 'Delete Invoice', danger: true, onClick: () => handleDelete(contextMenu.invoice) },
    ]}
  />
)}
```

Apply the same ContextMenu to `Clients.jsx` table rows and pipeline cards:
```js
items={[
  { icon: Eye, label: 'View Details', onClick: () => setSelectedClient(contextMenu.client) },
  { icon: Sparkles, label: 'AI Enrich', onClick: () => handleEnrich(contextMenu.client.id) },
  'divider',
  { icon: Trash2, label: 'Delete Client', danger: true, onClick: () => handleDeleteClient(contextMenu.client) },
]}
```

Apply to `Tasks.jsx` task cards:
```js
items={[
  { icon: Edit, label: 'Edit Task', onClick: () => setEditTask(contextMenu.task) },
  { icon: ArrowRight, label: 'Move to In Progress', onClick: () => handleStatusChange(contextMenu.task.id, 'in_progress') },
  { icon: CheckCircle2, label: 'Mark as Done', onClick: () => handleStatusChange(contextMenu.task.id, 'done') },
  'divider',
  { icon: Trash2, label: 'Delete Task', danger: true, onClick: () => handleDelete(contextMenu.task) },
]}
```

---

## BLOCK 4 — INBOX: Swipe actions + bulk select (Superhuman-style)

**What Superhuman/Gmail does:** Hover over an email row and checkboxes appear.
Select multiple emails. Bulk toolbar appears with Archive, Mark Read, Label actions.
This is the primary productivity unlock for inbox management.

**File: `frontend/src/pages/Inbox.jsx`**

Read the entire file. Find where emails are listed.

Add multi-select state:
```js
const [selectedIds, setSelectedIds] = useState(new Set())
const toggleSelect = (id) => setSelectedIds(prev => {
  const next = new Set(prev)
  next.has(id) ? next.delete(id) : next.add(id)
  return next
})
const selectAll = () => setSelectedIds(new Set(emails.map(e => e.id)))
const clearSelection = () => setSelectedIds(new Set())
```

Add checkbox to each email row (appears on hover):
```jsx
<div className="group relative flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50">
  {/* Checkbox — visible on hover or when selected */}
  <div className={`absolute left-2 flex h-5 w-5 items-center justify-center transition-opacity ${
    selectedIds.has(email.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
  }`}>
    <input
      type="checkbox"
      checked={selectedIds.has(email.id)}
      onChange={() => toggleSelect(email.id)}
      onClick={e => e.stopPropagation()}
      className="h-4 w-4 rounded border-slate-300 text-blue-600 accent-blue-600"
    />
  </div>
  {/* Email content — shift right when checkbox visible */}
  <div className={`flex-1 min-w-0 transition-transform ${
    selectedIds.size > 0 ? 'pl-6' : 'group-hover:pl-6'
  }`}>
    {/* existing email content */}
  </div>
</div>
```

Add bulk action toolbar (appears when selection > 0):
```jsx
{selectedIds.size > 0 && (
  <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-blue-200 bg-blue-50 px-4 py-2.5 dark:border-blue-800/30 dark:bg-blue-900/20">
    <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
      {selectedIds.size} selected
    </span>
    <div className="flex items-center gap-1 ml-2">
      <button
        onClick={() => {
          setEmails(prev => prev.map(e => selectedIds.has(e.id) ? { ...e, is_read: true } : e))
          clearSelection()
          toast.success(`${selectedIds.size} emails marked as read`)
        }}
        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 dark:text-blue-300 dark:hover:bg-blue-800/40"
      >
        <Eye className="h-3.5 w-3.5" /> Mark Read
      </button>
      <button
        onClick={() => {
          setEmails(prev => prev.filter(e => !selectedIds.has(e.id)))
          clearSelection()
          toast.success(`${selectedIds.size} emails archived`)
        }}
        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 dark:text-blue-300 dark:hover:bg-blue-800/40"
      >
        <Archive className="h-3.5 w-3.5" /> Archive
      </button>
      <button
        onClick={clearSelection}
        className="ml-2 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
      >
        Cancel
      </button>
    </div>
  </div>
)}
```

---

## BLOCK 5 — CLIENTS: Inline field editing (Attio-style)

**What Attio does:** Click any field value to edit it inline. No modal needed for simple
edits like updating a deal value, contact email, or pipeline stage. Field becomes an
input on click, saves on blur or Enter.

**File: `frontend/src/components/clients/ClientDetailPanel.jsx` (or wherever detail renders)**

Read the file. Find where client fields are displayed.

Create an `InlineField` component at top of the file:

```jsx
function InlineField({ label, value, onSave, type = 'text', options = null }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(value || '')
  const inputRef = useRef(null)

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  const save = () => {
    setEditing(false)
    if (val !== value) onSave(val)
  }

  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-0.5">{label}</dt>
      {editing ? (
        options ? (
          <select
            ref={inputRef}
            value={val}
            onChange={e => setVal(e.target.value)}
            onBlur={save}
            className="w-full rounded-lg border border-blue-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-blue-600 dark:bg-slate-700 dark:text-white"
          >
            {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        ) : (
          <input
            ref={inputRef}
            type={type}
            value={val}
            onChange={e => setVal(e.target.value)}
            onBlur={save}
            onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') { setEditing(false); setVal(value) } }}
            className="w-full rounded-lg border border-blue-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-blue-600 dark:bg-slate-700 dark:text-white"
          />
        )
      ) : (
        <dd
          onClick={() => setEditing(true)}
          className="group flex cursor-pointer items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700/60"
          title="Click to edit"
        >
          {val || <span className="text-slate-400 italic">Click to add</span>}
          <Edit2 className="ml-auto h-3 w-3 shrink-0 text-slate-300 opacity-0 transition-opacity group-hover:opacity-100" />
        </dd>
      )}
    </div>
  )
}
```

Replace all read-only field displays in the client detail panel with `InlineField`:

```jsx
<InlineField
  label="Contact Name"
  value={client.contact_name}
  onSave={(v) => handleFieldUpdate(client.id, { contact_name: v })}
/>
<InlineField
  label="Email"
  value={client.email}
  type="email"
  onSave={(v) => handleFieldUpdate(client.id, { email: v })}
/>
<InlineField
  label="Deal Value (€)"
  value={String(client.deal_value || '')}
  type="number"
  onSave={(v) => handleFieldUpdate(client.id, { deal_value: parseFloat(v) })}
/>
<InlineField
  label="Pipeline Stage"
  value={client.pipeline_stage}
  options={[
    { value: 'lead', label: 'Lead' },
    { value: 'contacted', label: 'Contacted' },
    { value: 'proposal', label: 'Proposal' },
    { value: 'negotiation', label: 'Negotiation' },
    { value: 'won', label: 'Won' },
    { value: 'lost', label: 'Lost' },
  ]}
  onSave={(v) => handleFieldUpdate(client.id, { pipeline_stage: v })}
/>
<InlineField
  label="Notes"
  value={client.notes}
  onSave={(v) => handleFieldUpdate(client.id, { notes: v })}
/>
```

Add `handleFieldUpdate` to the parent component:
```js
const handleFieldUpdate = async (clientId, updates) => {
  // Optimistic update
  queryClient.setQueryData(['clients'], old =>
    (Array.isArray(old) ? old : DEMO_CLIENTS).map(c =>
      c.id === clientId ? { ...c, ...updates } : c
    )
  )
  toast.success('Saved')
  try { await api.put(`/clients/${clientId}`, updates) } catch { /* demo */ }
}
```

Import `Edit2` from lucide-react.

---

## BLOCK 6 — DASHBOARD: Live "pulse" ticker (Stripe-style activity)

**What Stripe does:** A live event feed at the bottom of the dashboard shows real-time
events as they happen — payments received, subscriptions created, etc. Creates the
feeling of a living, breathing business.

**File: `frontend/src/components/dashboard/ActivityFeed.jsx`**

Read the file. Find the activity feed render.

Add a "live" indicator at the top of the activity feed header:

```jsx
<div className="flex items-center gap-2">
  <span className="relative flex h-2.5 w-2.5">
    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
  </span>
  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Activity</h3>
  <span className="text-xs text-slate-400">Live</span>
</div>
```

Add simulated live events in demo mode. In the component's useEffect:

```js
useEffect(() => {
  // Simulate a new activity every 45 seconds in demo mode
  const DEMO_LIVE_EVENTS = [
    { id: `live-${Date.now()}`, icon: '📧', description: 'AI classified 3 new emails from TechVision', entity_type: 'email', timestamp: new Date().toISOString() },
    { id: `live-${Date.now()+1}`, icon: '💰', description: 'Invoice #1089 marked as paid — €12,500', entity_type: 'invoice', timestamp: new Date().toISOString() },
    { id: `live-${Date.now()+2}`, icon: '👤', description: 'DataSync Corp moved to Negotiation stage', entity_type: 'client', timestamp: new Date().toISOString() },
    { id: `live-${Date.now()+3}`, icon: '⚡', description: 'Automation ran: Invoice Reminder sent to CloudFirst', entity_type: 'automation', timestamp: new Date().toISOString() },
  ]
  let i = 0
  const interval = setInterval(() => {
    const newEvent = { ...DEMO_LIVE_EVENTS[i % DEMO_LIVE_EVENTS.length], id: `live-${Date.now()}`, timestamp: new Date().toISOString() }
    setActivities(prev => [newEvent, ...prev.slice(0, 49)])
    i++
  }, 45000)
  return () => clearInterval(interval)
}, [])
```

---

## BLOCK 7 — TASKS: Keyboard shortcuts for power users (Linear-style)

**What Linear does:** Every action has a keyboard shortcut. C to create, X to select,
P to set priority. Power users never touch the mouse.

**File: `frontend/src/pages/Tasks.jsx`**

Read the file. Add keyboard shortcut handling:

```js
useEffect(() => {
  const handler = (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
    // C = create new task
    if (e.key === 'c' || e.key === 'C') {
      e.preventDefault()
      setShowModal(true)
    }
    // F = filter / focus search
    if (e.key === 'f' || e.key === 'F') {
      e.preventDefault()
      document.querySelector('[data-task-search]')?.focus()
    }
    // Number keys 1-4 to set priority of selected task
    if (selectedTask) {
      const priorities = { '1': 'urgent', '2': 'high', '3': 'medium', '4': 'low' }
      if (priorities[e.key]) {
        handlePriorityChange(selectedTask.id, priorities[e.key])
        toast.success(`Priority set to ${priorities[e.key]}`)
      }
    }
  }
  document.addEventListener('keydown', handler)
  return () => document.removeEventListener('keydown', handler)
}, [selectedTask])
```

Add a selected task state:
```js
const [selectedTask, setSelectedTask] = useState(null)
```

Add `onClick={() => setSelectedTask(task)}` and a selected ring to task cards:
```jsx
className={`rounded-xl border bg-white p-4 cursor-pointer transition-all hover:shadow-md dark:bg-slate-800 ${
  selectedTask?.id === task.id
    ? 'border-blue-400 ring-2 ring-blue-400/20 dark:border-blue-500'
    : 'border-slate-200 dark:border-slate-700'
}`}
```

Add a keyboard hint bar at top of the Tasks page:
```jsx
<div className="flex items-center gap-4 rounded-lg bg-slate-50 px-4 py-2 text-xs text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
  <span>Shortcuts:</span>
  <span><kbd className="rounded border border-slate-200 bg-white px-1.5 font-mono dark:border-slate-600 dark:bg-slate-800">C</kbd> New task</span>
  <span><kbd className="rounded border border-slate-200 bg-white px-1.5 font-mono dark:border-slate-600 dark:bg-slate-800">1-4</kbd> Set priority</span>
  <span><kbd className="rounded border border-slate-200 bg-white px-1.5 font-mono dark:border-slate-600 dark:bg-slate-800">F</kbd> Filter</span>
</div>
```

---

## BLOCK 8 — ANALYTICS: Metric trend sparklines (Stripe dashboard-style)

**What Stripe does:** Each metric card has a small sparkline chart showing the
last 7 days of trend data. Gives instant context without requiring a click.

**File: `frontend/src/pages/Analytics.jsx`**

Read the file. Find the 4 stat cards at the top.

Add a Sparkline component using Recharts:

```jsx
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts'

function Sparkline({ data, color = '#3b82f6', positive = true }) {
  return (
    <ResponsiveContainer width="100%" height={40}>
      <LineChart data={data} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
        <Line
          type="monotone"
          dataKey="v"
          stroke={positive ? color : '#ef4444'}
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
        />
        <Tooltip
          content={({ active, payload }) => active && payload?.length ? (
            <div className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs shadow-md dark:border-slate-700 dark:bg-slate-800">
              €{payload[0].value?.toLocaleString()}
            </div>
          ) : null}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
```

Add sparkline data to each stat card:
```js
const SPARKLINES = {
  revenue: [
    { v: 22400 }, { v: 24100 }, { v: 21800 }, { v: 25300 },
    { v: 23900 }, { v: 26100 }, { v: 27600 }
  ],
  clients: [
    { v: 11 }, { v: 12 }, { v: 12 }, { v: 13 },
    { v: 13 }, { v: 14 }, { v: 15 }
  ],
  emails: [
    { v: 38 }, { v: 45 }, { v: 42 }, { v: 51 },
    { v: 44 }, { v: 48 }, { v: 42 }
  ],
  tasks: [
    { v: 12 }, { v: 15 }, { v: 18 }, { v: 14 },
    { v: 19 }, { v: 16 }, { v: 21 }
  ],
}
```

Render sparkline inside each stat card (bottom of card):
```jsx
<div className="mt-3 h-10">
  <Sparkline data={SPARKLINES.revenue} />
</div>
```

---

## BLOCK 9 — ALL PAGES: Consistent empty states (Linear quality bar)

**What Linear does:** Every empty state is useful, not decorative. It tells you
exactly what to do next and gives you a one-click action to do it.

Create `frontend/src/components/shared/EmptyState.jsx` (overwrite if exists):

```jsx
import { PlusCircle } from 'lucide-react'

export default function EmptyState({ icon: Icon, title, description, action, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
        <Icon className="h-8 w-8 text-slate-400 dark:text-slate-500" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-white">{title}</h3>
      <p className="mt-1.5 max-w-sm text-center text-sm text-slate-500 dark:text-slate-400">{description}</p>
      {action && (
        <button
          onClick={onAction}
          className="mt-5 flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
        >
          <PlusCircle className="h-4 w-4" />
          {action}
        </button>
      )}
    </div>
  )
}
```

Use it in every page that shows an empty list. Example — `Tasks.jsx` empty column:
```jsx
{columnTasks.length === 0 && (
  <EmptyState
    icon={CheckSquare}
    title="No tasks here"
    description={col.id === 'todo' ? "Add your first task to get started." : `No tasks ${col.id === 'in_progress' ? 'in progress' : 'done'} yet.`}
    action={col.id === 'todo' ? 'Add Task' : undefined}
    onAction={() => setShowModal(true)}
  />
)}
```

`Invoices.jsx` empty state:
```jsx
<EmptyState
  icon={Receipt}
  title="No invoices yet"
  description="Create your first invoice to start tracking payments and cash flow."
  action="Create Invoice"
  onAction={() => setShowAddModal(true)}
/>
```

`Clients.jsx` empty pipeline column:
```jsx
<EmptyState
  icon={Users}
  title={`No ${column.label.toLowerCase()} clients`}
  description="Drag clients here or add a new one."
/>
```

---

## BLOCK 10 — HEADER: Upgrade search bar to full command palette trigger

**File: `frontend/src/components/layout/Header.jsx`**

Read the file. Find the search bar input element.

Replace it with a styled button that opens the command palette:

```jsx
<button
  onClick={onOpenPalette}
  className="flex h-9 w-64 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-left text-sm text-slate-400 transition-colors hover:border-slate-300 hover:bg-white dark:border-slate-600 dark:bg-slate-800/50 dark:hover:bg-slate-800 lg:w-80"
>
  <Search className="h-4 w-4 shrink-0" />
  <span className="flex-1">Search or type a command...</span>
  <kbd className="flex items-center gap-0.5 rounded border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[10px] text-slate-400 dark:border-slate-600 dark:bg-slate-700">
    <span>⌘</span><span>K</span>
  </kbd>
</button>
```

---

## BLOCK 11 — REPORTS: Add "Share" button + email delivery simulation

**What Notion/Linear does:** Reports can be shared via link or emailed.
This is a premium feature that signals enterprise readiness.

**File: `frontend/src/pages/Reports.jsx`**

Read the file. Find the briefing hero card header.

Add a Share button next to Copy:

```jsx
const [shareModalOpen, setShareModalOpen] = useState(false)

{/* Add next to Copy button */}
<button
  onClick={() => setShareModalOpen(true)}
  className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-800"
>
  <Share2 className="h-3.5 w-3.5" />
  Share
</button>
```

Add the Share modal (simple, clean):
```jsx
{shareModalOpen && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShareModalOpen(false)}>
    <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl dark:bg-slate-800" onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-700">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">Share Report</h3>
        <button onClick={() => setShareModalOpen(false)}>
          <X className="h-5 w-5 text-slate-400" />
        </button>
      </div>
      <div className="p-6 space-y-4">
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email to</label>
          <input
            type="email"
            placeholder="colleague@company.com"
            className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Schedule</label>
          <select className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white">
            <option>Send once now</option>
            <option>Every Monday (weekly)</option>
            <option>1st of month (monthly)</option>
            <option>Every day (daily briefing)</option>
          </select>
        </div>
        <button
          onClick={() => {
            setShareModalOpen(false)
            toast.success('Report scheduled for delivery')
          }}
          className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Schedule Delivery
        </button>
      </div>
    </div>
  </div>
)}
```

Add `Share2` to lucide-react import.

---

## BLOCK 12 — GLOBAL: Page transition micro-animation

**What Linear/Notion do:** Page transitions are instantaneous but have a subtle
fade-in that makes the app feel smooth and premium, not jarring.

**File: `frontend/src/index.css` (or global CSS)**

Add this:
```css
/* Page transition */
.page-enter {
  opacity: 0;
  transform: translateY(4px);
}
.page-enter-active {
  opacity: 1;
  transform: translateY(0);
  transition: opacity 150ms ease, transform 150ms ease;
}
```

**File: `frontend/src/components/layout/Layout.jsx`**

Read the file. Find where the main content area renders children.

Wrap the page content area with a simple fade:

```jsx
import { useLocation } from 'react-router-dom'

const location = useLocation()

// Wrap the children/Outlet render:
<main
  key={location.pathname}
  className="animate-fade-in"
  // animate-fade-in: add to tailwind.config.js or use inline style
  style={{ animation: 'fadeIn 150ms ease' }}
>
  {children}
</main>
```

Add to the `<style>` or global CSS (inline via style tag in index.html):
```css
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}
```

Alternatively, add to `tailwind.config.js`:
```js
extend: {
  keyframes: {
    fadeIn: {
      '0%': { opacity: '0', transform: 'translateY(4px)' },
      '100%': { opacity: '1', transform: 'translateY(0)' },
    },
  },
  animation: {
    'fade-in': 'fadeIn 150ms ease',
  },
}
```

Then use `className="animate-fade-in"` on the main content wrapper.

---

## FINAL BUILD + VERIFY + COMMIT

```bash
cd frontend && npm run build 2>&1 | tail -20
echo "Build exit: $?"
```

Must exit 0. Fix every error before continuing.

Then verify key additions:
```bash
echo "=== COMMAND PALETTE ==="
grep -c "fuzzyMatch\|CommandPalette\|COMMANDS" frontend/src/components/shared/CommandPalette.jsx

echo "=== UNDO HOOK ==="
grep -c "useUndoable\|withUndo" frontend/src/hooks/useUndoable.js

echo "=== CONTEXT MENU ==="
grep -c "ContextMenu\|onContextMenu" frontend/src/pages/Invoices.jsx

echo "=== BULK SELECT INBOX ==="
grep -c "selectedIds\|toggleSelect\|selectAll" frontend/src/pages/Inbox.jsx

echo "=== INLINE EDITING ==="
grep -c "InlineField\|handleFieldUpdate" frontend/src/pages/Clients.jsx

echo "=== LIVE PULSE ==="
grep -c "animate-ping\|setInterval.*45000" frontend/src/components/dashboard/ActivityFeed.jsx

echo "=== SPARKLINES ==="
grep -c "Sparkline\|SPARKLINES" frontend/src/pages/Analytics.jsx

echo "=== EMPTY STATES ==="
grep -rn "EmptyState" frontend/src/pages/ | wc -l

echo "=== PAGE TRANSITIONS ==="
grep -c "animate-fade-in\|fadeIn" frontend/src/components/layout/Layout.jsx

echo "=== TASKS SHORTCUTS ==="
grep -c "addEventListener.*keydown\|key.*=.*'c'" frontend/src/pages/Tasks.jsx

echo "=== SHARE MODAL ==="
grep -c "shareModalOpen\|Schedule Delivery" frontend/src/pages/Reports.jsx
```

Then commit and push:
```bash
git add -A && git commit -m "feat: enterprise upgrade — command palette, undo system, context menus, inline editing, bulk select, sparklines, live feed, keyboard shortcuts, page transitions, share reports"
git push origin main
```

Deploy on Hetzner:
```bash
cd /opt/lytherahub && git pull && docker compose -f docker-compose.prod.yml up -d --build frontend
```

---

## WHAT THIS DELIVERS

| Feature | Benchmark |
|---|---|
| Global ⌘K command palette with fuzzy search | Linear |
| Undo toasts on all destructive actions | Linear |
| Right-click context menus on tables/cards | Enterprise standard |
| Inbox bulk select + action toolbar | Superhuman / Gmail |
| Inline field editing on client records | Attio |
| Live activity pulse ticker | Stripe |
| Task keyboard shortcuts (C, 1-4, F) | Linear |
| Metric sparklines on stat cards | Stripe |
| Consistent, actionable empty states | Linear / Notion |
| Search bar upgraded to palette trigger | Linear / Vercel |
| Report share + scheduled delivery | Notion |
| 150ms page fade-in transitions | Linear |
