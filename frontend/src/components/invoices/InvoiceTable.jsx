import { useState, useRef, useEffect } from 'react'
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
  Eye,
  CheckCircle2,
  Bell,
  Pencil,
  Trash2,
  Receipt,
} from 'lucide-react'
import ContextMenu from '../shared/ContextMenu'

function StatusBadge({ status }) {
  const config = {
    draft: {
      bg: 'bg-slate-100 dark:bg-slate-700',
      text: 'text-slate-600 dark:text-slate-300',
      dot: 'bg-slate-400',
      label: 'Draft',
    },
    sent: {
      bg: 'bg-blue-50 dark:bg-blue-900/30',
      text: 'text-blue-700 dark:text-blue-300',
      dot: 'bg-blue-500',
      label: 'Sent',
    },
    paid: {
      bg: 'bg-emerald-50 dark:bg-emerald-900/30',
      text: 'text-emerald-700 dark:text-emerald-300',
      dot: 'bg-emerald-500',
      label: 'Paid',
    },
    overdue: {
      bg: 'bg-red-50 dark:bg-red-900/30',
      text: 'text-red-700 dark:text-red-300',
      dot: 'bg-red-500 animate-pulse',
      label: 'Overdue',
    },
  }

  const c = config[status] || config.draft

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${c.bg} ${c.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  )
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

function formatDate(dateStr) {
  if (!dateStr) return '--'
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function getDueDateColor(dateStr, status) {
  if (status === 'paid') return 'text-slate-500 dark:text-slate-400'
  if (!dateStr) return 'text-slate-500 dark:text-slate-400'
  const now = new Date()
  const due = new Date(dateStr)
  const daysUntil = Math.ceil((due - now) / (1000 * 60 * 60 * 24))
  if (daysUntil < 0) return 'text-red-600 dark:text-red-400 font-medium'
  if (daysUntil <= 7) return 'text-amber-600 dark:text-amber-400 font-medium'
  return 'text-slate-600 dark:text-slate-300'
}

function ActionDropdown({ invoice, onAction }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const actions = [
    { key: 'view', label: 'View Details', icon: Eye },
    ...(invoice.status !== 'paid'
      ? [{ key: 'mark_paid', label: 'Mark as Paid', icon: CheckCircle2 }]
      : []),
    ...(invoice.status !== 'paid'
      ? [{ key: 'remind', label: 'Send Reminder', icon: Bell }]
      : []),
    { key: 'edit', label: 'Edit', icon: Pencil },
    { key: 'delete', label: 'Delete', icon: Trash2, danger: true },
  ]

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-1 w-48 rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-800">
          {actions.map((action) => (
            <button
              key={action.key}
              onClick={() => {
                onAction(action.key, invoice)
                setOpen(false)
              }}
              className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors ${
                action.danger
                  ? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20'
                  : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              <action.icon className="h-4 w-4" />
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function SkeletonRow() {
  return (
    <tr className="border-b border-slate-100 dark:border-slate-700/50">
      {[...Array(6)].map((_, i) => (
        <td key={i} className="px-4 py-3.5">
          <div
            className="h-4 animate-pulse rounded bg-slate-200 dark:bg-slate-700"
            style={{ width: `${50 + Math.random() * 40}%` }}
          />
        </td>
      ))}
    </tr>
  )
}

const SORTABLE_COLUMNS = [
  { key: 'invoice_number', label: 'Invoice #' },
  { key: 'client_name', label: 'Client' },
  { key: 'amount', label: 'Amount' },
  { key: 'status', label: 'Status' },
  { key: 'due_date', label: 'Due Date' },
]

export default function InvoiceTable({
  invoices = [],
  loading = false,
  onAction,
  sortBy = 'due_date',
  sortDir = 'desc',
  onSort,
}) {
  const [ctxMenu, setCtxMenu] = useState(null) // { x, y, invoice }

  const handleContextMenu = (e, invoice) => {
    e.preventDefault()
    setCtxMenu({ x: e.clientX, y: e.clientY, invoice })
  }

  const ctxItems = (invoice) => [
    { label: 'View Details', icon: Eye, action: () => onAction('view', invoice) },
    ...(invoice.status !== 'paid' ? [{ label: 'Mark as Paid', icon: CheckCircle2, action: () => onAction('mark_paid', invoice) }] : []),
    ...(invoice.status !== 'paid' ? [{ label: 'Send Reminder', icon: Bell, action: () => onAction('remind', invoice) }] : []),
    'divider',
    { label: 'Edit Invoice', icon: Pencil, action: () => onAction('edit', invoice) },
    { label: 'Delete Invoice', icon: Trash2, action: () => onAction('delete', invoice), danger: true },
  ]

  function handleSort(key) {
    if (onSort) {
      onSort(key, sortBy === key && sortDir === 'asc' ? 'desc' : 'asc')
    }
  }

  function SortIcon({ column }) {
    if (sortBy !== column) {
      return <ArrowUpDown className="ml-1 h-3.5 w-3.5 text-slate-300 dark:text-slate-600" />
    }
    return sortDir === 'asc' ? (
      <ArrowUp className="ml-1 h-3.5 w-3.5 text-blue-500" />
    ) : (
      <ArrowDown className="ml-1 h-3.5 w-3.5 text-blue-500" />
    )
  }

  if (!loading && invoices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-16 dark:border-slate-700 dark:bg-slate-800">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700">
          <Receipt className="h-7 w-7 text-slate-400 dark:text-slate-500" />
        </div>
        <h3 className="mt-4 text-base font-semibold text-slate-800 dark:text-white">
          No invoices found
        </h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Create your first invoice or adjust your filters.
        </p>
      </div>
    )
  }

  return (
    <>
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
      <table className="w-full min-w-[700px] text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/80 dark:border-slate-700 dark:bg-slate-800/80">
            {SORTABLE_COLUMNS.map((col) => (
              <th
                key={col.key}
                onClick={() => handleSort(col.key)}
                className="cursor-pointer px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 transition-colors hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              >
                <span className="inline-flex items-center">
                  {col.label}
                  <SortIcon column={col.key} />
                </span>
              </th>
            ))}
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {loading
            ? [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
            : invoices.map((inv) => (
                <tr
                  key={inv.id}
                  onContextMenu={(e) => handleContextMenu(e, inv)}
                  className="border-b border-slate-100 transition-colors hover:bg-slate-50/50 dark:border-slate-700/50 dark:hover:bg-slate-700/30"
                >
                  <td className="px-4 py-3.5 font-medium text-slate-900 dark:text-white">
                    {inv.invoice_number}
                  </td>
                  <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300">
                    {inv.client_name}
                  </td>
                  <td className="px-4 py-3.5 font-semibold text-slate-800 dark:text-slate-100">
                    {formatCurrency(inv.amount)}
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusBadge status={inv.status} />
                  </td>
                  <td
                    className={`px-4 py-3.5 text-sm ${getDueDateColor(inv.due_date, inv.status)}`}
                  >
                    {formatDate(inv.due_date)}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <ActionDropdown invoice={inv} onAction={onAction} />
                  </td>
                </tr>
              ))}
        </tbody>
      </table>
    </div>

    {ctxMenu && (
      <ContextMenu
        x={ctxMenu.x}
        y={ctxMenu.y}
        items={ctxItems(ctxMenu.invoice)}
        onClose={() => setCtxMenu(null)}
      />
    )}
    </>
  )
}
