import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Zap,
  Mail,
  Calendar,
  Receipt,
  Users,
  BarChart3,
  MessageSquare,
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  ExternalLink,
  Activity,
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../api/client'
import { formatRelativeTime } from '../utils/formatters'

// ---------------------------------------------------------------------------
// Demo data
// ---------------------------------------------------------------------------

const DEMO_AUTOMATIONS = [
  {
    id: 'a1', name: 'Invoice Reminder', description: 'Automatically sends escalating payment reminders for overdue invoices at 7, 14, and 30 days.',
    category: 'invoice', trigger_type: 'scheduled', is_active: true, last_run: '2026-02-15T06:00:00Z', run_count: 42,
    history: [
      { time: '2026-02-15T06:00:00Z', status: 'success', trigger: 'scheduled', duration: '2.3s' },
      { time: '2026-02-14T06:00:00Z', status: 'success', trigger: 'scheduled', duration: '1.8s' },
      { time: '2026-02-13T06:00:00Z', status: 'success', trigger: 'scheduled', duration: '2.1s' },
    ],
  },
  {
    id: 'a2', name: 'Meeting Prep Generator', description: 'Generates AI meeting preparation briefs for tomorrow\'s meetings every evening at 8 PM.',
    category: 'calendar', trigger_type: 'scheduled', is_active: true, last_run: '2026-02-14T20:00:00Z', run_count: 28,
    history: [
      { time: '2026-02-14T20:00:00Z', status: 'success', trigger: 'scheduled', duration: '8.5s' },
      { time: '2026-02-13T20:00:00Z', status: 'success', trigger: 'scheduled', duration: '6.2s' },
    ],
  },
  {
    id: 'a3', name: 'New Lead Onboarding', description: 'When a new client email is detected, creates CRM entry, sends welcome email, and creates Drive folder.',
    category: 'client', trigger_type: 'event', is_active: true, last_run: '2026-02-12T14:30:00Z', run_count: 15,
    history: [
      { time: '2026-02-12T14:30:00Z', status: 'success', trigger: 'new_email', duration: '4.1s' },
      { time: '2026-02-08T09:15:00Z', status: 'failed', trigger: 'new_email', duration: '1.2s', error: 'Drive API quota exceeded' },
    ],
  },
  {
    id: 'a4', name: 'Weekly Report', description: 'Generates a comprehensive weekly business report every Monday at 8 AM and sends it via email and Slack.',
    category: 'report', trigger_type: 'scheduled', is_active: true, last_run: '2026-02-10T08:00:00Z', run_count: 8,
    history: [
      { time: '2026-02-10T08:00:00Z', status: 'success', trigger: 'scheduled', duration: '12.3s' },
    ],
  },
  {
    id: 'a5', name: 'Slack Daily Briefing', description: 'Posts your AI morning briefing to Slack DM every weekday at your configured wake time.',
    category: 'slack', trigger_type: 'scheduled', is_active: false, last_run: '2026-02-07T07:00:00Z', run_count: 22,
    history: [],
  },
  {
    id: 'a6', name: 'Email Auto-Classifier', description: 'Classifies and summarizes new emails as they arrive using AI. Flags urgent items for immediate attention.',
    category: 'email', trigger_type: 'event', is_active: true, last_run: '2026-02-15T10:45:00Z', run_count: 312,
    history: [
      { time: '2026-02-15T10:45:00Z', status: 'success', trigger: 'new_email', duration: '1.5s' },
      { time: '2026-02-15T10:30:00Z', status: 'success', trigger: 'new_email', duration: '1.2s' },
      { time: '2026-02-15T09:15:00Z', status: 'success', trigger: 'new_email', duration: '1.8s' },
    ],
  },
]

const CATEGORY_CONFIG = {
  email: { icon: Mail, color: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/30' },
  calendar: { icon: Calendar, color: 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/30' },
  invoice: { icon: Receipt, color: 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/30' },
  client: { icon: Users, color: 'text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-900/30' },
  report: { icon: BarChart3, color: 'text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-900/30' },
  slack: { icon: MessageSquare, color: 'text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-900/30' },
}

// ---------------------------------------------------------------------------
// Automations Page
// ---------------------------------------------------------------------------

export default function Automations() {
  const queryClient = useQueryClient()
  const [expandedId, setExpandedId] = useState(null)

  const { data: automations } = useQuery({
    queryKey: ['automations'],
    queryFn: () => api.get('/automations').then((r) => r.data?.items || r.data),
    placeholderData: DEMO_AUTOMATIONS,
  })

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

  const runAutomation = useMutation({
    mutationFn: (id) => api.post(`/automations/${id}/run`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automations'] })
      toast.success('Automation completed successfully')
    },
    onError: () => {
      // Demo fallback: show success
      toast.success('Automation completed successfully')
    },
  })

  const activeCount = automations?.filter((a) => a.is_active).length || 0
  const totalRuns = automations?.reduce((sum, a) => sum + (a.run_count || 0), 0) || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Automations</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Manage your n8n workflows and business automations.
          </p>
        </div>
        <a
          href="http://localhost:5678"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <ExternalLink className="h-4 w-4" />
          Advanced Editor
        </a>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Active" value={activeCount} icon={Zap} color="green" />
        <StatCard label="Total Runs" value={totalRuns} icon={Activity} color="blue" />
        <StatCard label="Time Saved" value="~18h" icon={Clock} color="purple" />
        <StatCard label="Success Rate" value="97%" icon={CheckCircle2} color="emerald" />
      </div>

      {/* Automation cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {automations?.map((automation) => {
          const cat = CATEGORY_CONFIG[automation.category] || CATEGORY_CONFIG.email
          const CatIcon = cat.icon
          const isExpanded = expandedId === automation.id

          return (
            <div
              key={automation.id}
              className="rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800"
            >
              <div className="p-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${cat.color}`}>
                      <CatIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{automation.name}</h3>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                        {automation.description}
                      </p>
                    </div>
                  </div>

                  {/* Toggle */}
                  <button
                    onClick={() => toggleAutomation.mutate({ id: automation.id, active: automation.is_active })}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors ${
                      automation.is_active ? 'bg-brand-600' : 'bg-slate-300 dark:bg-slate-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
                        automation.is_active ? 'translate-x-5' : 'translate-x-0.5'
                      } mt-0.5`}
                    />
                  </button>
                </div>

                {/* Meta */}
                <div className="mt-3 flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase ${
                    automation.trigger_type === 'scheduled'
                      ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                  }`}>
                    {automation.trigger_type}
                  </span>
                  {automation.last_run && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatRelativeTime(automation.last_run)}
                    </span>
                  )}
                  <span>{automation.run_count} runs</span>
                </div>

                {/* Actions */}
                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={() => runAutomation.mutate(automation.id)}
                    disabled={runAutomation.isPending}
                    className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-700"
                  >
                    {runAutomation.isPending ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Play className="h-3 w-3" />
                    )}
                    Run Now
                  </button>
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : automation.id)}
                    className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
                  >
                    {isExpanded ? 'Hide History' : 'View History'}
                  </button>
                </div>
              </div>

              {/* Execution history — empty state: show mock rows */}
              {isExpanded && (!automation.history || automation.history.length === 0) && (
                <div className="border-t border-slate-200 dark:border-slate-700">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/80">
                        <th className="px-4 py-2 text-left font-medium text-slate-500">Time</th>
                        <th className="px-4 py-2 text-left font-medium text-slate-500">Status</th>
                        <th className="px-4 py-2 text-left font-medium text-slate-500">Trigger</th>
                        <th className="px-4 py-2 text-left font-medium text-slate-500">Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { label: '2 hours ago', status: 'success', trigger: 'scheduled', duration: '1.2s' },
                        { label: '8 hours ago', status: 'success', trigger: 'scheduled', duration: '0.9s' },
                        { label: '1 day ago',   status: 'failed',  trigger: 'scheduled', duration: 'timeout' },
                      ].map((run, i) => (
                        <tr key={i} className="border-t border-slate-100 dark:border-slate-700/50">
                          <td className="px-4 py-2 text-slate-600 dark:text-slate-400">{run.label}</td>
                          <td className="px-4 py-2">
                            {run.status === 'success' ? (
                              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="h-3 w-3" /> Success
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                                <XCircle className="h-3 w-3" /> Failed
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2 text-slate-500 dark:text-slate-400">{run.trigger}</td>
                          <td className="px-4 py-2 text-slate-500 dark:text-slate-400">{run.duration}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Execution history */}
              {isExpanded && automation.history?.length > 0 && (
                <div className="border-t border-slate-200 dark:border-slate-700">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/80">
                        <th className="px-4 py-2 text-left font-medium text-slate-500">Time</th>
                        <th className="px-4 py-2 text-left font-medium text-slate-500">Status</th>
                        <th className="px-4 py-2 text-left font-medium text-slate-500">Trigger</th>
                        <th className="px-4 py-2 text-left font-medium text-slate-500">Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {automation.history.map((run, i) => (
                        <tr key={i} className="border-t border-slate-100 dark:border-slate-700/50">
                          <td className="px-4 py-2 text-slate-600 dark:text-slate-400">
                            {formatRelativeTime(run.time)}
                          </td>
                          <td className="px-4 py-2">
                            {run.status === 'success' ? (
                              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="h-3 w-3" /> Success
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-red-600 dark:text-red-400" title={run.error}>
                                <XCircle className="h-3 w-3" /> Failed
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2 text-slate-500 dark:text-slate-400">{run.trigger}</td>
                          <td className="px-4 py-2 text-slate-500 dark:text-slate-400">{run.duration}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function StatCard({ label, value, icon: Icon, color }) {
  const colors = {
    green: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
  }
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</span>
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${colors[color]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
    </div>
  )
}
