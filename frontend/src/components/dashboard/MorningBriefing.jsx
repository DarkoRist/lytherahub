import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  Sunrise,
  Sparkles,
  Mail,
  Calendar,
  Receipt,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  Send,
} from 'lucide-react'
import api from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

const actionIcons = {
  email: Mail,
  meeting: Calendar,
  invoice: Receipt,
  follow_up: Send,
  review: CheckCircle2,
  deadline: Clock,
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function SkeletonLoader() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 rounded-xl bg-slate-200 animate-pulse dark:bg-slate-700" />
        <div className="space-y-2 flex-1">
          <div className="h-5 w-64 rounded bg-slate-200 animate-pulse dark:bg-slate-700" />
          <div className="h-4 w-40 rounded bg-slate-200 animate-pulse dark:bg-slate-700" />
        </div>
      </div>
      <div className="space-y-2 mb-6">
        <div className="h-4 w-full rounded bg-slate-200 animate-pulse dark:bg-slate-700" />
        <div className="h-4 w-5/6 rounded bg-slate-200 animate-pulse dark:bg-slate-700" />
        <div className="h-4 w-3/4 rounded bg-slate-200 animate-pulse dark:bg-slate-700" />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 rounded-xl bg-slate-100 animate-pulse dark:bg-slate-700/50"
          />
        ))}
      </div>
    </div>
  )
}

export default function MorningBriefing() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const firstName = user?.name?.split(' ')[0] || 'there'

  const {
    data: briefing,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['dashboard', 'briefing'],
    queryFn: async () => {
      const { data } = await api.get('/dashboard/briefing')
      return data
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })

  const handleAction = (action) => {
    const routes = {
      email: '/inbox',
      meeting: '/calendar',
      invoice: '/invoices',
      follow_up: '/clients',
      review: '/tasks',
      deadline: '/tasks',
    }
    const route = routes[action.type] || '/dashboard'
    navigate(route)
    toast.success(`Navigating to ${action.label || action.type}`)
  }

  if (isLoading) return <SkeletonLoader />

  if (isError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-800/50 dark:bg-red-900/20">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-6 w-6 text-red-500" />
          <div className="flex-1">
            <h3 className="font-semibold text-red-800 dark:text-red-300">
              Could not load your morning briefing
            </h3>
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">
              {error?.message || 'Something went wrong. Please try again.'}
            </p>
          </div>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 rounded-lg bg-red-100 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-200 transition-colors dark:bg-red-800/30 dark:text-red-300 dark:hover:bg-red-800/50"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      </div>
    )
  }

  const summary = briefing?.summary || `${getGreeting()}, ${firstName}. Welcome back to your dashboard.`
  const priorities = briefing?.priorities?.length > 0 ? briefing.priorities : [
    { type: 'email', title: 'Reply to 3 urgent emails', description: 'Check your inbox for urgent messages', urgency: 'high', action_label: 'Go to Inbox' },
    { type: 'invoice', title: 'Follow up on EUR 8,500 overdue', description: 'Send payment reminder to overdue clients', urgency: 'high', action_label: 'View Invoices' },
    { type: 'meeting', title: 'Prepare for 1 meeting today', description: 'Review meeting prep briefs', urgency: 'medium', action_label: 'View Calendar' },
  ]

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
      {/* Gradient accent top border */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400" />

      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30">
              <Sunrise className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                {getGreeting()}, {firstName}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {new Date().toLocaleDateString('en-GB', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 rounded-full bg-violet-50 px-3 py-1 dark:bg-violet-900/20">
            <Sparkles className="h-3.5 w-3.5 text-violet-500" />
            <span className="text-xs font-medium text-violet-600 dark:text-violet-400">
              AI Briefing
            </span>
          </div>
        </div>

        {/* AI Summary */}
        <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-6">
          {summary}
        </p>

        {/* Priority Actions */}
        {priorities.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 dark:text-slate-400">
              Priority Actions
            </h3>
            <div className="grid gap-3 sm:grid-cols-3">
              {priorities.slice(0, 3).map((item, index) => {
                const Icon = actionIcons[item.type] || CheckCircle2
                const urgencyColors = {
                  high: 'border-red-200 bg-red-50 dark:border-red-800/40 dark:bg-red-900/20',
                  medium: 'border-amber-200 bg-amber-50 dark:border-amber-800/40 dark:bg-amber-900/20',
                  low: 'border-emerald-200 bg-emerald-50 dark:border-emerald-800/40 dark:bg-emerald-900/20',
                }
                const urgencyIconColors = {
                  high: 'text-red-500',
                  medium: 'text-amber-500',
                  low: 'text-emerald-500',
                }
                const urgency = item.urgency || 'medium'

                return (
                  <div
                    key={index}
                    onClick={() => handleAction(item)}
                    className={`group cursor-pointer rounded-xl border p-4 transition-all hover:shadow-md ${urgencyColors[urgency]}`}
                  >
                    <div className="flex items-start gap-3">
                      <Icon
                        className={`mt-0.5 h-5 w-5 shrink-0 ${urgencyIconColors[urgency]}`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 line-clamp-2">
                          {item.title}
                        </p>
                        {item.description && (
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>
                    {item.action_label && (
                      <button
                        onClick={() => handleAction(item)}
                        className="mt-3 flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
                      >
                        {item.action_label}
                        <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
