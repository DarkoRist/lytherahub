import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  MapPin,
  Users,
  X,
  Trash2,
  Edit3,
  Sparkles,
  CalendarDays,
  Loader2,
  Search,
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../api/client'
import CalendarGrid from '../components/calendar/CalendarGrid'
import MeetingPrep from '../components/calendar/MeetingPrep'

// ---------------------------------------------------------------------------
// Demo fallback data
// ---------------------------------------------------------------------------
function generateDemoEvents() {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const events = []

  const templates = [
    { title: 'Team Standup', type: 'meeting', location: 'Google Meet', duration: 30, is_meeting: true },
    { title: 'Client Call — TechVision GmbH', type: 'call', location: 'Zoom', duration: 60, is_meeting: true },
    { title: 'Product Review', type: 'meeting', location: 'Conference Room A', duration: 90, is_meeting: true },
    { title: 'Lunch with Hans Weber', type: 'personal', location: 'Restaurant Adler', duration: 60, is_meeting: false },
    { title: 'Sprint Planning', type: 'meeting', location: 'Google Meet', duration: 120, is_meeting: true },
    { title: 'Invoice Review Deadline', type: 'deadline', location: null, duration: 30, is_meeting: false },
    { title: 'Sales Pipeline Review', type: 'meeting', location: 'Slack Huddle', duration: 45, is_meeting: true },
    { title: 'Demo for CloudFirst AG', type: 'call', location: 'Zoom', duration: 60, is_meeting: true },
    { title: 'Marketing Strategy', type: 'meeting', location: 'Conference Room B', duration: 60, is_meeting: true },
    { title: 'Quarterly Board Meeting', type: 'meeting', location: 'Main Office', duration: 120, is_meeting: true },
    { title: '1:1 with Sarah', type: 'call', location: 'Google Meet', duration: 30, is_meeting: true },
    { title: 'Design Review', type: 'meeting', location: 'Figma', duration: 45, is_meeting: true },
    { title: 'Client Onboarding — NovaTech', type: 'call', location: 'Zoom', duration: 90, is_meeting: true },
    { title: 'Contract Signing Deadline', type: 'deadline', location: null, duration: 30, is_meeting: false },
    { title: 'Networking Event', type: 'personal', location: 'Berlin Hub', duration: 120, is_meeting: false },
  ]

  const attendeePool = [
    { email: 'hans@techvision.de', name: 'Hans Weber' },
    { email: 'sarah@cloudFirst.com', name: 'Sarah Mitchell' },
    { email: 'marcus@designstudio.com', name: 'Marcus Johnson' },
    { email: 'anna@novatech.io', name: 'Anna Schmidt' },
    { email: 'thomas@startup.de', name: 'Thomas Müller' },
  ]

  // Generate events for the next 14 days
  for (let dayOffset = -3; dayOffset < 14; dayOffset++) {
    const day = new Date(today)
    day.setDate(today.getDate() + dayOffset)

    // Skip some weekend days
    const dow = day.getDay()
    if ((dow === 0 || dow === 6) && Math.random() > 0.3) continue

    // 1-4 events per day
    const count = Math.floor(Math.random() * 3) + 1
    const usedHours = new Set()

    for (let i = 0; i < count; i++) {
      const t = templates[Math.floor(Math.random() * templates.length)]
      let startHour = 8 + Math.floor(Math.random() * 9) // 8am - 5pm
      while (usedHours.has(startHour)) startHour = 8 + Math.floor(Math.random() * 9)
      usedHours.add(startHour)

      const start = new Date(day)
      start.setHours(startHour, Math.random() > 0.5 ? 30 : 0, 0, 0)
      const end = new Date(start.getTime() + t.duration * 60000)

      const numAttendees = t.is_meeting ? Math.floor(Math.random() * 3) + 1 : 0
      const attendees = []
      const shuffled = [...attendeePool].sort(() => Math.random() - 0.5)
      for (let a = 0; a < numAttendees; a++) attendees.push(shuffled[a])

      events.push({
        id: `demo-evt-${dayOffset}-${i}`,
        title: t.title,
        type: t.type,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        location: t.location,
        attendees,
        is_meeting: t.is_meeting,
        prep_brief: dayOffset <= 1 && t.is_meeting
          ? `Background: This is a ${t.is_meeting ? 'recurring' : 'one-time'} ${t.type} with key stakeholders.\n\nLast Interaction: Discussed project milestones and deliverables two weeks ago. All action items were completed.\n\nOpen Invoices: No outstanding invoices for this client.\n\nTalking Points:\n- Review progress on current deliverables\n- Discuss timeline for next phase\n- Align on budget and resource allocation\n- Address any blockers or concerns`
          : null,
        action_items: t.is_meeting ? ['Follow up on action items', 'Send meeting notes'] : null,
        description: t.is_meeting ? `Regular ${t.type} to discuss project progress and next steps.` : null,
      })
    }
  }

  return events.sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
}

const DEMO_EVENTS = generateDemoEvents()

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDateRange(date, view) {
  const opts = { month: 'long', year: 'numeric' }
  if (view === 'day') {
    return new Intl.DateTimeFormat('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date)
  }
  if (view === 'week') {
    const weekStart = new Date(date)
    const dow = weekStart.getDay()
    weekStart.setDate(weekStart.getDate() - (dow === 0 ? 6 : dow - 1))
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)

    const startStr = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(weekStart)
    const endStr = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(weekEnd)
    return `${startStr} — ${endStr}`
  }
  return new Intl.DateTimeFormat('en-GB', opts).format(date)
}

function formatTime(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function formatEventDate(dateStr) {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(new Date(dateStr))
}

function getDateRangeParams(date, view) {
  const d = new Date(date)
  if (view === 'day') {
    const start = new Date(d.getFullYear(), d.getMonth(), d.getDate())
    const end = new Date(start)
    end.setDate(end.getDate() + 1)
    return { start: fmt(start), end: fmt(end) }
  }
  if (view === 'week') {
    const dow = d.getDay()
    const monday = new Date(d)
    monday.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1))
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 7)
    return { start: fmt(monday), end: fmt(sunday) }
  }
  // month: include surrounding days for calendar grid
  const first = new Date(d.getFullYear(), d.getMonth(), 1)
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 7)
  const startDate = new Date(first)
  startDate.setDate(startDate.getDate() - 7)
  return { start: fmt(startDate), end: fmt(last) }
}

function fmt(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// ---------------------------------------------------------------------------
// Calendar Page
// ---------------------------------------------------------------------------

export default function Calendar() {
  const queryClient = useQueryClient()
  const [view, setView] = useState('week')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [addDefaults, setAddDefaults] = useState(null)

  const dateRange = useMemo(() => getDateRangeParams(currentDate, view), [currentDate, view])

  // Fetch events
  const { data: events, isLoading } = useQuery({
    queryKey: ['calendar-events', dateRange.start, dateRange.end],
    queryFn: () =>
      api.get('/calendar/events', { params: { start: dateRange.start, end: dateRange.end } }).then((r) => r.data),
    placeholderData: DEMO_EVENTS,
    staleTime: 30_000,
  })

  // Fetch today's schedule for sidebar
  const { data: todayEvents } = useQuery({
    queryKey: ['calendar-today'],
    queryFn: () => api.get('/calendar/today').then((r) => r.data),
    placeholderData: DEMO_EVENTS.filter((e) => {
      const d = new Date(e.start_time)
      const today = new Date()
      return d.toDateString() === today.toDateString()
    }),
    staleTime: 60_000,
  })

  // Create event
  const createEvent = useMutation({
    mutationFn: (data) => api.post('/calendar/events', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] })
      queryClient.invalidateQueries({ queryKey: ['calendar-today'] })
      setShowAddModal(false)
      toast.success('Event created')
    },
    onError: () => toast.error('Failed to create event'),
  })

  // Navigate
  const navigate = (direction) => {
    const d = new Date(currentDate)
    if (view === 'day') d.setDate(d.getDate() + direction)
    else if (view === 'week') d.setDate(d.getDate() + direction * 7)
    else d.setMonth(d.getMonth() + direction)
    setCurrentDate(d)
  }

  const goToToday = () => setCurrentDate(new Date())

  const handleSlotClick = (date, hour) => {
    const start = new Date(date)
    start.setHours(hour, 0, 0, 0)
    const end = new Date(start.getTime() + 60 * 60000)
    setAddDefaults({ start, end })
    setShowAddModal(true)
  }

  // Next meeting countdown
  const nextMeeting = useMemo(() => {
    if (!todayEvents?.length) return null
    const now = new Date()
    return todayEvents.find((e) => new Date(e.start_time) > now)
  }, [todayEvents])

  const nextMeetingCountdown = useMemo(() => {
    if (!nextMeeting) return null
    const diff = new Date(nextMeeting.start_time) - new Date()
    if (diff < 0) return null
    const h = Math.floor(diff / 3600000)
    const m = Math.floor((diff % 3600000) / 60000)
    if (h > 0) return `${h}h ${m}m`
    return `${m}m`
  }, [nextMeeting])

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col lg:flex-row">
      {/* Main calendar area */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <button
              onClick={goToToday}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Today
            </button>
            <button
              onClick={() => navigate(-1)}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => navigate(1)}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              {formatDateRange(currentDate, view)}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {/* View toggles */}
            <div className="flex rounded-lg border border-slate-200 dark:border-slate-600">
              {['day', 'week', 'month'].map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-3 py-1.5 text-sm font-medium capitalize transition-colors first:rounded-l-lg last:rounded-r-lg ${
                    view === v
                      ? 'bg-brand-600 text-white'
                      : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                setAddDefaults(null)
                setShowAddModal(true)
              }}
              className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Event</span>
            </button>
          </div>
        </div>

        {/* Calendar grid */}
        <div className="flex-1 overflow-auto bg-white dark:bg-slate-900">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
            </div>
          ) : (
            <CalendarGrid
              events={events || []}
              view={view}
              currentDate={currentDate}
              onEventClick={setSelectedEvent}
              onSlotClick={handleSlotClick}
            />
          )}
        </div>
      </div>

      {/* Right sidebar: Today's schedule OR Event detail */}
      <div className="w-full border-l border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 lg:w-80 xl:w-96">
        {selectedEvent ? (
          <EventDetailPanel
            event={selectedEvent}
            onClose={() => setSelectedEvent(null)}
          />
        ) : (
          <TodaySidebar
            events={todayEvents || []}
            nextMeeting={nextMeeting}
            countdown={nextMeetingCountdown}
            onEventClick={setSelectedEvent}
            onAddClick={() => {
              setAddDefaults(null)
              setShowAddModal(true)
            }}
          />
        )}
      </div>

      {/* Add Event Modal */}
      {showAddModal && (
        <AddEventModal
          defaults={addDefaults}
          isPending={createEvent.isPending}
          onSubmit={(data) => createEvent.mutate(data)}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Event Detail Panel
// ---------------------------------------------------------------------------

function EventDetailPanel({ event, onClose }) {
  return (
    <div className="flex h-full flex-col overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Event Details</h3>
        <button
          onClick={onClose}
          className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 space-y-5 p-4">
        {/* Title & type badge */}
        <div>
          <div className="flex items-start justify-between gap-2">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
              {event.title}
            </h2>
            <TypeBadge type={event.type || 'meeting'} />
          </div>
          {event.description && (
            <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">{event.description}</p>
          )}
        </div>

        {/* Time */}
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <Clock className="h-4 w-4 shrink-0 text-slate-400" />
          <span>
            {formatEventDate(event.start_time)} &middot; {formatTime(event.start_time)} – {formatTime(event.end_time)}
          </span>
        </div>

        {/* Location */}
        {event.location && (
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
            <span>{event.location}</span>
          </div>
        )}

        {/* Attendees */}
        {event.attendees?.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Attendees ({event.attendees.length})
              </span>
            </div>
            <div className="space-y-1.5 pl-6">
              {event.attendees.map((a, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700 dark:bg-brand-900/30 dark:text-brand-400">
                    {(a.name || a.email || '?')[0].toUpperCase()}
                  </div>
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    {a.name || a.email}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action items from previous meeting */}
        {event.action_items?.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Action Items
            </h4>
            <ul className="space-y-1 pl-5">
              {event.action_items.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* AI Meeting Prep */}
        <MeetingPrep event={event} />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Today Sidebar
// ---------------------------------------------------------------------------

function TodaySidebar({ events, nextMeeting, countdown, onEventClick, onAddClick }) {
  const now = new Date()

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
          Today's Schedule
        </h3>
        <button
          onClick={onAddClick}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Next meeting countdown */}
      {nextMeeting && countdown && (
        <div className="mx-4 mt-3 rounded-lg border border-brand-200 bg-brand-50 p-3 dark:border-brand-800 dark:bg-brand-900/20">
          <div className="flex items-center gap-2 text-xs font-medium text-brand-600 dark:text-brand-400 uppercase tracking-wide">
            <Clock className="h-3.5 w-3.5" />
            Next in {countdown}
          </div>
          <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white truncate">
            {nextMeeting.title}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {formatTime(nextMeeting.start_time)}{nextMeeting.location ? ` · ${nextMeeting.location}` : ''}
          </p>
        </div>
      )}

      {/* Timeline */}
      <div className="flex-1 p-4 space-y-1">
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <CalendarDays className="h-10 w-10 text-slate-300 dark:text-slate-600" />
            <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">
              No events today
            </p>
            <button
              onClick={onAddClick}
              className="mt-3 flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Event
            </button>
          </div>
        ) : (
          events.map((event) => {
            const isPast = new Date(event.end_time) < now
            const isCurrent = new Date(event.start_time) <= now && new Date(event.end_time) > now

            return (
              <button
                key={event.id}
                onClick={() => onEventClick(event)}
                className={`w-full text-left rounded-lg border p-3 transition-all hover:shadow-sm ${
                  isCurrent
                    ? 'border-brand-300 bg-brand-50 dark:border-brand-700 dark:bg-brand-900/20'
                    : isPast
                      ? 'border-slate-200 bg-slate-50 opacity-60 dark:border-slate-700 dark:bg-slate-800/50'
                      : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full shrink-0 ${
                      isCurrent ? 'bg-brand-500 animate-pulse' : isPast ? 'bg-slate-300' : 'bg-emerald-500'
                    }`}
                  />
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {formatTime(event.start_time)} – {formatTime(event.end_time)}
                  </span>
                </div>
                <p className="mt-1 text-sm font-medium text-slate-900 dark:text-white truncate">
                  {event.title}
                </p>
                {event.location && (
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 truncate">
                    {event.location}
                  </p>
                )}
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Add Event Modal
// ---------------------------------------------------------------------------

function AddEventModal({ defaults, isPending, onSubmit, onClose }) {
  const now = defaults?.start || new Date()
  const defaultEnd = defaults?.end || new Date(now.getTime() + 60 * 60000)

  const [form, setForm] = useState({
    title: '',
    description: '',
    start_time: toLocalDatetime(now),
    end_time: toLocalDatetime(defaultEnd),
    location: '',
    is_meeting: true,
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.title.trim()) {
      toast.error('Title is required')
      return
    }
    onSubmit({
      ...form,
      start_time: new Date(form.start_time).toISOString(),
      end_time: new Date(form.end_time).toISOString(),
      attendees: [],
    })
  }

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl dark:bg-slate-800">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">New Event</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {/* Title */}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Title *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={set('title')}
              placeholder="Meeting with..."
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              autoFocus
            />
          </div>

          {/* Start / End */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Start</label>
              <input
                type="datetime-local"
                value={form.start_time}
                onChange={set('start_time')}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">End</label>
              <input
                type="datetime-local"
                value={form.end_time}
                onChange={set('end_time')}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Location</label>
            <input
              type="text"
              value={form.location}
              onChange={set('location')}
              placeholder="Google Meet, Room A, ..."
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
            <textarea
              value={form.description}
              onChange={set('description')}
              rows={3}
              placeholder="Optional notes..."
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
            />
          </div>

          {/* Meeting toggle */}
          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={form.is_meeting}
              onChange={(e) => setForm((f) => ({ ...f, is_meeting: e.target.checked }))}
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            This is a meeting (enable AI prep)
          </label>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Event
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Small components
// ---------------------------------------------------------------------------

function TypeBadge({ type }) {
  const styles = {
    meeting: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    call: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    deadline: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    personal: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  }
  return (
    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium capitalize ${styles[type] || styles.meeting}`}>
      {type}
    </span>
  )
}

function toLocalDatetime(date) {
  const d = new Date(date)
  const offset = d.getTimezoneOffset()
  const local = new Date(d.getTime() - offset * 60000)
  return local.toISOString().slice(0, 16)
}
