import { Clock, MapPin, Users } from 'lucide-react'

const typeColors = {
  meeting: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    border: 'border-blue-300 dark:border-blue-700',
    text: 'text-blue-800 dark:text-blue-200',
    dot: 'bg-blue-500',
    pill: 'bg-blue-500 text-white',
  },
  call: {
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    border: 'border-emerald-300 dark:border-emerald-700',
    text: 'text-emerald-800 dark:text-emerald-200',
    dot: 'bg-emerald-500',
    pill: 'bg-emerald-500 text-white',
  },
  deadline: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    border: 'border-red-300 dark:border-red-700',
    text: 'text-red-800 dark:text-red-200',
    dot: 'bg-red-500',
    pill: 'bg-red-500 text-white',
  },
  personal: {
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    border: 'border-purple-300 dark:border-purple-700',
    text: 'text-purple-800 dark:text-purple-200',
    dot: 'bg-purple-500',
    pill: 'bg-purple-500 text-white',
  },
}

function getColors(type) {
  return typeColors[type] || typeColors.meeting
}

function formatTime(dateStr) {
  const d = new Date(dateStr)
  const h = d.getHours()
  const m = d.getMinutes()
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`
}

export default function EventCard({ event, compact = false }) {
  const colors = getColors(event.type || event.category)

  if (compact) {
    return (
      <div
        className={`group flex items-center gap-1.5 rounded px-2 py-0.5 text-xs font-medium cursor-pointer transition-all hover:opacity-80 ${colors.pill}`}
        title={`${event.title} - ${formatTime(event.start_time || event.start)}`}
      >
        <span className="truncate max-w-[120px]">{event.title}</span>
      </div>
    )
  }

  return (
    <div
      className={`group relative rounded-lg border p-2 cursor-pointer transition-all hover:shadow-md hover:-translate-y-px ${colors.bg} ${colors.border}`}
    >
      {/* Color bar left accent */}
      <div
        className={`absolute inset-y-0 left-0 w-1 rounded-l-lg ${colors.dot}`}
      />

      <div className="pl-2">
        {/* Title */}
        <p
          className={`text-sm font-semibold leading-tight truncate ${colors.text}`}
          title={event.title}
        >
          {event.title}
        </p>

        {/* Time */}
        <div className="mt-1 flex items-center gap-1">
          <Clock className={`h-3 w-3 shrink-0 ${colors.text} opacity-70`} />
          <span className={`text-xs ${colors.text} opacity-70`}>
            {formatTime(event.start_time || event.start)}
            {(event.end_time || event.end) &&
              ` - ${formatTime(event.end_time || event.end)}`}
          </span>
        </div>

        {/* Location */}
        {event.location && (
          <div className="mt-0.5 flex items-center gap-1">
            <MapPin className={`h-3 w-3 shrink-0 ${colors.text} opacity-70`} />
            <span
              className={`text-xs truncate ${colors.text} opacity-70`}
              title={event.location}
            >
              {event.location}
            </span>
          </div>
        )}

        {/* Attendees */}
        {event.attendees && event.attendees.length > 0 && (
          <div className="mt-0.5 flex items-center gap-1">
            <Users className={`h-3 w-3 shrink-0 ${colors.text} opacity-70`} />
            <span className={`text-xs ${colors.text} opacity-70`}>
              {event.attendees.length} attendee
              {event.attendees.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
