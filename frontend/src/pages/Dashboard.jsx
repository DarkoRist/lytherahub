import { useState, useEffect } from 'react'
import {
  Bell,
  AlertTriangle,
  Info,
  CheckCircle2,
  X,
  Eye,
  ShieldAlert,
} from 'lucide-react'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import { formatRelativeTime } from '../utils/formatters'
import toast from 'react-hot-toast'

import MorningBriefing from '../components/dashboard/MorningBriefing'
import CommandBar from '../components/dashboard/CommandBar'
import StatsGrid from '../components/dashboard/StatsGrid'
import ActivityFeed from '../components/dashboard/ActivityFeed'

const DEMO_ALERTS = [
  { id: 'a1', title: 'Invoice overdue: CloudFirst AG — €8,500', severity: 'critical', description: '17 days past due. Consider sending a final reminder.', timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(), read: false },
  { id: 'a2', title: 'Stale lead: StartupHub Berlin', severity: 'high', description: 'No contact in 12 days. Follow-up recommended.', timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), read: false },
  { id: 'a3', title: 'Meeting prep ready: Hans Weber call at 3 PM', severity: 'medium', description: 'AI-generated prep brief is available.', timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(), read: false },
  { id: 'a4', title: 'Weekly revenue up 12% — €27,600', severity: 'low', description: 'Strong performance driven by TechVision and FinTech deals.', timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), read: true },
]

const severityConfig = {
  critical: {
    icon: ShieldAlert,
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800/40',
    iconColor: 'text-red-500',
    text: 'text-red-800 dark:text-red-300',
    subtext: 'text-red-600 dark:text-red-400',
    badge: 'bg-red-100 text-red-700 dark:bg-red-800/30 dark:text-red-400',
  },
  high: {
    icon: AlertTriangle,
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    border: 'border-amber-200 dark:border-amber-800/40',
    iconColor: 'text-amber-500',
    text: 'text-amber-800 dark:text-amber-300',
    subtext: 'text-amber-600 dark:text-amber-400',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-800/30 dark:text-amber-400',
  },
  medium: {
    icon: Info,
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800/40',
    iconColor: 'text-blue-500',
    text: 'text-blue-800 dark:text-blue-300',
    subtext: 'text-blue-600 dark:text-blue-400',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-800/30 dark:text-blue-400',
  },
  low: {
    icon: CheckCircle2,
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    border: 'border-emerald-200 dark:border-emerald-800/40',
    iconColor: 'text-emerald-500',
    text: 'text-emerald-800 dark:text-emerald-300',
    subtext: 'text-emerald-600 dark:text-emerald-400',
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-800/30 dark:text-emerald-400',
  },
}

function getSeverityConfig(severity) {
  return severityConfig[severity] || severityConfig.medium
}

function AlertsSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-xl border border-slate-200 p-4 dark:border-slate-700"
        >
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-lg bg-slate-200 animate-pulse dark:bg-slate-700" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 rounded bg-slate-200 animate-pulse dark:bg-slate-700" />
              <div className="h-3 w-1/2 rounded bg-slate-200 animate-pulse dark:bg-slate-700" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function AlertsPanel() {
  const [alerts, setAlerts] = useState(DEMO_ALERTS)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const { data } = await api.get('/alerts', { params: { limit: 5 } })
        if (cancelled) return
        const items = Array.isArray(data) ? data : data?.alerts || []
        if (items.length > 0) setAlerts(items)
      } catch {
        // keep DEMO_ALERTS
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const handleRead = async (alertId) => {
    setAlerts((prev) => prev.map((a) => (a.id === alertId ? { ...a, read: true } : a)))
    toast.success('Alert marked as read')
    try { await api.patch(`/alerts/${alertId}/read`) } catch { /* demo */ }
  }

  const handleDismiss = async (alertId) => {
    setAlerts((prev) => prev.filter((a) => a.id !== alertId))
    toast.success('Alert dismissed')
    try { await api.delete(`/alerts/${alertId}`) } catch { /* demo */ }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Alerts
          </h3>
          {alerts.length > 0 && (
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-100 px-1.5 text-xs font-medium text-red-700 dark:bg-red-800/30 dark:text-red-400">
              {alerts.length}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        {isLoading ? (
          <AlertsSkeleton />
        ) : alerts.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-900/20">
              <CheckCircle2 className="h-6 w-6 text-emerald-500" />
            </div>
            <p className="mt-3 text-sm font-medium text-slate-600 dark:text-slate-400">
              All clear
            </p>
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
              No alerts at the moment
            </p>
          </div>
        ) : (
          /* Alerts List */
          <div className="space-y-2">
            {alerts.map((alert, index) => {
              const config = getSeverityConfig(alert.severity)
              const Icon = config.icon

              return (
                <div
                  key={alert.id || index}
                  className={`rounded-xl border p-4 transition-all ${config.border} ${config.bg} ${
                    alert.read ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/60 dark:bg-slate-800/40">
                      <Icon className={`h-4 w-4 ${config.iconColor}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-medium leading-snug ${config.text}`}>
                          {alert.title || alert.message}
                        </p>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${config.badge}`}
                        >
                          {alert.severity}
                        </span>
                      </div>
                      {alert.description && (
                        <p className={`mt-1 text-xs leading-relaxed ${config.subtext}`}>
                          {alert.description}
                        </p>
                      )}
                      <div className="mt-2 flex items-center gap-3">
                        {alert.timestamp && (
                          <span className="text-xs text-slate-400 dark:text-slate-500">
                            {formatRelativeTime(alert.timestamp)}
                          </span>
                        )}
                        <div className="flex items-center gap-1">
                          {!alert.read && (
                            <button
                              onClick={() => handleRead(alert.id)}
                              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-500 hover:bg-white/60 hover:text-slate-700 transition-colors dark:text-slate-400 dark:hover:bg-slate-700/50 dark:hover:text-slate-200"
                              title="Mark as read"
                            >
                              <Eye className="h-3 w-3" />
                              Read
                            </button>
                          )}
                          <button
                            onClick={() => handleDismiss(alert.id)}
                            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-500 hover:bg-white/60 hover:text-slate-700 transition-colors dark:text-slate-400 dark:hover:bg-slate-700/50 dark:hover:text-slate-200"
                            title="Dismiss"
                          >
                            <X className="h-3 w-3" />
                            Dismiss
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}. Here is your business at a glance.
        </p>
      </div>

      {/* Morning Briefing (full width) */}
      <MorningBriefing />

      {/* Command Bar (full width) */}
      <CommandBar />

      {/* Stats Grid (full width) */}
      <StatsGrid />

      {/* Two-column layout: Activity Feed + Alerts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left: Activity Feed */}
        <ActivityFeed />

        {/* Right: Alerts Panel */}
        <AlertsPanel />
      </div>
    </div>
  )
}
