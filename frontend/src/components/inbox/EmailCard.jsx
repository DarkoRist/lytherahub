import { Star, MessageCircle } from 'lucide-react'
import { classNames, getInitials, truncate } from '../../utils/helpers'
import { formatRelativeTime } from '../../utils/formatters'

const CATEGORY_STYLES = {
  urgent: {
    badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    avatar: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  },
  client: {
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    avatar: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  },
  invoice: {
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    avatar: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  },
  newsletter: {
    badge: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    avatar: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  },
  spam: {
    badge: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400',
    avatar: 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400',
  },
  other: {
    badge: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
    avatar: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
  },
}

function getCategoryStyle(category) {
  return CATEGORY_STYLES[category] || CATEGORY_STYLES.other
}

export default function EmailCard({ email, selected, onSelect }) {
  const style = getCategoryStyle(email.category)
  const isUnread = !email.is_read

  return (
    <button
      onClick={() => onSelect(email)}
      className={classNames(
        'group w-full cursor-pointer border-l-3 p-3 text-left transition-colors',
        selected
          ? 'border-l-indigo-500 bg-indigo-50 dark:bg-indigo-950/30'
          : isUnread
            ? 'border-l-blue-400 bg-white hover:bg-slate-50 dark:border-l-blue-500 dark:bg-slate-900 dark:hover:bg-slate-800'
            : 'border-l-transparent bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800'
      )}
    >
      <div className="flex gap-3">
        {/* Avatar */}
        <div
          className={classNames(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
            style.avatar
          )}
        >
          {getInitials(email.sender_name || email.from || '??')}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {/* Top row: sender + time */}
          <div className="flex items-center justify-between gap-2">
            <span
              className={classNames(
                'truncate text-sm',
                isUnread
                  ? 'font-semibold text-slate-900 dark:text-white'
                  : 'font-medium text-slate-700 dark:text-slate-300'
              )}
            >
              {email.sender_name || email.from}
            </span>
            <span className="shrink-0 text-xs text-slate-400 dark:text-slate-500">
              {formatRelativeTime(email.date || email.received_at)}
            </span>
          </div>

          {/* Subject */}
          <p
            className={classNames(
              'mt-0.5 truncate text-sm',
              isUnread
                ? 'font-semibold text-slate-800 dark:text-slate-100'
                : 'text-slate-700 dark:text-slate-300'
            )}
          >
            {email.subject}
          </p>

          {/* AI summary snippet */}
          <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
            {truncate(email.ai_summary || email.snippet || '', 80)}
          </p>

          {/* Bottom row: category badge + star + needs-reply */}
          <div className="mt-1.5 flex items-center gap-2">
            <span
              className={classNames(
                'inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                style.badge
              )}
            >
              {email.category}
            </span>

            {/* Unread dot */}
            {isUnread && (
              <span className="h-2 w-2 rounded-full bg-blue-500" title="Unread" />
            )}

            <div className="flex-1" />

            {/* Needs reply indicator */}
            {email.needs_reply && (
              <span
                className="flex items-center gap-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400"
                title="Needs reply"
              >
                <MessageCircle className="h-3 w-3" />
              </span>
            )}

            {/* Star toggle */}
            <Star
              className={classNames(
                'h-3.5 w-3.5 transition-colors',
                email.is_starred
                  ? 'fill-amber-400 text-amber-400'
                  : 'text-slate-300 group-hover:text-slate-400 dark:text-slate-600 dark:group-hover:text-slate-500'
              )}
            />
          </div>
        </div>
      </div>
    </button>
  )
}
