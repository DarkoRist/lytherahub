import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  Mail,
  Calendar,
  Receipt,
  Users,
  Zap,
  FileText,
  ArrowRight,
  Clock,
  RefreshCw,
  Inbox,
} from 'lucide-react'
import api from '../../api/client'
import { formatRelativeTime } from '../../utils/formatters'

const DEMO_ACTIVITIES = [
  {
    id: 1,
    type: 'email',
    description: 'AI classified 12 new emails',
    timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
  },
  {
    id: 2,
    type: 'meeting',
    description: 'Meeting prep generated for Hans Schmidt call',
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
  {
    id: 3,
    type: 'invoice',
    description: 'Invoice #1024 payment received \u2014 \u20AC2,400',
    timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  },
  {
    id: 4,
    type: 'client',
    description: 'New lead: TechVision GmbH added to pipeline',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 5,
    type: 'invoice',
    description: 'Payment reminder sent to CloudFirst Solutions',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 6,
    type: 'automation',
    description: 'Weekly report generated',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 7,
    type: 'meeting',
    description: 'Calendar synced \u2014 3 new events',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 8,
    type: 'client',
    description: 'Client enrichment completed for DataFlow AG',
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
  },
]

const typeConfig = {
  email: {
    icon: Mail,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-l-blue-400',
  },
  meeting: {
    icon: Calendar,
    color: 'text-purple-500',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    borderColor: 'border-l-purple-400',
  },
  invoice: {
    icon: Receipt,
    color: 'text-amber-500',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    borderColor: 'border-l-amber-400',
  },
  client: {
    icon: Users,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
    borderColor: 'border-l-emerald-400',
  },
  automation: {
    icon: Zap,
    color: 'text-violet-500',
    bgColor: 'bg-violet-50 dark:bg-violet-900/20',
    borderColor: 'border-l-violet-400',
  },
  report: {
    icon: FileText,
    color: 'text-rose-500',
    bgColor: 'bg-rose-50 dark:bg-rose-900/20',
    borderColor: 'border-l-rose-400',
  },
}

function getTypeConfig(type) {
  return typeConfig[type] || typeConfig.automation
}

function SkeletonItem() {
  return (
    <div className="flex items-start gap-3 rounded-lg p-3">
      <div className="h-8 w-8 shrink-0 rounded-lg bg-slate-200 animate-pulse dark:bg-slate-700" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-3/4 rounded bg-slate-200 animate-pulse dark:bg-slate-700" />
        <div className="h-3 w-20 rounded bg-slate-200 animate-pulse dark:bg-slate-700" />
      </div>
    </div>
  )
}

export default function ActivityFeed() {
  const {
    data: activities,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['dashboard', 'activity'],
    queryFn: async () => {
      const { data } = await api.get('/dashboard/activity')
      return data
    },
    staleTime: 60 * 1000,
    retry: 1,
    placeholderData: DEMO_ACTIVITIES,
  })

  const items = activities || DEMO_ACTIVITIES

  return (
    <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Recent Activity
          </h3>
        </div>
        {isError && (
          <button
            onClick={() => refetch()}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <RefreshCw className="h-3 w-3" />
            Retry
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-2">
        {isLoading && !items.length ? (
          <div className="space-y-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <SkeletonItem key={i} />
            ))}
          </div>
        ) : items.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700">
              <Inbox className="h-6 w-6 text-slate-400" />
            </div>
            <p className="mt-3 text-sm font-medium text-slate-600 dark:text-slate-400">
              No recent activity
            </p>
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
              Activity will appear here as you use LytheraHub
            </p>
          </div>
        ) : (
          /* Activity List */
          <div className="space-y-0.5">
            {items.map((activity, index) => {
              const config = getTypeConfig(activity.type)
              const Icon = config.icon

              return (
                <div
                  key={activity.id || index}
                  className={`flex items-start gap-3 rounded-lg border-l-2 p-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/50 ${config.borderColor}`}
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${config.bgColor}`}
                  >
                    <Icon className={`h-4 w-4 ${config.color}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-snug">
                      {activity.description}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                      {formatRelativeTime(activity.timestamp)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {items.length > 0 && (
        <div className="border-t border-slate-100 px-5 py-3 dark:border-slate-700">
          <Link
            to="/analytics"
            className="group flex items-center justify-center gap-1 text-sm font-medium text-slate-500 hover:text-violet-600 dark:text-slate-400 dark:hover:text-violet-400 transition-colors"
          >
            View all activity
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      )}
    </div>
  )
}
