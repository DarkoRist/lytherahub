import { useState, useEffect } from 'react'
import {
  AlertCircle, AlertTriangle, Info, RefreshCw, BellOff, X,
  Package, Handshake, Building2, Truck, Receipt, Loader2, CheckCheck,
} from 'lucide-react'
import { signalsApi } from '../api/signals'
import toast from 'react-hot-toast'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SEVERITY_CONFIG = {
  critical: {
    label: 'Critical',
    icon: AlertCircle,
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
    icon_color: 'text-red-500',
    badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  },
  warning: {
    label: 'Warning',
    icon: AlertTriangle,
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    border: 'border-amber-200 dark:border-amber-800',
    icon_color: 'text-amber-500',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  },
  info: {
    label: 'Info',
    icon: Info,
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    icon_color: 'text-blue-500',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  },
}

const TYPE_ICON = {
  overdue_invoice: Receipt,
  low_stock: Package,
  stale_deal: Handshake,
  late_delivery: Truck,
  stale_company: Building2,
}

function TypeIcon({ type }) {
  const Icon = TYPE_ICON[type] || AlertCircle
  return <Icon className="h-4 w-4" />
}

function fmtDate(d) {
  return new Date(d).toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ---------------------------------------------------------------------------
// Signal card
// ---------------------------------------------------------------------------

function SignalCard({ signal, onDismiss, onRead }) {
  const config = SEVERITY_CONFIG[signal.severity] || SEVERITY_CONFIG.warning
  const SevIcon = config.icon

  return (
    <div
      className={`relative flex items-start gap-3 rounded-xl border p-4 transition-opacity ${config.bg} ${config.border} ${
        signal.is_read ? 'opacity-70' : ''
      }`}
      onClick={() => !signal.is_read && onRead(signal.id)}
    >
      {/* Unread dot */}
      {!signal.is_read && (
        <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-blue-500" />
      )}

      {/* Severity icon */}
      <div className={`mt-0.5 shrink-0 ${config.icon_color}`}>
        <SevIcon className="h-5 w-5" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${config.badge}`}>
            <TypeIcon type={signal.signal_type} />
            {signal.signal_type.replace(/_/g, ' ')}
          </span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500">{fmtDate(signal.created_at)}</span>
        </div>
        <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{signal.title}</p>
        {signal.body && (
          <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">{signal.body}</p>
        )}
      </div>

      {/* Dismiss */}
      <button
        onClick={(e) => { e.stopPropagation(); onDismiss(signal.id) }}
        className="shrink-0 rounded p-1 text-slate-400 hover:bg-white/60 hover:text-slate-600 dark:hover:bg-slate-700/40 dark:hover:text-slate-300"
        title="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function Signals() {
  const [signals, setSignals] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [severityFilter, setSeverityFilter] = useState('all')

  useEffect(() => {
    loadSignals()
  }, [])

  async function loadSignals() {
    setLoading(true)
    setError(null)
    try {
      const res = await signalsApi.list()
      setSignals(res.data)
    } catch {
      setError('Failed to load signals')
    } finally {
      setLoading(false)
    }
  }

  async function handleRefresh() {
    setRefreshing(true)
    try {
      const res = await signalsApi.refresh()
      setSignals(res.data)
      toast.success(`Refreshed — ${res.data.length} signal${res.data.length !== 1 ? 's' : ''} found`)
    } catch {
      toast.error('Refresh failed')
    } finally {
      setRefreshing(false)
    }
  }

  async function handleDismiss(id) {
    try {
      await signalsApi.dismiss(id)
      setSignals((prev) => prev.filter((s) => s.id !== id))
    } catch {
      toast.error('Failed to dismiss')
    }
  }

  async function handleRead(id) {
    try {
      await signalsApi.markRead(id)
      setSignals((prev) => prev.map((s) => s.id === id ? { ...s, is_read: true } : s))
    } catch {
      // silent
    }
  }

  async function handleDismissAll() {
    if (!confirm('Dismiss all signals?')) return
    try {
      await signalsApi.dismissAll()
      setSignals([])
      toast.success('All signals dismissed')
    } catch {
      toast.error('Failed')
    }
  }

  const filtered = severityFilter === 'all' ? signals : signals.filter((s) => s.severity === severityFilter)

  const counts = {
    critical: signals.filter((s) => s.severity === 'critical').length,
    warning: signals.filter((s) => s.severity === 'warning').length,
    info: signals.filter((s) => s.severity === 'info').length,
    unread: signals.filter((s) => !s.is_read).length,
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Signals</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Automated business intelligence — {signals.length} active signal{signals.length !== 1 ? 's' : ''}
            {counts.unread > 0 && <span className="ml-1 text-blue-600 dark:text-blue-400">({counts.unread} unread)</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {signals.length > 0 && (
            <button
              onClick={handleDismissAll}
              className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <CheckCheck className="h-4 w-4" />
              Dismiss All
            </button>
          )}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { key: 'all', label: 'Total', count: signals.length, icon: AlertCircle, color: 'slate' },
          { key: 'critical', label: 'Critical', count: counts.critical, icon: AlertCircle, color: 'red' },
          { key: 'warning', label: 'Warning', count: counts.warning, icon: AlertTriangle, color: 'amber' },
          { key: 'info', label: 'Info', count: counts.info, icon: Info, color: 'blue' },
        ].map(({ key, label, count, icon: Icon, color }) => (
          <button
            key={key}
            onClick={() => setSeverityFilter(key)}
            className={`rounded-xl border p-4 text-left transition-all ${
              severityFilter === key
                ? `border-${color}-400 bg-${color}-50 dark:border-${color}-600 dark:bg-${color}-900/20`
                : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <Icon className={`h-4 w-4 text-${color}-500`} />
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{label}</span>
            </div>
            <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{count}</p>
          </button>
        ))}
      </div>

      {/* Content */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      )}

      {error && !loading && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
          <button onClick={loadSignals} className="ml-2 underline">Retry</button>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 py-20 dark:border-slate-700">
          <BellOff className="mb-3 h-10 w-10 text-slate-300 dark:text-slate-600" />
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {signals.length === 0 ? 'No active signals' : 'No signals in this category'}
          </p>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
            {signals.length === 0
              ? 'Click Refresh to run the signals engine'
              : 'All clear in this category'}
          </p>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="space-y-3">
          {/* Critical first, then warning, then info */}
          {['critical', 'warning', 'info'].map((sev) => {
            const sevSigs = filtered.filter((s) => s.severity === sev)
            if (sevSigs.length === 0) return null
            const config = SEVERITY_CONFIG[sev]
            return (
              <div key={sev}>
                <div className="mb-2 flex items-center gap-2">
                  <config.icon className={`h-4 w-4 ${config.icon_color}`} />
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {config.label} ({sevSigs.length})
                  </span>
                </div>
                <div className="space-y-2">
                  {sevSigs.map((s) => (
                    <SignalCard key={s.id} signal={s} onDismiss={handleDismiss} onRead={handleRead} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
