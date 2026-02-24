import { useState, useMemo, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Search,
  Sparkles,
  ArrowLeft,
  Star,
  Archive,
  CheckCheck,
  Mail,
  AlertCircle,
  RefreshCw,
  CheckSquare,
  Clock,
  Flag,
  Send,
  Inbox as InboxIcon,
  X,
  CalendarDays,
  Loader2,
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../api/client'
import { classNames, getInitials } from '../utils/helpers'
import { formatDate, formatRelativeTime } from '../utils/formatters'
import CategoryFilter from '../components/inbox/CategoryFilter'
import EmailList from '../components/inbox/EmailList'
import ReplyDraft from '../components/inbox/ReplyDraft'

// ---------------------------------------------------------------------------
// Demo fallback data
// ---------------------------------------------------------------------------
const DEMO_EMAILS = [
  {
    id: '1',
    sender_name: 'Sarah Mitchell',
    from: 'sarah.mitchell@techcorp.io',
    to: 'me@lytherahub.dev',
    subject: 'Q1 Partnership Proposal - Decision Needed by Friday',
    snippet:
      'Hi, I wanted to follow up on our conversation last week about the partnership proposal. We have finalized the terms and I have attached the updated contract for your review.',
    ai_summary:
      'Partnership contract ready for review. Decision deadline is this Friday. Terms updated from last discussion.',
    body: 'Hi,\n\nI wanted to follow up on our conversation last week about the partnership proposal. We have finalized the terms and I have attached the updated contract for your review.\n\nThe key changes from our last discussion include:\n- Revenue share adjusted to 70/30 as discussed\n- Implementation timeline moved to Q2\n- Support SLA updated to 4-hour response time\n\nWe need a decision by this Friday to meet the board deadline. Please let me know if you have any questions.\n\nBest regards,\nSarah Mitchell\nVP of Partnerships, TechCorp',
    category: 'urgent',
    is_read: false,
    is_starred: true,
    needs_reply: true,
    action_items: [
      'Review updated partnership contract',
      'Confirm revenue share terms (70/30)',
      'Respond by Friday with decision',
    ],
    date: new Date(Date.now() - 25 * 60000).toISOString(),
  },
  {
    id: '2',
    sender_name: 'Marcus Johnson',
    from: 'marcus@designstudio.com',
    to: 'me@lytherahub.dev',
    subject: 'Invoice #1042 - Website Redesign Phase 2',
    snippet:
      'Please find attached invoice #1042 for the completed Phase 2 of the website redesign project. Payment terms are Net 30.',
    ai_summary:
      'Invoice #1042 for website redesign Phase 2. Amount likely significant. Net 30 payment terms.',
    body: 'Hi,\n\nPlease find attached invoice #1042 for the completed Phase 2 of the website redesign project.\n\nInvoice Details:\n- Project: Website Redesign Phase 2\n- Amount: EUR 8,500.00\n- Payment Terms: Net 30\n- Due Date: March 15, 2026\n\nAll deliverables from Phase 2 have been completed and approved. Please let me know if you have any questions about the invoice.\n\nThank you for your business!\n\nMarcus Johnson\nDesign Studio Co.',
    category: 'invoice',
    is_read: false,
    is_starred: false,
    needs_reply: false,
    action_items: ['Process invoice #1042 for EUR 8,500', 'Due by March 15'],
    date: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: '3',
    sender_name: 'Elena Rodriguez',
    from: 'elena.r@globalventures.co',
    to: 'me@lytherahub.dev',
    subject: 'Re: Project Timeline Update - Sprint 4 Delayed',
    snippet:
      'Unfortunately we need to push Sprint 4 back by one week due to the API integration issues we discussed in the standup.',
    ai_summary:
      'Sprint 4 delayed by one week. Cause: API integration issues. May impact overall project timeline.',
    body: 'Hi,\n\nUnfortunately we need to push Sprint 4 back by one week due to the API integration issues we discussed in the standup yesterday.\n\nThe delay is caused by:\n1. Third-party API rate limiting changes\n2. Authentication flow rework needed\n3. Additional testing required for edge cases\n\nNew Sprint 4 dates: Feb 17 - Feb 28\nThis should not affect the overall Q1 delivery date.\n\nLet me know if you want to schedule a call to discuss the revised timeline.\n\nBest,\nElena Rodriguez\nProject Manager, Global Ventures',
    category: 'client',
    is_read: true,
    is_starred: false,
    needs_reply: true,
    action_items: [
      'Acknowledge Sprint 4 delay',
      'Review impact on Q1 delivery',
      'Consider scheduling a timeline discussion call',
    ],
    date: new Date(Date.now() - 4 * 3600000).toISOString(),
  },
  {
    id: '4',
    sender_name: 'Stripe Billing',
    from: 'notifications@stripe.com',
    to: 'me@lytherahub.dev',
    subject: 'Payment Received - Invoice INV-2026-0089',
    snippet:
      'A payment of EUR 3,200.00 was successfully received for invoice INV-2026-0089 from Acme Solutions.',
    ai_summary:
      'Payment of EUR 3,200 received from Acme Solutions. Invoice INV-2026-0089 is now fully paid.',
    body: 'Payment Confirmation\n\nA payment of EUR 3,200.00 was successfully received.\n\nDetails:\n- Invoice: INV-2026-0089\n- Client: Acme Solutions\n- Amount: EUR 3,200.00\n- Payment Method: Bank Transfer\n- Status: Paid in Full\n\nView the full invoice details in your Stripe dashboard.',
    category: 'invoice',
    is_read: true,
    is_starred: false,
    needs_reply: false,
    action_items: [],
    date: new Date(Date.now() - 5 * 3600000).toISOString(),
  },
  {
    id: '5',
    sender_name: 'David Park',
    from: 'david.park@innovatelab.io',
    to: 'me@lytherahub.dev',
    subject: 'Urgent: Production Server Down - Immediate Attention Required',
    snippet:
      'Our production monitoring detected a critical failure on the main API server. Response times spiked above 30s and several endpoints are returning 503 errors.',
    ai_summary:
      'CRITICAL: Production API server down. 503 errors on multiple endpoints. Response times above 30s. Immediate action required.',
    body: 'URGENT\n\nOur production monitoring detected a critical failure on the main API server at 14:23 UTC.\n\nImpact:\n- Response times spiked above 30 seconds\n- Multiple endpoints returning 503 errors\n- Approximately 2,000 users affected\n- Revenue processing halted\n\nWe have already:\n- Restarted the application containers\n- Scaled up to 4 instances\n- Enabled the maintenance page\n\nWe need your authorization to:\n1. Switch to the backup database cluster\n2. Approve emergency infrastructure spend\n\nPlease respond ASAP.\n\nDavid Park\nCTO, InnovateLab',
    category: 'urgent',
    is_read: false,
    is_starred: true,
    needs_reply: true,
    action_items: [
      'Authorize switch to backup database cluster',
      'Approve emergency infrastructure spend',
      'Follow up on incident resolution',
    ],
    date: new Date(Date.now() - 45 * 60000).toISOString(),
  },
  {
    id: '6',
    sender_name: 'TechCrunch Daily',
    from: 'newsletter@techcrunch.com',
    to: 'me@lytherahub.dev',
    subject: 'Top Stories: AI Startups Raise $2B in January, New EU Data Regulations',
    snippet:
      'This week in tech: Record-breaking AI funding, new EU regulations, and the latest on the autonomous vehicle race.',
    ai_summary:
      'Tech newsletter: AI startups raised $2B in January. New EU data regulations announced. Autonomous vehicle industry updates.',
    body: 'TechCrunch Daily Digest\n\nTop Stories:\n\n1. AI Startups Raise $2B in January Alone\nThe AI sector continues its explosive growth with record funding...\n\n2. EU Announces New Data Protection Framework\nNew regulations set to take effect Q3 2026...\n\n3. Autonomous Vehicle Race Heats Up\nThree major players announce new partnerships...\n\nRead more at techcrunch.com',
    category: 'newsletter',
    is_read: true,
    is_starred: false,
    needs_reply: false,
    action_items: [],
    date: new Date(Date.now() - 8 * 3600000).toISOString(),
  },
  {
    id: '7',
    sender_name: 'Lisa Chen',
    from: 'lisa.chen@brightpath.co',
    to: 'me@lytherahub.dev',
    subject: 'Onboarding Kickoff - New Client: Brightpath Solutions',
    snippet:
      'Excited to get started! I have compiled the initial requirements document and set up the shared project space. When can we schedule the kickoff call?',
    ai_summary:
      'New client onboarding for Brightpath Solutions. Requirements document ready. Requesting kickoff call scheduling.',
    body: 'Hi,\n\nExcited to get started! I have compiled the initial requirements document and set up the shared project space.\n\nHere is what we have ready:\n- Requirements document (attached)\n- Project timeline draft\n- Shared Google Drive folder\n- Slack channel created: #proj-brightpath\n\nWhen can we schedule the kickoff call? I have availability:\n- Tuesday 10:00-12:00\n- Wednesday 14:00-16:00\n- Thursday 09:00-11:00\n\nLooking forward to working together!\n\nBest,\nLisa Chen\nCEO, Brightpath Solutions',
    category: 'client',
    is_read: false,
    is_starred: false,
    needs_reply: true,
    action_items: [
      'Review requirements document',
      'Schedule kickoff call (Tue/Wed/Thu options)',
      'Set up client onboarding workflow',
    ],
    date: new Date(Date.now() - 6 * 3600000).toISOString(),
  },
  {
    id: '8',
    sender_name: 'GitHub',
    from: 'notifications@github.com',
    to: 'me@lytherahub.dev',
    subject: '[lytherahub/core] Pull Request #247: feat: add real-time notifications',
    snippet:
      'New pull request from @dev-alex: Implements WebSocket-based real-time notification system with Redis pub/sub backend.',
    ai_summary:
      'PR #247 adds real-time notifications via WebSocket and Redis pub/sub. From @dev-alex. Needs code review.',
    body: 'Pull Request #247: feat: add real-time notifications\n\nOpened by @dev-alex\n\nDescription:\nThis PR implements the WebSocket-based real-time notification system.\n\nChanges:\n- New WebSocket endpoint at /ws/notifications\n- Redis pub/sub integration for multi-instance support\n- Client-side notification provider component\n- 15 new tests added\n\nFiles changed: 12\nAdditions: +487\nDeletions: -23\n\nReview requested from: @you',
    category: 'other',
    is_read: true,
    is_starred: false,
    needs_reply: false,
    action_items: ['Review PR #247 code changes', 'Check test coverage'],
    date: new Date(Date.now() - 10 * 3600000).toISOString(),
  },
  {
    id: '9',
    sender_name: 'Product Hunt',
    from: 'digest@producthunt.com',
    to: 'me@lytherahub.dev',
    subject: 'Daily Digest: Top Products - Feb 12',
    snippet:
      "Today's top launches: An AI meeting assistant, a new project management tool, and a design system generator.",
    ai_summary:
      'Product Hunt digest: Top launches include AI meeting assistant, PM tool, and design system generator.',
    body: 'Product Hunt Daily Digest - February 12, 2026\n\n#1 MeetingMind AI\nAI-powered meeting assistant that takes notes, creates action items...\n\n#2 ProjectFlow\nNext-gen project management with AI timeline predictions...\n\n#3 DesignKit Pro\nGenerate complete design systems from a single brand guideline...\n\nSee all launches at producthunt.com',
    category: 'newsletter',
    is_read: true,
    is_starred: false,
    needs_reply: false,
    action_items: [],
    date: new Date(Date.now() - 12 * 3600000).toISOString(),
  },
  {
    id: '10',
    sender_name: 'Amanda Foster',
    from: 'amanda@fosterfinance.com',
    to: 'me@lytherahub.dev',
    subject: 'Q4 Financial Review + Tax Planning Meeting',
    snippet:
      'I have completed the Q4 financial review. Overall revenue grew 23% QoQ. We should schedule a tax planning session before the March deadline.',
    ai_summary:
      'Q4 review complete: 23% revenue growth QoQ. Tax planning meeting needed before March deadline.',
    body: 'Hi,\n\nI have completed the Q4 2025 financial review. Here are the highlights:\n\nRevenue:\n- Q4 Revenue: EUR 127,400 (+23% QoQ)\n- Annual Revenue: EUR 412,800\n- MRR: EUR 42,500\n\nExpenses:\n- Operating costs down 8%\n- Marketing spend optimized\n- Net margin: 34%\n\nWe should schedule a tax planning session before the March 15 deadline. I have a few strategies to discuss that could save approximately EUR 12,000-15,000.\n\nAvailable next week Tuesday or Thursday afternoon.\n\nBest regards,\nAmanda Foster, CPA\nFoster Finance Advisory',
    category: 'client',
    is_read: false,
    is_starred: true,
    needs_reply: true,
    action_items: [
      'Review Q4 financial highlights',
      'Schedule tax planning meeting before March 15',
      'Discuss tax-saving strategies (EUR 12-15K potential)',
    ],
    date: new Date(Date.now() - 3 * 3600000).toISOString(),
  },
]

const DEMO_STATS = {
  all: 47,
  urgent: 5,
  client: 12,
  invoice: 8,
  newsletter: 15,
  other: 7,
}

// ---------------------------------------------------------------------------
// Category badge color map for the detail view
// ---------------------------------------------------------------------------
const CATEGORY_BADGE = {
  urgent: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  client: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  invoice: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  newsletter: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  spam: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400',
  other: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
}

// ---------------------------------------------------------------------------
// Snooze + follow-up options
// ---------------------------------------------------------------------------
const SNOOZE_OPTIONS = [
  { label: 'Later today (3 hours)', hours: 3 },
  { label: 'Tomorrow morning', hours: 20 },
  { label: 'Next week', hours: 168 },
]

const FOLLOW_UP_OPTIONS = [
  { label: '1 day — if no reply by tomorrow', days: 1 },
  { label: '3 days — follow up Friday', days: 3 },
  { label: '1 week — follow up next week', days: 7 },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function Inbox() {
  const [category, setCategory] = useState('all')
  const [selectedEmail, setSelectedEmail] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [showDetail, setShowDetail] = useState(false)

  // Local email state for optimistic updates
  const [localEmails, setLocalEmails] = useState(null)

  // Folder state
  const [activeFolder, setActiveFolder] = useState('inbox')
  const [snoozedEmails, setSnoozedEmails] = useState([])
  const [archivedEmails, setArchivedEmails] = useState([])

  // Smart feature state
  const [followUpFlags, setFollowUpFlags] = useState({})
  const [taskBadges, setTaskBadges] = useState(new Set())
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [taskForm, setTaskForm] = useState(null)
  const [showSnoozeFor, setShowSnoozeFor] = useState(null)
  const [showFollowUpFor, setShowFollowUpFor] = useState(null)

  // ---- Fetch emails --------------------------------------------------
  const {
    data: emailsData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['emails', category, page],
    queryFn: async () => {
      try {
        const params = { page, limit: 20 }
        if (category !== 'all') params.category = category
        const res = await api.get('/emails', { params })
        return res.data
      } catch {
        return null
      }
    },
    staleTime: 30_000,
    retry: false,
  })

  // Hydrate localEmails from query data when first available
  useEffect(() => {
    if (localEmails === null && emailsData !== null) {
      const raw =
        emailsData?.items ||
        emailsData?.emails ||
        (Array.isArray(emailsData) ? emailsData : null) ||
        DEMO_EMAILS
      setLocalEmails(raw)
    }
  }, [emailsData, localEmails])

  // ---- Fetch stats ---------------------------------------------------
  const { data: statsData } = useQuery({
    queryKey: ['email-stats'],
    queryFn: async () => {
      try {
        const res = await api.get('/emails/stats')
        return res.data
      } catch {
        return null
      }
    },
    staleTime: 60_000,
    retry: false,
  })

  // ---- Base emails (localEmails or DEMO_EMAILS fallback) -------------
  const baseEmails = useMemo(() => {
    if (localEmails !== null) return localEmails
    const raw =
      emailsData?.items ||
      emailsData?.emails ||
      (Array.isArray(emailsData) ? emailsData : null) ||
      DEMO_EMAILS
    return raw
  }, [localEmails, emailsData])

  // ---- Search filter (Fix 2A: correct field names) -------------------
  const searchFiltered = useMemo(() => {
    if (!searchQuery.trim()) return baseEmails
    const q = searchQuery.toLowerCase()
    return baseEmails.filter(
      (e) =>
        (e.from_addr || e.from || '').toLowerCase().includes(q) ||
        (e.sender_name || '').toLowerCase().includes(q) ||
        (e.subject || '').toLowerCase().includes(q) ||
        (e.snippet || '').toLowerCase().includes(q) ||
        (e.body_preview || '').toLowerCase().includes(q) ||
        (e.ai_summary || '').toLowerCase().includes(q) ||
        (e.category || '').toLowerCase().includes(q)
    )
  }, [baseEmails, searchQuery])

  // ---- Folder filter -------------------------------------------------
  const filteredEmails = useMemo(() => {
    switch (activeFolder) {
      case 'starred':
        return searchFiltered.filter((e) => e.is_starred)
      case 'snoozed':
        return snoozedEmails
      case 'sent':
        return []
      case 'archive':
        return archivedEmails
      default: // inbox
        if (category !== 'all') return searchFiltered.filter((e) => e.category === category)
        return searchFiltered
    }
  }, [searchFiltered, activeFolder, category, snoozedEmails, archivedEmails])

  const stats = statsData || DEMO_STATS

  // ---- Folder definitions --------------------------------------------
  const folders = [
    {
      id: 'inbox',
      label: 'Inbox',
      icon: InboxIcon,
      count: baseEmails.filter((e) => !e.archived).length,
    },
    {
      id: 'starred',
      label: 'Starred',
      icon: Star,
      count: baseEmails.filter((e) => e.is_starred).length,
    },
    {
      id: 'snoozed',
      label: 'Snoozed',
      icon: Clock,
      count: snoozedEmails.length,
    },
    {
      id: 'sent',
      label: 'Sent',
      icon: Send,
      count: 0,
    },
    {
      id: 'archive',
      label: 'Archive',
      icon: Archive,
      count: archivedEmails.length,
    },
  ]

  // ---- Optimistic email actions (Fix 2B) -----------------------------
  const handleMarkRead = (emailId) => {
    setLocalEmails((prev) =>
      (prev || DEMO_EMAILS).map((e) => (e.id === emailId ? { ...e, is_read: true } : e))
    )
    if (selectedEmail?.id === emailId)
      setSelectedEmail((prev) => ({ ...prev, is_read: true }))
    toast.success('Marked as read')
    api.patch(`/emails/${emailId}/read`).catch(() => {})
  }

  const handleStar = (emailId) => {
    const current = (localEmails || DEMO_EMAILS).find((e) => e.id === emailId)
    const nextStarred = !current?.is_starred
    setLocalEmails((prev) =>
      (prev || DEMO_EMAILS).map((e) =>
        e.id === emailId ? { ...e, is_starred: nextStarred } : e
      )
    )
    if (selectedEmail?.id === emailId)
      setSelectedEmail((prev) => ({ ...prev, is_starred: nextStarred }))
    toast.success(nextStarred ? 'Added to starred' : 'Removed from starred')
    api.patch(`/emails/${emailId}/star`).catch(() => {})
  }

  const handleArchive = (emailId) => {
    const email = (localEmails || DEMO_EMAILS).find((e) => e.id === emailId)
    if (email) setArchivedEmails((prev) => [...prev, email])
    setLocalEmails((prev) => (prev || DEMO_EMAILS).filter((e) => e.id !== emailId))
    if (selectedEmail?.id === emailId) {
      setSelectedEmail(null)
      setShowDetail(false)
    }
    toast.success('Email archived')
    api.patch(`/emails/${emailId}/archive`).catch(() => {})
  }

  // ---- Snooze handler ------------------------------------------------
  const handleSnooze = (emailId, hours) => {
    const email = (localEmails || DEMO_EMAILS).find((e) => e.id === emailId)
    if (!email) return
    const wakeTime = new Date()
    wakeTime.setHours(wakeTime.getHours() + hours)
    setSnoozedEmails((prev) => [...prev, { ...email, snoozedUntil: wakeTime }])
    setLocalEmails((prev) => (prev || DEMO_EMAILS).filter((e) => e.id !== emailId))
    if (selectedEmail?.id === emailId) {
      setSelectedEmail(null)
      setShowDetail(false)
    }
    setShowSnoozeFor(null)
    toast.success(
      `Snoozed until ${wakeTime.toLocaleString('en-GB', {
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })}`
    )
  }

  // ---- Create Task handler -------------------------------------------
  const openTaskModal = (email) => {
    setTaskForm({
      emailId: email.id,
      title: `Follow up: ${email.subject}`,
      dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      priority: email.category === 'urgent' ? 'high' : 'medium',
    })
    setShowTaskModal(true)
  }

  const handleCreateTask = async (form) => {
    const { emailId, ...taskData } = form
    toast.success(`Task created: ${taskData.title}`)
    setTaskBadges((prev) => new Set([...prev, emailId]))
    setShowTaskModal(false)
    setTaskForm(null)
    try {
      await api.post('/tasks', taskData)
    } catch { /* demo */ }
  }

  // ---- Follow-up handler --------------------------------------------
  const handleFollowUp = (emailId, days) => {
    const date = new Date()
    date.setDate(date.getDate() + days)
    setFollowUpFlags((prev) => ({ ...prev, [emailId]: date }))
    setShowFollowUpFor(null)
    toast.success(
      `Follow-up reminder set for ${date.toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
      })}`
    )
  }

  // ---- Navigation helpers -------------------------------------------
  function handleSelectEmail(email) {
    setSelectedEmail(email)
    setShowDetail(true)
  }

  function handleBack() {
    setShowDetail(false)
  }

  function handleCategoryChange(cat) {
    setCategory(cat)
    setPage(1)
    setSelectedEmail(null)
    setShowDetail(false)
  }

  // ---- Render ---------------------------------------------------------
  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col">
      {/* Top bar: title + search */}
      <div className="shrink-0 space-y-3 pb-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">
              Smart Inbox
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              AI-powered email management
            </p>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search emails..."
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:placeholder-slate-500 dark:focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Category filter — only shown in inbox folder */}
        {activeFolder === 'inbox' && (
          <CategoryFilter
            activeCategory={category}
            onChange={handleCategoryChange}
            stats={stats}
          />
        )}
      </div>

      {/* Error state */}
      {isError && !filteredEmails.length && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <AlertCircle className="h-7 w-7 text-red-500" />
          </div>
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Failed to load emails
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Something went wrong. Please try again.
          </p>
          <button
            onClick={() => refetch()}
            className="mt-4 flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      )}

      {/* Main split pane — 3 columns: folders + list + detail */}
      {(!isError || filteredEmails.length > 0) && (
        <div className="flex min-h-0 flex-1 overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">

          {/* ---- Folder sidebar ---- */}
          <div className="hidden w-36 shrink-0 border-r border-slate-100 py-4 px-2 dark:border-slate-800 sm:block">
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Folders
            </p>
            <div className="space-y-0.5">
              {folders.map((folder) => {
                const Icon = folder.icon
                return (
                  <button
                    key={folder.id}
                    onClick={() => {
                      setActiveFolder(folder.id)
                      setSelectedEmail(null)
                      setShowDetail(false)
                    }}
                    className={classNames(
                      'flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors',
                      activeFolder === folder.id
                        ? 'bg-blue-50 font-medium text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                        : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800'
                    )}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="flex-1 truncate">{folder.label}</span>
                    {folder.count > 0 && (
                      <span className="text-[10px] font-medium text-slate-400">
                        {folder.count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* ---- Email list ---- */}
          <div
            className={classNames(
              'w-full shrink-0 overflow-y-auto border-r border-slate-100 dark:border-slate-800 md:w-80 lg:w-[380px]',
              showDetail ? 'hidden md:block' : 'block'
            )}
          >
            {activeFolder === 'sent' ? (
              <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                <Send className="h-10 w-10 text-slate-300 dark:text-slate-600" />
                <p className="mt-3 text-sm font-medium text-slate-500 dark:text-slate-400">
                  Sent emails appear here when Gmail is connected.
                </p>
              </div>
            ) : (
              <EmailList
                emails={filteredEmails}
                selectedId={selectedEmail?.id}
                onSelect={handleSelectEmail}
                loading={isLoading}
                taskBadges={taskBadges}
                followUpFlags={followUpFlags}
              />
            )}

            {/* Pagination */}
            {filteredEmails.length > 0 && activeFolder === 'inbox' && (
              <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 dark:border-slate-800">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-md px-3 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  Previous
                </button>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Page {page}
                </span>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={filteredEmails.length < 20}
                  className="rounded-md px-3 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  Next
                </button>
              </div>
            )}
          </div>

          {/* ---- Email detail ---- */}
          <div
            className={classNames(
              'min-w-0 flex-1 overflow-y-auto',
              showDetail ? 'block' : 'hidden md:block'
            )}
          >
            {selectedEmail ? (
              <EmailDetail
                key={selectedEmail.id}
                email={selectedEmail}
                onBack={handleBack}
                onMarkRead={() => handleMarkRead(selectedEmail.id)}
                onStar={() => handleStar(selectedEmail.id)}
                onArchive={() => handleArchive(selectedEmail.id)}
                onSnooze={(hours) => handleSnooze(selectedEmail.id, hours)}
                onCreateTask={() => openTaskModal(selectedEmail)}
                onFollowUp={(days) => handleFollowUp(selectedEmail.id, days)}
                showSnoozeFor={showSnoozeFor}
                setShowSnoozeFor={setShowSnoozeFor}
                showFollowUpFor={showFollowUpFor}
                setShowFollowUpFor={setShowFollowUpFor}
                hasFollowUp={!!followUpFlags[selectedEmail.id]}
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center py-20 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                  <Mail className="h-8 w-8 text-slate-400 dark:text-slate-500" />
                </div>
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Select an email
                </h3>
                <p className="mt-1 max-w-xs text-sm text-slate-500 dark:text-slate-400">
                  Choose an email from the list to view its contents and AI-powered insights.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Task Creation Modal */}
      {showTaskModal && taskForm && (
        <TaskModal
          form={taskForm}
          onChange={setTaskForm}
          onSubmit={handleCreateTask}
          onClose={() => { setShowTaskModal(false); setTaskForm(null) }}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// TaskModal
// ---------------------------------------------------------------------------
function TaskModal({ form, onChange, onSubmit, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-2xl dark:bg-slate-800">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-700">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            Create Task from Email
          </h3>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-4 p-5">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
              Title
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => onChange((f) => ({ ...f, title: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                Due Date
              </label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => onChange((f) => ({ ...f, dueDate: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                Priority
              </label>
              <select
                value={form.priority}
                onChange={(e) => onChange((f) => ({ ...f, priority: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              onClick={() => onSubmit(form)}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Create Task
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// EmailDetail (internal component)
// ---------------------------------------------------------------------------

function extractNameFromAddr(addr) {
  if (!addr || !addr.includes('@')) return null
  const local = addr.split('@')[0]
  if (['noreply', 'no-reply', 'notifications', 'newsletter', 'calendar', 'digest', 'billing'].includes(local.toLowerCase())) {
    const domain = addr.split('@')[1]?.split('.')[0] || ''
    return domain.charAt(0).toUpperCase() + domain.slice(1)
  }
  return local
    .split(/[._-]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function EmailDetail({
  email,
  onBack,
  onMarkRead,
  onStar,
  onArchive,
  onSnooze,
  onCreateTask,
  onFollowUp,
  showSnoozeFor,
  setShowSnoozeFor,
  showFollowUpFor,
  setShowFollowUpFor,
  hasFollowUp,
}) {
  const badgeClass = CATEGORY_BADGE[email.category] || CATEGORY_BADGE.other
  const snoozeRef = useRef(null)
  const followUpRef = useRef(null)

  const senderDisplay =
    email.sender_name ||
    email.from_name ||
    email.sender ||
    (email.from && !email.from.includes('@') ? email.from : null) ||
    (email.from_addr && !email.from_addr.includes('@') ? email.from_addr : null) ||
    extractNameFromAddr(email.from_addr || email.from || '') ||
    ''

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e) {
      if (snoozeRef.current && !snoozeRef.current.contains(e.target)) setShowSnoozeFor(null)
      if (followUpRef.current && !followUpRef.current.contains(e.target)) setShowFollowUpFor(null)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [setShowSnoozeFor, setShowFollowUpFor])

  return (
    <div className="flex h-full flex-col">
      {/* Action bar */}
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 md:hidden dark:text-slate-400 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="flex items-center gap-1">
          {/* Mark as read */}
          <button
            onClick={onMarkRead}
            className="rounded-md p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            title="Mark as read"
          >
            <CheckCheck className="h-4 w-4" />
          </button>

          {/* Star */}
          <button
            onClick={onStar}
            className="rounded-md p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-amber-500 dark:text-slate-400 dark:hover:bg-slate-800"
            title="Toggle star"
          >
            <Star
              className={classNames(
                'h-4 w-4',
                email.is_starred ? 'fill-amber-400 text-amber-400' : ''
              )}
            />
          </button>

          {/* Archive */}
          <button
            onClick={onArchive}
            className="rounded-md p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            title="Archive"
          >
            <Archive className="h-4 w-4" />
          </button>

          {/* Snooze */}
          <div className="relative" ref={snoozeRef}>
            <button
              onClick={() => setShowSnoozeFor(showSnoozeFor === email.id ? null : email.id)}
              className="rounded-md p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              title="Snooze"
            >
              <Clock className="h-4 w-4" />
            </button>
            {showSnoozeFor === email.id && (
              <div className="absolute right-0 top-9 z-20 w-52 rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
                <p className="border-b border-slate-100 px-3 py-2 text-xs font-semibold text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  Snooze until...
                </p>
                {SNOOZE_OPTIONS.map((opt) => (
                  <button
                    key={opt.hours}
                    onClick={() => onSnooze(opt.hours)}
                    className="flex w-full items-center px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Create Task */}
          <button
            onClick={onCreateTask}
            className="rounded-md p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            title="Create task"
          >
            <CheckSquare className="h-4 w-4" />
          </button>

          {/* Follow-up flag */}
          <div className="relative" ref={followUpRef}>
            <button
              onClick={() => setShowFollowUpFor(showFollowUpFor === email.id ? null : email.id)}
              className={classNames(
                'rounded-md p-2 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800',
                hasFollowUp
                  ? 'text-orange-500'
                  : 'text-slate-500 dark:text-slate-400 dark:hover:text-slate-200'
              )}
              title="Set follow-up reminder"
            >
              <Flag className={classNames('h-4 w-4', hasFollowUp ? 'fill-orange-400' : '')} />
            </button>
            {showFollowUpFor === email.id && (
              <div className="absolute right-0 top-9 z-20 w-56 rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
                <p className="border-b border-slate-100 px-3 py-2 text-xs font-semibold text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  Follow-up reminder
                </p>
                {FOLLOW_UP_OPTIONS.map((opt) => (
                  <button
                    key={opt.days}
                    onClick={() => onFollowUp(opt.days)}
                    className="flex w-full items-center px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-start gap-3">
            <div
              className={classNames(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
                CATEGORY_BADGE[email.category]
                  ? CATEGORY_BADGE[email.category].split(' ').slice(0, 2).join(' ')
                  : 'bg-gray-100 text-gray-600'
              )}
            >
              {getInitials(senderDisplay) || senderDisplay.charAt(0).toUpperCase() || '?'}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                {email.subject}
              </h2>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {senderDisplay}
                </span>
                <span>&lt;{email.from}&gt;</span>
                <span className="hidden sm:inline">to {email.to || 'me'}</span>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  {formatDate(email.date || email.received_at)}
                  {' \u00B7 '}
                  {formatRelativeTime(email.date || email.received_at)}
                </span>
                <span
                  className={classNames(
                    'inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                    badgeClass
                  )}
                >
                  {email.category}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* AI Summary */}
        {email.ai_summary && (
          <div className="mb-4 rounded-lg border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-800 dark:bg-indigo-950/30">
            <div className="mb-1.5 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-indigo-500" />
              <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                AI Summary
              </span>
            </div>
            <p className="text-sm leading-relaxed text-indigo-900 dark:text-indigo-200">
              {email.ai_summary}
            </p>
          </div>
        )}

        {/* Email body */}
        <div className="mb-6 whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          {email.body || email.snippet}
        </div>

        {/* Action items */}
        {email.action_items?.length > 0 && (
          <div className="mb-6 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
            <div className="mb-2 flex items-center gap-1.5">
              <CheckSquare className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Action Items
              </span>
            </div>
            <ul className="space-y-1.5">
              {email.action_items.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <span className="mt-1.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* AI Reply section */}
        <ReplyDraft
          email={email}
          onSend={() => {}}
        />
      </div>
    </div>
  )
}
