import { useMemo } from 'react'
import EventCard from './EventCard'

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8) // 8am - 8pm
const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MONTH_DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function formatHour(hour) {
  if (hour === 0 || hour === 12) return `12 ${hour < 12 ? 'AM' : 'PM'}`
  return `${hour > 12 ? hour - 12 : hour} ${hour >= 12 ? 'PM' : 'AM'}`
}

function isSameDay(d1, d2) {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  )
}

function getWeekDays(date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day // Adjust so Monday is first
  const monday = new Date(d)
  monday.setDate(d.getDate() + diff)
  monday.setHours(0, 0, 0, 0)

  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(monday)
    day.setDate(monday.getDate() + i)
    return day
  })
}

function getMonthDays(date) {
  const year = date.getFullYear()
  const month = date.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  // Find the Monday on or before the first of the month
  const startDay = new Date(firstDay)
  const dayOfWeek = startDay.getDay()
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  startDay.setDate(startDay.getDate() + diff)

  const days = []
  const current = new Date(startDay)
  // Generate 6 weeks (42 days)
  for (let i = 0; i < 42; i++) {
    days.push(new Date(current))
    current.setDate(current.getDate() + 1)
  }
  return days
}

function getEventPosition(event) {
  const start = new Date(event.start_time || event.start)
  const end = new Date(event.end_time || event.end)
  const startHour = start.getHours() + start.getMinutes() / 60
  const endHour = end.getHours() + end.getMinutes() / 60
  const duration = endHour - startHour

  // Clamp to visible range (8am - 8pm)
  const top = Math.max(0, (startHour - 8) / 12) * 100
  const height = Math.min(duration / 12, (20 - Math.max(8, startHour)) / 12) * 100

  return { top: `${top}%`, height: `${Math.max(height, 100 / 12 / 2)}%` }
}

function CurrentTimeLine() {
  const now = new Date()
  const currentHour = now.getHours() + now.getMinutes() / 60
  if (currentHour < 8 || currentHour > 20) return null

  const top = ((currentHour - 8) / 12) * 100

  return (
    <div
      className="absolute left-0 right-0 z-20 pointer-events-none"
      style={{ top: `${top}%` }}
    >
      <div className="flex items-center">
        <div className="h-2.5 w-2.5 rounded-full bg-red-500 -ml-1.5 shrink-0" />
        <div className="h-px w-full bg-red-500" />
      </div>
    </div>
  )
}

function DayColumn({ date, events, onEventClick, onSlotClick, showDayName = true }) {
  const today = new Date()
  const isToday = isSameDay(date, today)
  const dayEvents = events.filter((e) => {
    const eventDate = new Date(e.start_time || e.start)
    return isSameDay(eventDate, date)
  })

  return (
    <div className="flex flex-col flex-1 min-w-0">
      {/* Day header */}
      {showDayName && (
        <div
          className={`sticky top-0 z-10 flex flex-col items-center py-2 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 ${
            isToday ? 'bg-blue-50 dark:bg-blue-900/20' : ''
          }`}
        >
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
            {DAY_NAMES[date.getDay() === 0 ? 6 : date.getDay() - 1]}
          </span>
          <span
            className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
              isToday
                ? 'bg-blue-600 text-white'
                : 'text-slate-900 dark:text-white'
            }`}
          >
            {date.getDate()}
          </span>
        </div>
      )}

      {/* Hour slots */}
      <div className="relative flex-1">
        {HOURS.map((hour) => (
          <div
            key={hour}
            className="h-16 border-b border-slate-100 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            onClick={() => onSlotClick?.(date, hour)}
          />
        ))}

        {/* Events */}
        {dayEvents.map((event) => {
          const pos = getEventPosition(event)
          return (
            <div
              key={event.id}
              className="absolute left-1 right-1 z-10"
              style={{ top: pos.top, height: pos.height }}
              onClick={(e) => {
                e.stopPropagation()
                onEventClick?.(event)
              }}
            >
              <EventCard event={event} />
            </div>
          )
        })}

        {/* Current time indicator */}
        {isToday && <CurrentTimeLine />}
      </div>
    </div>
  )
}

function WeekView({ events, currentDate, onEventClick, onSlotClick }) {
  const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate])

  return (
    <div className="flex flex-1 overflow-auto">
      {/* Time gutter */}
      <div className="w-16 shrink-0 pt-[68px]">
        {HOURS.map((hour) => (
          <div
            key={hour}
            className="h-16 flex items-start justify-end pr-2 -mt-2"
          >
            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
              {formatHour(hour)}
            </span>
          </div>
        ))}
      </div>

      {/* Day columns */}
      <div className="flex flex-1 divide-x divide-slate-200 dark:divide-slate-700 border-l border-slate-200 dark:border-slate-700">
        {weekDays.map((day) => (
          <DayColumn
            key={day.toISOString()}
            date={day}
            events={events}
            onEventClick={onEventClick}
            onSlotClick={onSlotClick}
          />
        ))}
      </div>
    </div>
  )
}

function DayView({ events, currentDate, onEventClick, onSlotClick }) {
  return (
    <div className="flex flex-1 overflow-auto">
      {/* Time gutter */}
      <div className="w-20 shrink-0 pt-[68px]">
        {HOURS.map((hour) => (
          <div
            key={hour}
            className="h-16 flex items-start justify-end pr-3 -mt-2"
          >
            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
              {formatHour(hour)}
            </span>
          </div>
        ))}
      </div>

      {/* Single day column */}
      <div className="flex-1 border-l border-slate-200 dark:border-slate-700">
        <DayColumn
          date={currentDate}
          events={events}
          onEventClick={onEventClick}
          onSlotClick={onSlotClick}
        />
      </div>
    </div>
  )
}

function MonthView({ events, currentDate, onEventClick, onSlotClick }) {
  const monthDays = useMemo(() => getMonthDays(currentDate), [currentDate])
  const today = new Date()
  const currentMonth = currentDate.getMonth()

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-700">
        {MONTH_DAY_NAMES.map((name) => (
          <div
            key={name}
            className="py-2 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase"
          >
            {name}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 flex-1 auto-rows-fr">
        {monthDays.map((day, index) => {
          const isCurrentMonth = day.getMonth() === currentMonth
          const isToday = isSameDay(day, today)
          const dayEvents = events.filter((e) => {
            const eventDate = new Date(e.start_time || e.start)
            return isSameDay(eventDate, day)
          })
          const visibleEvents = dayEvents.slice(0, 3)
          const moreCount = dayEvents.length - 3

          return (
            <div
              key={index}
              className={`min-h-[100px] border-b border-r border-slate-200 dark:border-slate-700 p-1.5 cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                !isCurrentMonth
                  ? 'bg-slate-50/50 dark:bg-slate-900/50'
                  : 'bg-white dark:bg-slate-900'
              }`}
              onClick={() => onSlotClick?.(day, 9)}
            >
              <span
                className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                  isToday
                    ? 'bg-blue-600 text-white'
                    : isCurrentMonth
                      ? 'text-slate-700 dark:text-slate-300'
                      : 'text-slate-400 dark:text-slate-600'
                }`}
              >
                {day.getDate()}
              </span>

              <div className="mt-0.5 space-y-0.5">
                {visibleEvents.map((event) => (
                  <div
                    key={event.id}
                    onClick={(e) => {
                      e.stopPropagation()
                      onEventClick?.(event)
                    }}
                  >
                    <EventCard event={event} compact />
                  </div>
                ))}
                {moreCount > 0 && (
                  <button className="text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 pl-1">
                    +{moreCount} more
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function CalendarGrid({
  events = [],
  view = 'week',
  currentDate,
  onEventClick,
  onSlotClick,
}) {
  if (view === 'day') {
    return (
      <DayView
        events={events}
        currentDate={currentDate}
        onEventClick={onEventClick}
        onSlotClick={onSlotClick}
      />
    )
  }

  if (view === 'month') {
    return (
      <MonthView
        events={events}
        currentDate={currentDate}
        onEventClick={onEventClick}
        onSlotClick={onSlotClick}
      />
    )
  }

  return (
    <WeekView
      events={events}
      currentDate={currentDate}
      onEventClick={onEventClick}
      onSlotClick={onSlotClick}
    />
  )
}
