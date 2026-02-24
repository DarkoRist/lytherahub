import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, LayoutDashboard, Mail, Calendar, Receipt, Users,
  CheckSquare, LineChart, BarChart3, Zap, Settings, Plus,
  Hash, X,
} from 'lucide-react'

const COMMANDS = [
  // Navigate
  { section: 'Navigate', icon: LayoutDashboard, label: 'Dashboard', shortcut: 'G D', action: 'nav', to: '/dashboard' },
  { section: 'Navigate', icon: Mail, label: 'Inbox', shortcut: 'G I', action: 'nav', to: '/inbox' },
  { section: 'Navigate', icon: Calendar, label: 'Calendar', shortcut: 'G C', action: 'nav', to: '/calendar' },
  { section: 'Navigate', icon: Receipt, label: 'Invoices', shortcut: 'G V', action: 'nav', to: '/invoices' },
  { section: 'Navigate', icon: Users, label: 'Clients', shortcut: 'G P', action: 'nav', to: '/clients' },
  { section: 'Navigate', icon: CheckSquare, label: 'Tasks', shortcut: 'G T', action: 'nav', to: '/tasks' },
  { section: 'Navigate', icon: BarChart3, label: 'Reports', shortcut: 'G R', action: 'nav', to: '/reports' },
  { section: 'Navigate', icon: LineChart, label: 'Analytics', action: 'nav', to: '/analytics' },
  { section: 'Navigate', icon: Zap, label: 'Automations', action: 'nav', to: '/automations' },
  { section: 'Navigate', icon: Settings, label: 'Settings', action: 'nav', to: '/settings' },
  // Create
  { section: 'Create', icon: Plus, label: 'New Invoice', action: 'nav', to: '/invoices' },
  { section: 'Create', icon: Plus, label: 'Add Client', action: 'nav', to: '/clients' },
  { section: 'Create', icon: Plus, label: 'Add Task', action: 'nav', to: '/tasks' },
  { section: 'Create', icon: Plus, label: 'New Event', action: 'nav', to: '/calendar' },
  // Quick Info
  { section: 'Quick Info', icon: Hash, label: 'Monthly Revenue', action: 'info', info: 'Monthly revenue: €40,500 collected this month.' },
  { section: 'Quick Info', icon: Hash, label: 'Overdue Invoices', action: 'info', info: '2 invoices overdue: CloudFirst AG (€8,500) and MediaWave GmbH (€3,200). Total: €11,700.' },
  { section: 'Quick Info', icon: Hash, label: 'Active Tasks', action: 'info', info: '7 active tasks — 2 urgent, 3 high priority. 2 due today.' },
  { section: 'Quick Info', icon: Hash, label: 'Next Meeting', action: 'info', info: 'Next meeting: Client Call with Hans Weber at 3:00 PM today.' },
]

function fuzzyMatch(text, query) {
  if (!query) return true
  const t = text.toLowerCase()
  const q = query.toLowerCase()
  let ti = 0
  for (let qi = 0; qi < q.length; qi++) {
    ti = t.indexOf(q[qi], ti)
    if (ti === -1) return false
    ti++
  }
  return true
}

export default function CommandPalette({ open, onClose }) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [infoResult, setInfoResult] = useState(null)
  const inputRef = useRef(null)

  const filtered = COMMANDS.filter((c) => fuzzyMatch(c.label, query))

  // Group results
  const grouped = filtered.reduce((acc, cmd) => {
    if (!acc[cmd.section]) acc[cmd.section] = []
    acc[cmd.section].push(cmd)
    return acc
  }, {})

  // Flat list for keyboard nav
  const flat = filtered

  useEffect(() => {
    if (open) {
      setQuery('')
      setSelectedIdx(0)
      setInfoResult(null)
      setTimeout(() => inputRef.current?.focus(), 10)
    }
  }, [open])

  const runCommand = useCallback((cmd) => {
    if (cmd.action === 'nav') {
      navigate(cmd.to)
      onClose()
    } else if (cmd.action === 'info') {
      setInfoResult(cmd.info)
    }
  }, [navigate, onClose])

  useEffect(() => {
    if (!open) return
    const handleKey = (e) => {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIdx((i) => Math.min(i + 1, flat.length - 1))
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIdx((i) => Math.max(i - 1, 0))
      }
      if (e.key === 'Enter' && flat[selectedIdx]) {
        e.preventDefault()
        runCommand(flat[selectedIdx])
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, flat, selectedIdx, runCommand, onClose])

  useEffect(() => {
    setSelectedIdx(0)
    setInfoResult(null)
  }, [query])

  if (!open) return null

  let flatIndex = 0

  return (
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh] px-4"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-700">
          <Search className="h-4 w-4 shrink-0 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search or type a command..."
            className="flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-white"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-slate-400 hover:text-slate-600">
              <X className="h-4 w-4" />
            </button>
          )}
          <kbd className="rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-400">
            Esc
          </kbd>
        </div>

        {/* Info result */}
        {infoResult && (
          <div className="border-b border-slate-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-slate-700 dark:bg-blue-900/20 dark:text-blue-300">
            {infoResult}
          </div>
        )}

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto py-2">
          {flat.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-slate-400">No commands found</div>
          ) : (
            Object.entries(grouped).map(([section, cmds]) => (
              <div key={section}>
                <p className="mt-2 mb-1 px-4 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                  {section}
                </p>
                {cmds.map((cmd) => {
                  const idx = flatIndex++
                  const Icon = cmd.icon
                  const isSelected = idx === selectedIdx
                  return (
                    <button
                      key={cmd.label}
                      onClick={() => runCommand(cmd)}
                      onMouseEnter={() => setSelectedIdx(idx)}
                      className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                        isSelected
                          ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300'
                          : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0 text-slate-400" />
                      <span className="flex-1">{cmd.label}</span>
                      {cmd.shortcut && (
                        <kbd className="rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-400">
                          {cmd.shortcut}
                        </kbd>
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
            <span><kbd className="rounded border border-slate-200 bg-slate-100 px-1 py-0.5 font-mono dark:border-slate-600 dark:bg-slate-700">↑↓</kbd> navigate</span>
            <span><kbd className="rounded border border-slate-200 bg-slate-100 px-1 py-0.5 font-mono dark:border-slate-600 dark:bg-slate-700">↵</kbd> select</span>
            <span><kbd className="rounded border border-slate-200 bg-slate-100 px-1 py-0.5 font-mono dark:border-slate-600 dark:bg-slate-700">Esc</kbd> close</span>
          </div>
          <span className="text-[10px] text-slate-400">{flat.length} commands</span>
        </div>
      </div>
    </div>
  )
}
