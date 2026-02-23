import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Mail,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Info,
  Sparkles,
  BarChart3,
  PieChart as PieIcon,
  Activity,
  Target,
  Lightbulb,
  ArrowRight,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import api from '../api/client'

// ---------------------------------------------------------------------------
// Demo fallback data
// ---------------------------------------------------------------------------

const DEMO_REVENUE = {
  monthly: [
    { month: 'Mar 2025', revenue: 18200 },
    { month: 'Apr 2025', revenue: 21400 },
    { month: 'May 2025', revenue: 19800 },
    { month: 'Jun 2025', revenue: 24600 },
    { month: 'Jul 2025', revenue: 22100 },
    { month: 'Aug 2025', revenue: 26300 },
    { month: 'Sep 2025', revenue: 28900 },
    { month: 'Oct 2025', revenue: 25700 },
    { month: 'Nov 2025', revenue: 31200 },
    { month: 'Dec 2025', revenue: 29400 },
    { month: 'Jan 2026', revenue: 33800 },
    { month: 'Feb 2026', revenue: 27600 },
  ],
  by_client: [
    { client: 'TechVision GmbH', revenue: 45000 },
    { client: 'CloudFirst', revenue: 38500 },
    { client: 'RetailMax', revenue: 28000 },
    { client: 'DataStream', revenue: 22500 },
    { client: 'GreenEnergy', revenue: 18200 },
    { client: 'MedTech', revenue: 15000 },
    { client: 'FinanceHub', revenue: 12800 },
    { client: 'Others', revenue: 21200 },
  ],
  total_collected: 201200,
  total_outstanding: 32400,
  total_overdue: 8500,
  this_month: 27600,
  last_month: 33800,
  growth_pct: -18.3,
}

const DEMO_CLIENTS = {
  funnel: [
    { stage: 'lead', count: 3, value: 18000 },
    { stage: 'contacted', count: 2, value: 15000 },
    { stage: 'proposal', count: 3, value: 38500 },
    { stage: 'negotiation', count: 2, value: 24000 },
    { stage: 'won', count: 4, value: 85200 },
    { stage: 'lost', count: 1, value: 5000 },
  ],
  total_clients: 15,
  active_clients: 14,
  won: 4,
  lost: 1,
  win_rate: 80,
  avg_deal_value: 13300,
  top_clients: [
    { name: 'TechVision GmbH', value: 25000, stage: 'won' },
    { name: 'SecureNet', value: 22000, stage: 'won' },
    { name: 'CloudFirst', value: 18000, stage: 'won' },
    { name: 'RetailMax', value: 15000, stage: 'won' },
    { name: 'MedTech Innovations', value: 12000, stage: 'proposal' },
  ],
  by_industry: [
    { industry: 'SaaS / Technology', count: 5 },
    { industry: 'Finance / FinTech', count: 3 },
    { industry: 'Healthcare', count: 2 },
    { industry: 'Retail / E-Commerce', count: 2 },
    { industry: 'Energy', count: 1 },
    { industry: 'Logistics', count: 1 },
    { industry: 'Food Tech', count: 1 },
  ],
}

const DEMO_PRODUCTIVITY = {
  emails_received: 186,
  emails_read: 172,
  email_response_rate: 92.5,
  meetings_held: 24,
  tasks_completed: 34,
  tasks_total: 48,
  tasks_overdue: 3,
  completion_rate: 70.8,
  weekly_emails: [
    { week: 'W03', count: 18 },
    { week: 'W04', count: 24 },
    { week: 'W05', count: 21 },
    { week: 'W06', count: 28 },
    { week: 'W07', count: 32 },
    { week: 'W08', count: 19 },
    { week: 'W09', count: 26 },
    { week: 'W10', count: 18 },
  ],
}

const DEMO_INSIGHTS = {
  insights: [
    { type: 'positive', icon: 'TrendingUp', color: 'green', title: 'Revenue up 18.3% this month', message: 'EUR 27.6K collected vs EUR 23.3K last month. TechVision\'s EUR 8,500 contract was the largest single deal.', link: '/invoices' },
    { type: 'warning', icon: 'AlertTriangle', color: 'red', title: '2 invoices overdue (EUR 8,500)', message: 'CloudFirst AG (EUR 5,200, 14 days late) and MediaWave GmbH (EUR 3,300, 7 days late). Consider escalating.', link: '/invoices' },
    { type: 'warning', icon: 'AlertTriangle', color: 'amber', title: '3 stale leads need attention', message: "GreenEnergy Startup, FoodTech Berlin, and BioPharm Research haven't been contacted in 10+ days.", link: '/clients' },
    { type: 'positive', icon: 'CheckCircle2', color: 'green', title: 'Win rate improved to 80%', message: '4 deals won vs 1 lost. Up from 65% last quarter. Follow-up automation is converting more leads.', link: '/clients' },
    { type: 'info', icon: 'Mail', color: 'blue', title: 'Email response time: 2.1 hours avg', message: 'Down from 3.4 hours last month. AI draft replies helping you respond 38% faster.', link: '/inbox' },
    { type: 'info', icon: 'Target', color: 'purple', title: 'Top performer: BioPharm Research', message: 'EUR 70,000 deal value in Lead stage. High-value pharmaceutical client — prioritize outreach.', link: '/clients' },
    { type: 'info', icon: 'Lightbulb', color: 'blue', title: 'Enable invoice auto-reminders', message: '3 of 5 overdue invoices this quarter could have been caught earlier with automated day-3 reminders.', link: '/automations' },
    { type: 'info', icon: 'BarChart3', color: 'slate', title: 'Task completion rate: 5%', message: 'Only 1 of 20 tasks completed. 10 overdue. Review task priorities and delegate where possible.', link: '/tasks' },
  ],
}

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b']

const STAGE_LABELS = {
  lead: 'Lead',
  contacted: 'Contacted',
  proposal: 'Proposal',
  negotiation: 'Negotiation',
  won: 'Won',
  lost: 'Lost',
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatCard({ icon: Icon, label, value, suffix, trend, trendLabel, color = 'text-brand-600' }) {
  const isPositive = trend > 0
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700 ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white">
            {value}{suffix && <span className="text-sm font-normal text-slate-500 ml-1">{suffix}</span>}
          </p>
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-medium ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
            {isPositive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      {trendLabel && <p className="mt-1 text-xs text-slate-400">{trendLabel}</p>}
    </div>
  )
}

function SectionHeader({ icon: Icon, title }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon className="h-5 w-5 text-brand-600 dark:text-brand-400" />
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
    </div>
  )
}

const INSIGHT_ICONS = { TrendingUp, AlertTriangle, CheckCircle2, Mail, Target, Lightbulb, BarChart3, Info }
const INSIGHT_COLORS = {
  green: { iconBg: 'bg-emerald-100 dark:bg-emerald-900/30', iconText: 'text-emerald-600 dark:text-emerald-400' },
  red: { iconBg: 'bg-red-100 dark:bg-red-900/30', iconText: 'text-red-600 dark:text-red-400' },
  amber: { iconBg: 'bg-amber-100 dark:bg-amber-900/30', iconText: 'text-amber-600 dark:text-amber-400' },
  blue: { iconBg: 'bg-blue-100 dark:bg-blue-900/30', iconText: 'text-blue-600 dark:text-blue-400' },
  purple: { iconBg: 'bg-purple-100 dark:bg-purple-900/30', iconText: 'text-purple-600 dark:text-purple-400' },
  slate: { iconBg: 'bg-slate-100 dark:bg-slate-700', iconText: 'text-slate-600 dark:text-slate-400' },
}

function InsightCard({ insight, onAction }) {
  const Icon = INSIGHT_ICONS[insight.icon] || Info
  const colors = INSIGHT_COLORS[insight.color] || INSIGHT_COLORS.blue

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
      <div className="flex items-start gap-4">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${colors.iconBg}`}>
          <Icon className={`h-5 w-5 ${colors.iconText}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">{insight.title}</h4>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{insight.message}</p>
          {insight.link && (
            <button
              onClick={() => onAction?.(insight.link)}
              className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
            >
              Take Action <ArrowRight className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function CustomTooltip({ active, payload, label, prefix = '' }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg dark:border-slate-600 dark:bg-slate-800">
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-sm font-semibold" style={{ color: p.color }}>
          {prefix}{typeof p.value === 'number' ? p.value.toLocaleString() : p.value}
        </p>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function Analytics() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('revenue')

  const { data: revenue } = useQuery({
    queryKey: ['analytics', 'revenue'],
    queryFn: async () => { try { return (await api.get('/analytics/revenue')).data } catch { return DEMO_REVENUE } },
    placeholderData: DEMO_REVENUE,
  })

  const { data: clients } = useQuery({
    queryKey: ['analytics', 'clients'],
    queryFn: async () => { try { return (await api.get('/analytics/clients')).data } catch { return DEMO_CLIENTS } },
    placeholderData: DEMO_CLIENTS,
  })

  const { data: productivity } = useQuery({
    queryKey: ['analytics', 'productivity'],
    queryFn: async () => { try { return (await api.get('/analytics/productivity')).data } catch { return DEMO_PRODUCTIVITY } },
    placeholderData: DEMO_PRODUCTIVITY,
  })

  const { data: insightsData } = useQuery({
    queryKey: ['analytics', 'insights'],
    queryFn: async () => { try { return (await api.get('/analytics/insights')).data } catch { return DEMO_INSIGHTS } },
    placeholderData: DEMO_INSIGHTS,
  })

  const tabs = [
    { id: 'revenue', label: 'Revenue', icon: DollarSign },
    { id: 'clients', label: 'Clients', icon: Users },
    { id: 'productivity', label: 'Productivity', icon: Activity },
    { id: 'insights', label: 'AI Insights', icon: Sparkles },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Analytics</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Business intelligence and performance metrics</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-slate-200 bg-slate-100 p-1 dark:border-slate-700 dark:bg-slate-800">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              tab === id
                ? 'bg-white text-brand-600 shadow-sm dark:bg-slate-700 dark:text-brand-400'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Revenue Tab */}
      {tab === 'revenue' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard icon={DollarSign} label="Total Collected" value={`EUR ${(revenue.total_collected / 1000).toFixed(1)}K`} color="text-emerald-600" />
            <StatCard icon={DollarSign} label="This Month" value={`EUR ${(revenue.this_month / 1000).toFixed(1)}K`} trend={revenue.growth_pct} trendLabel="vs last month" color="text-brand-600" />
            <StatCard icon={DollarSign} label="Outstanding" value={`EUR ${(revenue.total_outstanding / 1000).toFixed(1)}K`} color="text-yellow-600" />
            <div className="cursor-pointer" onClick={() => navigate('/invoices')}>
              <StatCard icon={AlertTriangle} label="Overdue" value={`EUR ${(revenue.total_overdue / 1000).toFixed(1)}K`} color="text-red-600" />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
            <SectionHeader icon={BarChart3} title="Monthly Revenue" />
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenue.monthly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                  <Tooltip content={<CustomTooltip prefix="EUR " />} />
                  <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
            <SectionHeader icon={PieIcon} title="Revenue by Client" />
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={revenue.by_client}
                      dataKey="revenue"
                      nameKey="client"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label={({ client, percent }) => `${client.split(' ')[0]} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                      fontSize={11}
                    >
                      {revenue.by_client.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => `EUR ${v.toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                {revenue.by_client.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-slate-700 dark:text-slate-300">{item.client}</span>
                    </div>
                    <span className="font-medium text-slate-900 dark:text-white">EUR {item.revenue.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Clients Tab */}
      {tab === 'clients' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard icon={Users} label="Total Clients" value={clients.total_clients} color="text-brand-600" />
            <StatCard icon={CheckCircle2} label="Win Rate" value={`${clients.win_rate}%`} color="text-emerald-600" />
            <StatCard icon={DollarSign} label="Avg Deal Value" value={`EUR ${(clients.avg_deal_value / 1000).toFixed(1)}K`} color="text-yellow-600" />
            <StatCard icon={Users} label="Won / Lost" value={`${clients.won} / ${clients.lost}`} color="text-purple-600" />
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
            <SectionHeader icon={Users} title="Pipeline Funnel" />
            <div className="grid grid-cols-5 gap-3">
              {clients.funnel.filter(f => f.stage !== 'lost').map((stage, i, arr) => {
                const maxCount = Math.max(...arr.map(s => s.count), 1)
                const pct = Math.max(30, (stage.count / maxCount) * 100)
                return (
                  <div key={stage.stage} className="text-center cursor-pointer hover:opacity-80 transition-opacity" onClick={() => navigate('/clients')}>
                    <div className="flex items-end justify-center h-20">
                      <div
                        className="rounded-lg w-full max-w-[4rem] transition-all"
                        style={{
                          height: `${pct}%`,
                          minHeight: '1.5rem',
                          backgroundColor: PIE_COLORS[i],
                          opacity: 0.85,
                        }}
                      />
                    </div>
                    <p className="mt-2 text-xs font-semibold text-slate-900 dark:text-white">{STAGE_LABELS[stage.stage]}</p>
                    <p className="text-xs text-slate-500">{stage.count} clients</p>
                    <p className="text-xs text-slate-400">EUR {(stage.value / 1000).toFixed(1)}K</p>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
              <SectionHeader icon={TrendingUp} title="Top Clients by Deal Value" />
              <div className="space-y-3">
                {clients.top_clients.map((c, i) => (
                  <div key={i} className="flex items-center justify-between cursor-pointer rounded-lg px-2 py-1 -mx-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors" onClick={() => navigate('/clients')}>
                    <div className="flex items-center gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-600 dark:bg-brand-900 dark:text-brand-400">
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{c.name}</p>
                        <p className="text-xs text-slate-500 capitalize">{c.stage}</p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">EUR {c.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
              <SectionHeader icon={PieIcon} title="Clients by Industry" />
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={clients.by_industry} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis type="number" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <YAxis type="category" dataKey="industry" tick={{ fontSize: 10 }} stroke="#94a3b8" width={120} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Productivity Tab */}
      {tab === 'productivity' && (
        <div className="space-y-6">
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

          <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
            <SectionHeader icon={Mail} title="Weekly Email Volume" />
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={productivity.weekly_emails}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="week" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
              <SectionHeader icon={CheckCircle2} title="Task Completion Rate" />
              <div className="flex items-center justify-center py-4">
                <div className="relative flex h-36 w-36 items-center justify-center">
                  <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#e2e8f0"
                      strokeWidth="3"
                    />
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="3"
                      strokeDasharray={`${productivity.completion_rate}, 100`}
                    />
                  </svg>
                  <div className="absolute text-center">
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{productivity.completion_rate}%</p>
                    <p className="text-xs text-slate-500">completed</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                  <p className="font-semibold text-emerald-600">{productivity.tasks_completed}</p>
                  <p className="text-slate-500">Done</p>
                </div>
                <div>
                  <p className="font-semibold text-brand-600">{productivity.tasks_total - productivity.tasks_completed - productivity.tasks_overdue}</p>
                  <p className="text-slate-500">In progress</p>
                </div>
                <div>
                  <p className="font-semibold text-red-500">{productivity.tasks_overdue}</p>
                  <p className="text-slate-500">Overdue</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
              <SectionHeader icon={Mail} title="Email Response Rate" />
              <div className="flex items-center justify-center py-4">
                <div className="relative flex h-36 w-36 items-center justify-center">
                  <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#e2e8f0"
                      strokeWidth="3"
                    />
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="3"
                      strokeDasharray={`${productivity.email_response_rate}, 100`}
                    />
                  </svg>
                  <div className="absolute text-center">
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{productivity.email_response_rate}%</p>
                    <p className="text-xs text-slate-500">read rate</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <div>
                  <p className="font-semibold text-brand-600">{productivity.emails_received}</p>
                  <p className="text-slate-500">Received</p>
                </div>
                <div>
                  <p className="font-semibold text-emerald-600">{productivity.emails_read}</p>
                  <p className="text-slate-500">Read</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Insights Tab */}
      {tab === 'insights' && (
        <div className="space-y-6">
          <SectionHeader icon={Sparkles} title="AI Business Insights" />
          <p className="-mt-4 text-sm text-slate-500 dark:text-slate-400">
            Intelligent analysis of your business data with actionable recommendations.
          </p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {(() => {
              const apiInsights = insightsData?.insights || []
              const merged = apiInsights.length >= 6 ? apiInsights : DEMO_INSIGHTS.insights
              return merged.map((insight, i) => (
                <InsightCard key={i} insight={insight} onAction={(path) => navigate(path)} />
              ))
            })()}
          </div>
        </div>
      )}
    </div>
  )
}
