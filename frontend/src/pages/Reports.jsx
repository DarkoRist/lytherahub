import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart3,
  Calendar,
  ChevronDown,
  Clock,
  FileText,
  Loader2,
  Mail,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import toast from 'react-hot-toast'
import api from '../api/client'
import { formatDate } from '../utils/formatters'

// ---------------------------------------------------------------------------
// Demo data
// ---------------------------------------------------------------------------

const DEMO_BRIEFING = {
  id: 'br-1',
  type: 'daily',
  title: 'Morning Briefing — February 17, 2026',
  content: {
    summary: "📧 12 new emails — 3 urgent (Frank Hartmann, Hans Weber, Dr. Vogel), 2 client inquiries, 4 invoice-related, 3 newsletters. 3 emails need replies.\n\n📅 2 meetings today — 10:00 AM Team Standup, 3:00 PM Client Call with Hans Weber (TechVision). Prep brief ready for Hans call.\n\n💰 EUR 34,000 outstanding across 6 invoices. EUR 8,500 overdue (2 invoices). 3 payments expected this week totaling EUR 12,300.\n\n👥 Pipeline: 1 new lead added (TouchMedia GmbH). SecureNet Cyber moved to Negotiation stage. 3 leads stale (7+ days no contact).",
    priorities: [
      'Reply to Frank Hartmann\'s urgent IoT dashboard email',
      'Prepare for Hans Weber client call at 3 PM — review open invoice EUR 3,200',
      'Follow up on CloudFirst AG overdue invoice (EUR 5,200, 14 days late)',
    ],
    metrics: {
      emails_unread: 12,
      emails_urgent: 3,
      meetings_today: 2,
      tasks_due: 5,
      invoices_overdue: 2,
      overdue_amount: 8500,
    },
  },
  created_at: new Date().toISOString(),
}

const DEMO_REPORTS = [
  { id: 'r1', type: 'daily', title: 'Morning Briefing — Feb 17', created_at: '2026-02-17T08:00:00Z', content: { summary: '📧 Emails: 12 received, 8 read, 3 urgent replied. 📅 Meetings: 2 held (Standup, TechVision call). 💰 Revenue: €4,200 collected, 1 new invoice sent. ✅ Tasks: 3 completed, 2 created by AI. 🎯 Wins: SecureNet moved to Negotiation, new lead TouchMedia added.' } },
  { id: 'r2', type: 'daily', title: 'Morning Briefing — Feb 14', created_at: '2026-02-14T08:00:00Z', content: { summary: 'Quiet Friday. 1 urgent email (Sarah Mitchell, decision needed). 1 meeting at 2 PM. All invoices current. TechVision proposal deadline today.' } },
  { id: 'r3', type: 'daily', title: 'Morning Briefing — Feb 13', created_at: '2026-02-13T08:00:00Z', content: { summary: '2 client inquiries from NovaTech and SecureNet. No meetings. EUR 5,200 payment received from DataSync. Pipeline healthy.' } },
  { id: 'r4', type: 'weekly', title: 'Weekly Summary — Feb 10–16', created_at: '2026-02-16T08:00:00Z', content: { summary: '📧 Emails: 42 handled, 6 urgent replied, 12 newsletters archived. 📅 Meetings: 8 total, 3 client calls, 2 strategy sessions. 💰 Revenue: EUR 22,000 collected, 3 invoices sent. ✅ Tasks: 18 completed, 4 created by AI. 👥 Pipeline: 2 new leads added, 1 deal closed (FinTech Solutions). Win rate: 80%.' } },
  { id: 'r5', type: 'weekly', title: 'Weekly Summary — Feb 3–9', created_at: '2026-02-09T08:00:00Z', content: { summary: '35 emails handled, 6 meetings, EUR 18,500 collected. FinTech Solutions deal closed (EUR 22K). 1 lead lost (LogiTrans).' } },
  { id: 'r6', type: 'monthly', title: 'Monthly Report — January 2026', created_at: '2026-02-01T08:00:00Z', content: { summary: '📧 Emails: 180 classified by AI, 45 urgent handled, 12 replied automatically. 💰 Revenue: EUR 33,800 (+12% MoM), 3 new clients acquired. 🤖 Automations: 4 workflows saved ~15 hours of manual work. 📈 Pipeline value grew 18%. Net margin improved to 32%. Top performer: FinTech Solutions account (EUR 62K ARR).' } },
  { id: 'r7', type: 'monthly', title: 'Monthly Report — December 2025', created_at: '2026-01-01T08:00:00Z', content: { summary: 'Revenue: EUR 29,400. Holiday season reduced activity 20%. 2 clients in negotiation (CloudFirst, BioPharm). 5 automations deployed.' } },
]

const EXPANDED_CONTENT = {
  daily: '📧 Emails: 12 received, 8 read, 3 urgent replied. 📅 Meetings: 2 held (Standup, TechVision call). 💰 Revenue: €4,200 collected, 1 new invoice sent. ✅ Tasks: 3 completed, 2 created by AI. 🎯 Wins: SecureNet moved to Negotiation, new lead TouchMedia added.',
  weekly: '📧 Emails: 42 handled, 6 urgent replied, 12 newsletters archived. 📅 Meetings: 8 total, 3 client calls, 2 strategy sessions. 💰 Revenue: EUR 22,000 collected, 3 invoices sent. ✅ Tasks: 18 completed, 4 created by AI. 👥 Pipeline: 2 new leads added, 1 deal closed (FinTech Solutions). Win rate: 80%.',
  monthly: '📧 Emails: 180 classified by AI, 45 urgent handled, 12 replied automatically. 💰 Revenue: EUR 33,800 (+12% MoM), 3 new clients acquired. 🤖 Automations: 4 workflows saved ~15 hours of manual work. 📈 Pipeline value grew 18%. Net margin improved to 32%. Top performer: FinTech Solutions account (EUR 62K ARR).',
}

const DEMO_METRICS = {
  emails: [
    { period: 'Mon', sent: 8, received: 15 },
    { period: 'Tue', sent: 12, received: 22 },
    { period: 'Wed', sent: 6, received: 18 },
    { period: 'Thu', sent: 10, received: 14 },
    { period: 'Fri', sent: 15, received: 20 },
    { period: 'Sat', sent: 2, received: 5 },
    { period: 'Sun', sent: 0, received: 3 },
  ],
  revenue: [
    { month: 'Sep', value: 28000 },
    { month: 'Oct', value: 35000 },
    { month: 'Nov', value: 42000 },
    { month: 'Dec', value: 31000 },
    { month: 'Jan', value: 41300 },
    { month: 'Feb', value: 40500 },
  ],
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getTitleForType(type) {
  const now = new Date()
  const time = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  if (type === 'daily') {
    return `Morning Briefing — ${now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} (${time})`
  }
  if (type === 'weekly') {
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay() + 1)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    return `Weekly Business Report — ${weekStart.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}–${weekEnd.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} (${time})`
  }
  return `Monthly Report — ${now.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })} (${time})`
}

// ---------------------------------------------------------------------------
// Reports Page
// ---------------------------------------------------------------------------

export default function Reports() {
  const [activeTab, setActiveTab] = useState('daily')
  const [expandedId, setExpandedId] = useState(null)
  const [reports, setReports] = useState(DEMO_REPORTS)
  const [generating, setGenerating] = useState(false)

  const { data: briefing } = useQuery({
    queryKey: ['reports-briefing'],
    queryFn: async () => {
      try {
        return (await api.get('/reports/briefing')).data
      } catch {
        return DEMO_BRIEFING
      }
    },
    placeholderData: DEMO_BRIEFING,
  })

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const res = await api.post(`/reports/generate/${activeTab}`)
      const newReport = {
        id: `r-${Date.now()}`,
        type: activeTab,
        title: res.data?.title || getTitleForType(activeTab),
        created_at: new Date().toISOString(),
        content: res.data?.content || { summary: EXPANDED_CONTENT[activeTab] },
      }
      setReports((prev) => [newReport, ...prev])
      toast.success('Report generated')
    } catch {
      // Demo mode: simulate generation delay then add locally
      await new Promise((r) => setTimeout(r, 1500))
      const newReport = {
        id: `r-${Date.now()}`,
        type: activeTab,
        title: getTitleForType(activeTab),
        created_at: new Date().toISOString(),
        content: { summary: EXPANDED_CONTENT[activeTab] },
      }
      setReports((prev) => [newReport, ...prev])
      toast.success('Report generated')
    } finally {
      setGenerating(false)
    }
  }

  const filteredReports = reports.filter((r) => r.type === activeTab)

  const tabs = [
    { key: 'daily', label: 'Daily Briefing', icon: Clock },
    { key: 'weekly', label: 'Weekly', icon: Calendar },
    { key: 'monthly', label: 'Monthly', icon: BarChart3 },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Reports</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            AI-generated business intelligence and insights.
          </p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {generating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          Generate {activeTab === 'daily' ? 'Daily' : activeTab === 'weekly' ? 'Weekly' : 'Monthly'} Report
        </button>
      </div>

      {/* Today's briefing hero — always renders with hardcoded fallback */}
      <div className="rounded-xl border border-brand-200 bg-gradient-to-br from-brand-50 to-blue-50 p-6 dark:border-brand-800 dark:from-brand-900/20 dark:to-blue-900/20">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-5 w-5 text-brand-600 dark:text-brand-400" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {briefing?.title || 'Morning Briefing — February 17, 2026'}
          </h2>
        </div>
        <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
          {briefing?.content?.summary ||
            '📧 12 new emails (3 urgent) · 📅 2 meetings today · 💰 EUR 34K outstanding · ✅ 5 tasks due · Top priority: Reply to Frank Hartmann'}
        </div>

        {(briefing?.content?.priorities?.length ?? 0) > 0 && (
          <div className="mt-4">
            <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
              Top Priorities
            </h4>
            <ol className="space-y-1.5">
              {briefing.content.priorities.map((p, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-600 text-[10px] font-bold text-white">
                    {i + 1}
                  </span>
                  {p}
                </li>
              ))}
            </ol>
          </div>
        )}

        {briefing?.content?.metrics && (
          <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-6">
            <MiniMetric icon={Mail} label="Unread" value={briefing.content.metrics.emails_unread} />
            <MiniMetric icon={Mail} label="Urgent" value={briefing.content.metrics.emails_urgent} color="red" />
            <MiniMetric icon={Calendar} label="Meetings" value={briefing.content.metrics.meetings_today} />
            <MiniMetric icon={FileText} label="Tasks Due" value={briefing.content.metrics.tasks_due} />
            <MiniMetric icon={TrendingUp} label="Overdue" value={briefing.content.metrics.invoices_overdue} color="red" />
            <MiniMetric icon={TrendingUp} label="Overdue €" value={`€${(briefing.content.metrics.overdue_amount / 1000).toFixed(1)}k`} color="red" />
          </div>
        )}
      </div>

      {/* Key metrics */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Email Volume (This Week)</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={DEMO_METRICS.emails}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="period" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="received" name="Received" fill="#93c5fd" radius={[3, 3, 0, 0]} />
                <Bar dataKey="sent" name="Sent" fill="#3b82f6" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Revenue Trend (6 Months)</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={DEMO_METRICS.revenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => [`€${v.toLocaleString()}`, 'Revenue']} contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4, fill: '#3b82f6' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Report tabs + history */}
      <div>
        <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-700">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === key
                  ? 'border-brand-600 text-brand-600 dark:text-brand-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-3">
          {filteredReports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-10 w-10 text-slate-300 dark:text-slate-600" />
              <p className="mt-2 text-sm font-medium text-slate-500">No {activeTab} reports yet</p>
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="mt-3 flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Generate First Report
              </button>
            </div>
          ) : (
            filteredReports.map((report) => (
              <div
                key={report.id}
                className="rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 overflow-hidden"
              >
                <button
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                  onClick={() => setExpandedId(expandedId === report.id ? null : report.id)}
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-slate-400" />
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">{report.title}</h4>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-xs text-slate-400">{formatDate(report.created_at)}</span>
                    <ChevronDown
                      className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${
                        expandedId === report.id ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </button>
                {expandedId === report.id && (
                  <div className="px-4 pb-4 text-sm text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-700 pt-3 leading-relaxed">
                    {report.content?.summary}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function MiniMetric({ icon: Icon, label, value, color = 'blue' }) {
  const colors = {
    blue: 'text-blue-600 dark:text-blue-400',
    red: 'text-red-600 dark:text-red-400',
  }
  return (
    <div className="text-center">
      <div className={`text-lg font-bold ${colors[color]}`}>{value}</div>
      <div className="flex items-center justify-center gap-1 mt-0.5">
        <Icon className="h-3 w-3 text-slate-400" />
        <span className="text-[10px] text-slate-500 dark:text-slate-400">{label}</span>
      </div>
    </div>
  )
}
