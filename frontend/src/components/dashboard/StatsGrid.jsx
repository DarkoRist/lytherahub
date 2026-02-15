import { useQuery } from '@tanstack/react-query'
import { Mail, Calendar, Receipt, Users, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import api from '../../api/client'
import { formatCurrency } from '../../utils/formatters'

const DEMO_STATS = {
  unread_emails: 12,
  today_meetings: 3,
  outstanding_invoices: 8450,
  active_clients: 24,
  trends: {
    emails: 5,
    meetings: -1,
    invoices: 12,
    clients: 3,
  },
}

const statCards = [
  {
    key: 'unread_emails',
    label: 'Unread Emails',
    icon: Mail,
    trendKey: 'emails',
    format: (v) => v,
    accent: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      icon: 'text-blue-600 dark:text-blue-400',
      iconBg: 'bg-blue-100 dark:bg-blue-800/30',
      trend: 'text-blue-600 dark:text-blue-400',
    },
  },
  {
    key: 'today_meetings',
    label: "Today's Meetings",
    icon: Calendar,
    trendKey: 'meetings',
    format: (v) => v,
    accent: {
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      icon: 'text-purple-600 dark:text-purple-400',
      iconBg: 'bg-purple-100 dark:bg-purple-800/30',
      trend: 'text-purple-600 dark:text-purple-400',
    },
  },
  {
    key: 'outstanding_invoices',
    label: 'Outstanding Invoices',
    icon: Receipt,
    trendKey: 'invoices',
    format: (v) => formatCurrency(v),
    accent: {
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      icon: 'text-amber-600 dark:text-amber-400',
      iconBg: 'bg-amber-100 dark:bg-amber-800/30',
      trend: 'text-amber-600 dark:text-amber-400',
    },
  },
  {
    key: 'active_clients',
    label: 'Active Clients',
    icon: Users,
    trendKey: 'clients',
    format: (v) => v,
    accent: {
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      icon: 'text-emerald-600 dark:text-emerald-400',
      iconBg: 'bg-emerald-100 dark:bg-emerald-800/30',
      trend: 'text-emerald-600 dark:text-emerald-400',
    },
  },
]

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
      <div className="flex items-center justify-between mb-4">
        <div className="h-10 w-10 rounded-xl bg-slate-200 animate-pulse dark:bg-slate-700" />
        <div className="h-4 w-16 rounded bg-slate-200 animate-pulse dark:bg-slate-700" />
      </div>
      <div className="h-8 w-24 rounded bg-slate-200 animate-pulse dark:bg-slate-700 mb-1" />
      <div className="h-4 w-32 rounded bg-slate-200 animate-pulse dark:bg-slate-700" />
    </div>
  )
}

function TrendIndicator({ value }) {
  if (value === 0 || value === undefined || value === null) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-medium text-slate-400 dark:text-slate-500">
        <Minus className="h-3 w-3" />
        0%
      </span>
    )
  }

  const isPositive = value > 0

  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-medium ${
        isPositive
          ? 'text-emerald-600 dark:text-emerald-400'
          : 'text-red-600 dark:text-red-400'
      }`}
    >
      {isPositive ? (
        <TrendingUp className="h-3 w-3" />
      ) : (
        <TrendingDown className="h-3 w-3" />
      )}
      {isPositive ? '+' : ''}
      {value}%
    </span>
  )
}

export default function StatsGrid() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => {
      const { data } = await api.get('/dashboard/stats')
      return data
    },
    staleTime: 2 * 60 * 1000,
    retry: 1,
    placeholderData: DEMO_STATS,
  })

  if (isLoading && !stats) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    )
  }

  const data = stats || DEMO_STATS
  const trends = data.trends || DEMO_STATS.trends

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {statCards.map((card) => {
        const Icon = card.icon
        const value = data[card.key] ?? DEMO_STATS[card.key]
        const trend = trends[card.trendKey] ?? 0

        return (
          <div
            key={card.key}
            className="group rounded-xl border border-slate-200 bg-white p-5 transition-all hover:shadow-md hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600"
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl transition-transform group-hover:scale-105 ${card.accent.iconBg}`}
              >
                <Icon className={`h-5 w-5 ${card.accent.icon}`} />
              </div>
              <TrendIndicator value={trend} />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {card.format(value)}
            </p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {card.label}
            </p>
          </div>
        )
      })}
    </div>
  )
}
