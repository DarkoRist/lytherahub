import { Star, MessageCircle, Flag, ClipboardList } from 'lucide-react'
import { classNames, getInitials, truncate } from '../../utils/helpers'
import { formatRelativeTime } from '../../utils/formatters'

// Converts an email address into a human-readable display name.
// Handles system/noreply addresses by using the domain name instead.
function extractNameFromAddr(addr) {
  if (!addr || !addr.includes('@')) return null
  const local = addr.split('@')[0]
  if (['noreply', 'no-reply', 'notifications', 'newsletter', 'calendar', 'digest', 'billing'].includes(local.toLowerCase())) {
    const domain = addr.split('@')[1]?.split('.')[0] || ''
    return domain.charAt(0).toUpperCase() + domain.slice(1)
  }
  // "anna.schmidt" → "Anna Schmidt", "k.richter" → "K Richter"
  return local
    .split(/[._-]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

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

const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
  'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
  'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
]

function getAvatarColor(name) {
  if (!name) return AVATAR_COLORS[0]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

export default function EmailCard({ email, selected, onSelect, hasTask, followUpDate }) {
  const style = getCategoryStyle(email.category)
  const isUnread = !email.is_read

  // Resolve sender display name from all possible field names (API and demo data)
  const senderDisplay =
    email.sender_name ||
    email.from_name ||
    email.sender ||
    (email.from && !email.from.includes('@') ? email.from : null) ||
    (email.from_addr && !email.from_addr.includes('@') ? email.from_addr : null) ||
    extractNameFromAddr(email.from_addr || email.from || '') ||
    ''

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
            getAvatarColor(senderDisplay)
          )}
        >
          {getInitials(senderDisplay) || senderDisplay.charAt(0).toUpperCase() || '?'}
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
              {senderDisplay || email.from}
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

            {/* Task badge */}
            {hasTask && (
              <span
                className="flex items-center gap-0.5 rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                title="Task created"
              >
                <ClipboardList className="h-3 w-3" />
                Task
              </span>
            )}

            {/* Follow-up flag */}
            {followUpDate && (
              <span
                className="flex items-center gap-0.5 text-[10px] font-medium text-orange-500 dark:text-orange-400"
                title={`Follow up: ${followUpDate.toLocaleDateString('en-GB')}`}
              >
                <Flag className="h-3 w-3 fill-orange-400" />
              </span>
            )}

            {/* Snooze badge */}
            {email.snoozedUntil && (
              <span
                className="flex items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                title={`Snoozed until ${new Date(email.snoozedUntil).toLocaleString('en-GB')}`}
              >
                ⏰ Snoozed
              </span>
            )}

            {/* Needs reply indicator */}
            {email.needs_reply && !hasTask && (
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
