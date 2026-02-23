import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Mail, Calendar, Receipt, Users, BarChart3, Zap, ArrowRight, Check,
  ChevronDown, ChevronUp, Star, Menu, X, Sparkles, Globe, Bot, Play,
  Shield, Lock, Server, FileCheck, Plug, MessageSquare,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import DashboardMockup from '../components/landing/DashboardMockup'

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const FEATURES = [
  {
    tag: 'SMART INBOX',
    tagColor: 'text-blue-600 bg-blue-50',
    icon: Mail,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    headline: 'Never miss an important email again',
    description: 'LytheraHub reads every incoming email and instantly classifies it — urgent client messages rise to the top while newsletters and spam fade away. Get one-line AI summaries so you know what matters without reading the full email. Draft professional replies in seconds with AI that knows your tone.',
    bullets: [
      'AI classifies every email: urgent, client, invoice, newsletter',
      'One-line summaries — know what matters at a glance',
      'AI-drafted replies tailored to your tone and context',
      'Action items extracted automatically from every thread',
    ],
    testimonial: {
      quote: 'I used to spend 2 hours every morning sorting emails. Now LytheraHub does it in seconds and I start my day with a clear priority list.',
      name: 'Sarah Chen',
      role: 'Founder at BrightPath Digital',
    },
    mockup: 'inbox',
  },
  {
    tag: 'AI CALENDAR',
    tagColor: 'text-violet-600 bg-violet-50',
    icon: Calendar,
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    headline: 'Walk into every meeting prepared',
    description: 'Before every meeting, LytheraHub automatically pulls the client context you need — open invoices, last email exchanges, recent activity, and key talking points. No more scrambling 5 minutes before a call.',
    bullets: [
      'Auto-generated meeting prep briefs with full client context',
      'Open invoices and last interactions shown at a glance',
      'Smart scheduling that respects your focus time blocks',
      'Post-meeting summaries and action items captured instantly',
    ],
    mockup: 'calendar',
  },
  {
    tag: 'INVOICE TRACKER',
    tagColor: 'text-emerald-600 bg-emerald-50',
    icon: Receipt,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    headline: 'Get paid on time, every time',
    description: 'Track every invoice from sent to paid in one view. LytheraHub predicts which clients will pay late before they do, and sends automated payment reminders on your schedule so you never have to chase money manually again.',
    bullets: [
      'Track every invoice from sent to paid in one view',
      'AI predicts late payments before they happen',
      'Automated escalating reminders on your schedule',
      'Revenue forecasting with trend analysis and projections',
    ],
    testimonial: {
      quote: 'The invoice tracker predicted which clients would pay late with scary accuracy. We reduced our average collection time from 34 days to 12 days.',
      name: 'Marco Weber',
      role: 'Managing Director, Weber Consulting GmbH',
    },
    mockup: 'invoices',
  },
  {
    tag: 'CRM PIPELINE',
    tagColor: 'text-amber-600 bg-amber-50',
    icon: Users,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    headline: 'See your entire pipeline at a glance',
    description: 'A visual kanban board that shows every deal from first contact to closed-won. Drag and drop clients between stages. AI enriches contact details and scores leads based on engagement signals so you know where to focus.',
    bullets: [
      'Drag-and-drop kanban board for visual deal tracking',
      'AI enrichment fills in company and contact details',
      'Full activity timeline across email, calls, and meetings',
      'Stale lead detection — never let a deal go cold',
    ],
    mockup: 'clients',
  },
  {
    tag: 'AI REPORTS',
    tagColor: 'text-rose-600 bg-rose-50',
    icon: BarChart3,
    color: 'text-rose-600',
    bg: 'bg-rose-50',
    headline: 'Know exactly how your business is performing',
    description: 'Every morning, LytheraHub delivers a briefing with your priorities, metrics, and action items. Weekly and monthly deep-dives surface trends you would have missed. Ask questions in plain English and get data-backed answers.',
    bullets: [
      'Daily morning briefings with priorities and action items',
      'Weekly and monthly performance deep-dives',
      'Revenue, pipeline, and productivity charts in real-time',
      'AI-generated recommendations based on your data',
    ],
    testimonial: {
      quote: "I open LytheraHub, read my AI briefing, and I know exactly what to focus on. It's like having a chief of staff for €49/month.",
      name: 'Jenna Cruz',
      role: 'Freelance Designer, Studio Jenna',
    },
    mockup: 'reports',
  },
  {
    tag: 'AUTOMATIONS',
    tagColor: 'text-cyan-600 bg-cyan-50',
    icon: Zap,
    color: 'text-cyan-600',
    bg: 'bg-cyan-50',
    headline: 'Put your repetitive work on autopilot',
    description: 'Pre-built automation templates handle the work you do every day — new lead onboarding sequences, invoice follow-up chains, meeting prep generation, and Slack notifications. Activate with one click. Customize when you need to.',
    bullets: [
      '50+ pre-built workflow templates for common tasks',
      'New lead onboarding sequences that run automatically',
      'Invoice follow-up chains that never forget a payment',
      'Slack notifications and custom workflow builder',
    ],
    mockup: 'automations',
  },
]

const STEPS = [
  {
    num: 1,
    icon: Plug,
    title: 'Connect Your Tools',
    time: '2 minutes',
    desc: 'Link Gmail, Google Calendar, Slack, and Stripe in one click. No complex setup. No developer needed. Just authorize and go.',
  },
  {
    num: 2,
    icon: Bot,
    title: 'AI Organizes Everything',
    time: 'Instant',
    desc: 'Our AI classifies your emails, generates meeting prep briefs, tracks invoices, and enriches your client data — all automatically, from the moment you connect.',
  },
  {
    num: 3,
    icon: Sparkles,
    title: 'You Focus on What Matters',
    time: 'Every day',
    desc: 'Get a morning briefing with your priorities. Ask questions in plain English. Let automations handle the rest. Your time is yours again.',
  },
]

const INTEGRATIONS = [
  { name: 'Gmail', icon: '✉️', available: true },
  { name: 'Google Calendar', icon: '📅', available: true },
  { name: 'Google Drive', icon: '📁', available: true },
  { name: 'Google Sheets', icon: '📊', available: true },
  { name: 'Slack', icon: '💬', available: true },
  { name: 'Stripe', icon: '💳', available: true },
  { name: 'n8n', icon: '⚡', available: true },
  { name: 'Zapier', icon: '🔗', available: false },
  { name: 'Notion', icon: '📝', available: false },
  { name: 'WhatsApp Business', icon: '📱', available: false },
  { name: 'HubSpot', icon: '🎯', available: false },
  { name: 'Discord', icon: '🎮', available: false },
]

const TESTIMONIALS = [
  {
    quote: 'LytheraHub saved us 15 hours a week on admin work. The AI email classification alone was worth the subscription — I went from 200+ unread emails daily to a clean, prioritized inbox. The morning briefing is like having a personal executive assistant.',
    name: 'Sarah Chen',
    role: 'Founder & CEO',
    company: 'BrightPath Digital',
    location: 'Munich, Germany',
    stars: 5,
  },
  {
    quote: 'The invoice tracker predicted which clients would pay late with scary accuracy. We reduced our average payment collection time from 34 days to 12 days. That\'s real cash flow impact.',
    name: 'Marco Weber',
    role: 'Managing Director',
    company: 'Weber Consulting GmbH',
    location: 'Berlin, Germany',
    stars: 5,
  },
  {
    quote: "I used to start every morning checking 6 different apps. Now I open LytheraHub, read my AI briefing, and I know exactly what to focus on. It's like having a chief of staff for €49/month.",
    name: 'Jenna Cruz',
    role: 'Freelance Designer',
    company: 'Studio Jenna',
    location: 'Lisbon, Portugal',
    stars: 5,
  },
]

const PLANS = [
  {
    name: 'Free',
    monthly: 0,
    annual: 0,
    desc: 'Get started with the essentials',
    badge: null,
    cta: 'Start Free',
    features: [
      '1 email account',
      '5 clients',
      'Basic AI reports',
      'Community support',
      'Morning briefing',
    ],
  },
  {
    name: 'Pro',
    monthly: 49,
    annual: 39,
    desc: 'Everything you need to grow',
    badge: 'MOST POPULAR',
    cta: 'Start Pro Trial',
    features: [
      'Unlimited email accounts',
      'Unlimited clients',
      'All integrations',
      'AI reports & analytics',
      'Slack bot',
      'Priority support',
      'Custom automations',
    ],
  },
  {
    name: 'Business',
    monthly: 149,
    annual: 119,
    desc: 'For teams and agencies',
    badge: 'BEST VALUE',
    cta: 'Contact Sales',
    features: [
      'Everything in Pro',
      'Team members (up to 10)',
      'Custom automations',
      'API access',
      'Dedicated account manager',
      'SSO & advanced security',
      'SLA guarantee',
    ],
  },
]

const FAQS = [
  { q: 'What is LytheraHub?', icon: '🚀', a: 'LytheraHub is an AI-powered business operations dashboard that connects all your tools — email, calendar, invoices, CRM, and more — into a single command center. It uses advanced AI to automate admin work, generate reports, and keep your business running smoothly.' },
  { q: 'Do I need to connect all my tools?', icon: '🔗', a: "No, start with just one integration and add more whenever you're ready. LytheraHub works with Gmail, Google Calendar, Stripe, Slack, and more. Each integration unlocks new automation capabilities, but even a single connection provides immediate value." },
  { q: 'Is my data secure?', icon: '🔒', a: 'Absolutely. We use enterprise-grade AES-256 encryption at rest and TLS 1.3 in transit. All data is isolated per account in a multi-tenant architecture. We never share your data with third parties, never train AI on your data, and you can export or delete everything at any time. Fully GDPR compliant with EU data centers.' },
  { q: 'Can I try it for free?', icon: '🎁', a: 'Yes! Our Free plan includes one email account, five clients, basic AI reports, and a daily morning briefing — no credit card required. You can upgrade to Pro at any time to unlock unlimited capabilities.' },
  { q: 'How does the AI work?', icon: '🤖', a: "We use Claude, Anthropic's advanced AI, to analyze your emails, meetings, invoices, and client interactions. The AI classifies incoming messages, generates meeting prep briefs, predicts payment timelines, drafts replies, and compiles daily and weekly business reports — all tailored to your specific business context. Your data is processed securely and never used for training." },
  { q: 'Can I use it with my team?', icon: '👥', a: 'Yes! The Business plan supports up to 10 team members with role-based access, shared pipelines, team analytics, and collaborative automations. Each team member gets their own inbox view while sharing the company-wide CRM and reporting.' },
  { q: 'Can I cancel anytime?', icon: '✨', a: 'Yes, no long-term contracts or hidden fees. You can downgrade to the free plan or cancel entirely at any time from your Settings page. If you cancel a paid plan, you keep access until the end of your current billing period.' },
  { q: 'Do you offer refunds?', icon: '💳', a: "If you're not satisfied within the first 14 days of a paid plan, we'll issue a full refund — no questions asked. After that, you can cancel anytime but refunds are not available for partial billing periods." },
]

const FOOTER_LINKS = {
  Product: [
    { label: 'Features', href: '#features' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'Demo', href: '/dashboard' },
    { label: 'API', href: '#' },
  ],
  Company: [
    { label: 'About', href: '#' },
    { label: 'Blog', href: '#' },
    { label: 'Careers', href: '#' },
    { label: 'Contact', href: '#' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Cookie Policy', href: '/cookies' },
    { label: 'GDPR', href: '/privacy' },
  ],
  Connect: [
    { label: 'Twitter / X', href: '#' },
    { label: 'LinkedIn', href: '#' },
    { label: 'GitHub', href: '#' },
  ],
}

/* ------------------------------------------------------------------ */
/*  Feature Mockup — stylized mini UI for each feature                 */
/* ------------------------------------------------------------------ */

function FeatureMockup({ type, color }) {
  const mockups = {
    inbox: (
      <div className="space-y-2 p-1">
        {[
          { from: 'Frank Hartmann', subject: 'Urgent: IoT dashboard issue', badge: 'Urgent', badgeColor: 'bg-red-100 text-red-700' },
          { from: 'Hans Weber', subject: 'Q1 contract review meeting', badge: 'Client', badgeColor: 'bg-blue-100 text-blue-700' },
          { from: 'Stripe', subject: 'Payment received — €3,200', badge: 'Invoice', badgeColor: 'bg-emerald-100 text-emerald-700' },
          { from: 'TechCrunch Daily', subject: 'Top stories this week', badge: 'Newsletter', badgeColor: 'bg-slate-100 text-slate-600' },
        ].map((email, i) => (
          <div key={i} className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 ${i === 0 ? 'border-blue-200 bg-blue-50/50' : 'border-slate-200 bg-white'}`}>
            <div className="min-w-0">
              <div className="font-semibold text-slate-800 text-[11px] truncate">{email.from}</div>
              <div className="text-slate-500 text-[10px] truncate">{email.subject}</div>
            </div>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-medium ${email.badgeColor}`}>{email.badge}</span>
          </div>
        ))}
      </div>
    ),
    calendar: (
      <div className="p-1 space-y-2">
        <div className="grid grid-cols-5 gap-1 text-[9px] text-center text-slate-400 font-medium">
          {['MON', 'TUE', 'WED', 'THU', 'FRI'].map(d => <div key={d}>{d}</div>)}
        </div>
        <div className="grid grid-cols-5 gap-1">
          {[14,15,16,17,18].map(d => (
            <div key={d} className={`rounded-lg border p-1.5 text-center ${d === 16 ? 'border-blue-300 bg-blue-50' : 'border-slate-200 bg-white'}`}>
              <div className="text-[10px] font-semibold text-slate-700">{d}</div>
              {d === 16 && <div className="mt-1 rounded bg-blue-600 text-white text-[8px] px-1 py-0.5">Standup</div>}
              {d === 16 && <div className="mt-0.5 rounded bg-violet-600 text-white text-[8px] px-1 py-0.5">Client Call</div>}
              {d === 17 && <div className="mt-1 rounded bg-emerald-600 text-white text-[8px] px-1 py-0.5">Review</div>}
            </div>
          ))}
        </div>
        <div className="rounded-lg border border-violet-200 bg-violet-50 px-3 py-2">
          <div className="text-[10px] font-semibold text-violet-800">Meeting Prep: Hans Weber</div>
          <div className="text-[9px] text-violet-600 mt-0.5">Open invoice: €3,200 · Last email: 2 days ago</div>
        </div>
      </div>
    ),
    invoices: (
      <div className="p-1 space-y-2">
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Outstanding', value: '€34K', color: 'text-amber-600' },
            { label: 'Overdue', value: '€11.7K', color: 'text-red-600' },
            { label: 'Paid (Mo)', value: '€27.6K', color: 'text-emerald-600' },
          ].map(s => (
            <div key={s.label} className="rounded-lg border border-slate-200 bg-white p-2 text-center">
              <div className="text-[9px] text-slate-400">{s.label}</div>
              <div className={`font-bold text-sm ${s.color}`}>{s.value}</div>
            </div>
          ))}
        </div>
        <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
          <table className="w-full text-[10px]">
            <thead><tr className="border-b border-slate-100 text-slate-400">
              <th className="text-left px-2 py-1.5 font-medium">Client</th>
              <th className="text-right px-2 py-1.5 font-medium">Amount</th>
              <th className="text-right px-2 py-1.5 font-medium">Status</th>
            </tr></thead>
            <tbody>
              {[
                { client: 'CloudFirst AG', amount: '€7,200', status: 'Overdue', sColor: 'text-red-600 bg-red-50' },
                { client: 'TechVision', amount: '€3,200', status: 'Pending', sColor: 'text-amber-600 bg-amber-50' },
                { client: 'BioPharm', amount: '€5,800', status: 'Paid', sColor: 'text-emerald-600 bg-emerald-50' },
              ].map(inv => (
                <tr key={inv.client} className="border-b border-slate-50">
                  <td className="px-2 py-1.5 text-slate-700 font-medium">{inv.client}</td>
                  <td className="px-2 py-1.5 text-right text-slate-600">{inv.amount}</td>
                  <td className="px-2 py-1.5 text-right"><span className={`rounded-full px-1.5 py-0.5 text-[9px] font-medium ${inv.sColor}`}>{inv.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    ),
    clients: (
      <div className="p-1">
        <div className="flex gap-2 overflow-hidden">
          {[
            { stage: 'Lead', color: 'bg-slate-600', items: ['DataStream', 'GreenEnergy'] },
            { stage: 'Proposal', color: 'bg-blue-600', items: ['SecureNet', 'BrightPath'] },
            { stage: 'Won', color: 'bg-emerald-600', items: ['TechVision', 'SmartHome'] },
          ].map(col => (
            <div key={col.stage} className="flex-1 min-w-0">
              <div className={`rounded-t-lg ${col.color} text-white text-[9px] font-semibold px-2 py-1 text-center`}>{col.stage}</div>
              <div className="space-y-1 mt-1">
                {col.items.map(name => (
                  <div key={name} className="rounded-lg border border-slate-200 bg-white px-2 py-1.5">
                    <div className="text-[10px] font-medium text-slate-700 truncate">{name}</div>
                    <div className="text-[8px] text-slate-400">SaaS · €5K</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
    reports: (
      <div className="p-1 space-y-2">
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
          <div className="text-[10px] font-semibold text-blue-800">Morning Briefing</div>
          <div className="text-[9px] text-blue-600 mt-0.5 space-y-0.5">
            <div>3 urgent emails need replies</div>
            <div>2 meetings today — prep briefs ready</div>
            <div>€11,700 overdue across 2 invoices</div>
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-2">
          <div className="text-[10px] font-medium text-slate-700 mb-1">Revenue (6mo)</div>
          <div className="flex items-end gap-1 h-12">
            {[40, 55, 45, 60, 70, 80].map((h, i) => (
              <div key={i} className="flex-1 rounded-t bg-blue-500" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
      </div>
    ),
    automations: (
      <div className="p-1 space-y-1.5">
        {[
          { name: 'Invoice Reminders', active: true, runs: 42 },
          { name: 'Meeting Prep', active: true, runs: 28 },
          { name: 'Lead Onboarding', active: true, runs: 15 },
          { name: 'Slack Digest', active: false, runs: 0 },
        ].map(wf => (
          <div key={wf.name} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2">
            <div>
              <div className="text-[10px] font-medium text-slate-700">{wf.name}</div>
              {wf.active && <div className="text-[8px] text-slate-400">{wf.runs} runs</div>}
            </div>
            <div className={`w-8 h-4 rounded-full flex items-center px-0.5 ${wf.active ? 'bg-emerald-500 justify-end' : 'bg-slate-300 justify-start'}`}>
              <div className="w-3 h-3 rounded-full bg-white shadow-sm" />
            </div>
          </div>
        ))}
      </div>
    ),
  }

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg overflow-hidden">
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
        <div className="w-2 h-2 rounded-full bg-red-400" />
        <div className="w-2 h-2 rounded-full bg-yellow-400" />
        <div className="w-2 h-2 rounded-full bg-green-400" />
      </div>
      <div className="text-xs">
        {mockups[type] || mockups.inbox}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  FAQ Item                                                           */
/* ------------------------------------------------------------------ */

function FAQItem({ question, answer, icon }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left bg-white dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
      >
        <span className="flex items-center gap-3 text-base font-semibold text-slate-900 dark:text-white">
          {icon && <span className="text-xl">{icon}</span>}
          {question}
        </span>
        {open ? (
          <ChevronUp className="w-5 h-5 shrink-0 text-slate-400" />
        ) : (
          <ChevronDown className="w-5 h-5 shrink-0 text-slate-400" />
        )}
      </button>
      <div className={`grid transition-all duration-300 ease-in-out ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          <p className="px-6 pb-5 pt-0 text-slate-600 dark:text-slate-400 leading-relaxed">{answer}</p>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Landing Page                                                       */
/* ------------------------------------------------------------------ */

export default function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [annual, setAnnual] = useState(false)
  const { loginDemo, hasAccess } = useAuth()
  const navigate = useNavigate()

  // Waitlist banner
  const [bannerVisible, setBannerVisible] = useState(
    () => sessionStorage.getItem('banner_dismissed') !== 'true'
  )
  const [bannerEmail, setBannerEmail] = useState('')
  const [bannerSubmitted, setBannerSubmitted] = useState(false)
  const [bannerHeight, setBannerHeight] = useState(0)
  const bannerRef = useRef(null)

  useEffect(() => {
    if (!bannerVisible) { setBannerHeight(0); return }
    const measure = () => {
      if (bannerRef.current) setBannerHeight(bannerRef.current.offsetHeight)
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [bannerVisible])

  const dismissBanner = () => {
    sessionStorage.setItem('banner_dismissed', 'true')
    setBannerVisible(false)
  }

  const handleWaitlistSubmit = (e) => {
    e.preventDefault()
    if (!bannerEmail || !/\S+@\S+\.\S+/.test(bannerEmail)) return
    setBannerSubmitted(true)
  }

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

  const handleStartFree = async () => {
    if (!hasAccess) { scrollToTop(); return }
    try {
      await loginDemo()
      navigate('/dashboard')
    } catch {
      navigate('/dashboard')
    }
  }

  const scrollTo = (id) => {
    setMobileMenuOpen(false)
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white overflow-x-hidden" style={{ paddingTop: bannerVisible ? bannerHeight : 0 }}>

      {/* ============================================================ */}
      {/*  WAITLIST BANNER                                             */}
      {/* ============================================================ */}
      {bannerVisible && (
        <div ref={bannerRef} className="fixed top-0 left-0 right-0 z-[60] bg-slate-900 py-2.5 px-4">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
            {/* Left */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-medium text-blue-400">Private Beta</span>
              <span className="text-sm text-slate-300 hidden sm:inline">LytheraHub is currently in private beta.</span>
            </div>
            {/* Center */}
            <div className="flex items-center">
              {bannerSubmitted ? (
                <span className="text-sm font-medium text-green-400">You&apos;re on the list!</span>
              ) : (
                <form onSubmit={handleWaitlistSubmit} className="flex items-center">
                  <input
                    type="email"
                    value={bannerEmail}
                    onChange={(e) => setBannerEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-1.5 w-56 outline-none focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3 py-1.5 rounded-lg ml-2 whitespace-nowrap"
                  >
                    Join Waitlist
                  </button>
                </form>
              )}
            </div>
            {/* Right */}
            <button onClick={dismissBanner} className="text-slate-400 hover:text-white shrink-0" aria-label="Dismiss banner">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/*  STICKY NAVIGATION                                           */}
      {/* ============================================================ */}
      <nav className="sticky z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md" style={{ top: bannerVisible ? bannerHeight : 0 }}>
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center">
            <img src="/logo-full.png" className="h-12" alt="LytheraHub" />
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <button onClick={() => scrollTo('features')} className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 transition-colors cursor-pointer">Features</button>
            <button onClick={() => scrollTo('how-it-works')} className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 transition-colors cursor-pointer">How it Works</button>
            <button onClick={() => scrollTo('integrations')} className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 transition-colors cursor-pointer">Integrations</button>
            <button onClick={() => scrollTo('pricing')} className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 transition-colors cursor-pointer">Pricing</button>
            <button onClick={() => scrollTo('faq')} className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 transition-colors cursor-pointer">FAQ</button>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <button onClick={() => hasAccess ? navigate('/login') : scrollToTop()} className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 transition-colors px-3 py-2 cursor-pointer">
              Sign In
            </button>
            <button onClick={handleStartFree} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors cursor-pointer">
              Start Free <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-4 space-y-1">
            {['features', 'how-it-works', 'integrations', 'pricing', 'faq'].map((id) => (
              <button key={id} onClick={() => scrollTo(id)} className="block w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 cursor-pointer capitalize">
                {id.replace(/-/g, ' ')}
              </button>
            ))}
            <hr className="my-2 border-slate-200" />
            <button onClick={() => { setMobileMenuOpen(false); hasAccess ? navigate('/login') : scrollToTop() }} className="block w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 cursor-pointer">Sign In</button>
            <button onClick={handleStartFree} className="mt-1 w-full rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 cursor-pointer">Start Free</button>
          </div>
        )}
      </nav>

      {/* ============================================================ */}
      {/*  SECTION 1: HERO                                              */}
      {/* ============================================================ */}
      <section className="py-20 sm:py-28 lg:py-36">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] text-slate-900 dark:text-white">
              Your Business on Autopilot
            </h1>
            <p className="mt-6 text-lg sm:text-xl leading-relaxed text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              The AI-powered command center that connects your email, calendar, invoices, and clients into one intelligent dashboard. Stop switching between 12 tabs. Stop forgetting follow-ups. Stop losing revenue to missed invoices. LytheraHub handles the admin so you can focus on growing your business.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={handleStartFree}
                className="group inline-flex items-center gap-2 rounded-lg bg-blue-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-blue-600/25 hover:bg-blue-700 hover:shadow-xl transition-all cursor-pointer"
              >
                Start Free <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
              <button
                onClick={() => hasAccess ? scrollTo('features') : scrollToTop()}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 px-8 py-3.5 text-base font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer"
              >
                <Play className="w-4 h-4" /> Watch Demo
              </button>
            </div>
            <p className="mt-6 text-sm text-slate-400">
              No credit card required &middot; Free forever plan &middot; Setup in 2 minutes
            </p>
          </div>

          {/* Dashboard Mockup */}
          <div className="mt-16 mx-auto max-w-5xl">
            <div className="relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl shadow-slate-300/40 dark:shadow-slate-900/50 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
                <span className="ml-3 text-xs text-slate-400 font-mono">app.lytherahub.com/dashboard</span>
              </div>
              <div className="min-h-[320px] sm:min-h-[400px]">
                <DashboardMockup />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  SECTION 2: SOCIAL PROOF BAR                                  */}
      {/* ============================================================ */}
      <section className="py-16 border-y border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm font-medium text-slate-400 uppercase tracking-wider mb-10">
            Trusted by 500+ businesses across Europe
          </p>

          {/* Logo row */}
          <div className="flex items-center justify-center gap-8 sm:gap-12 flex-wrap mb-14">
            {[
              { name: 'Acme Corp', icon: '◆' },
              { name: 'TechFlow', icon: '▲' },
              { name: 'NovaBuild', icon: '●' },
              { name: 'DataPeak', icon: '◇' },
              { name: 'StratEdge', icon: '■' },
              { name: 'Cloudly', icon: '☁' },
            ].map((company) => (
              <div key={company.name} className="flex items-center gap-1.5 text-slate-400 opacity-60 hover:opacity-100 transition-opacity">
                <span className="text-lg">{company.icon}</span>
                <span className="text-sm font-bold tracking-wide">{company.name}</span>
              </div>
            ))}
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
            {[
              { value: '93%', label: 'Time Saved', sub: 'on daily admin tasks' },
              { value: '50+', label: 'Automations', sub: 'pre-built templates' },
              { value: '10,000+', label: 'Emails Classified', sub: 'every month' },
              { value: '500+', label: 'Businesses', sub: 'trust LytheraHub' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">{stat.value}</div>
                <div className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-300">{stat.label}</div>
                <div className="text-xs text-slate-400">{stat.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  SECTION 3: FEATURE DEEP-DIVES                                */}
      {/* ============================================================ */}
      <section id="features" className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-20">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
              Everything You Need, One Dashboard
            </h2>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
              Six powerful modules that work together to automate your entire business operations.
            </p>
          </div>

          <div className="space-y-28 lg:space-y-36">
            {FEATURES.map((feature, idx) => {
              const Icon = feature.icon
              const reversed = idx % 2 === 1
              return (
                <div key={feature.tag} className={`flex flex-col ${reversed ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center gap-12 lg:gap-20`}>
                  {/* Text */}
                  <div className="flex-1 max-w-xl">
                    <span className={`inline-block text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4 ${feature.tagColor}`}>
                      {feature.tag}
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white leading-tight">
                      {feature.headline}
                    </h3>
                    <p className="mt-4 text-slate-600 dark:text-slate-400 leading-relaxed">
                      {feature.description}
                    </p>
                    <ul className="mt-6 space-y-3">
                      {feature.bullets.map((bullet) => (
                        <li key={bullet} className="flex items-start gap-3 text-slate-600 dark:text-slate-400">
                          <Check className="w-5 h-5 mt-0.5 shrink-0 text-blue-500" />
                          <span className="text-sm leading-relaxed">{bullet}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Inline testimonial */}
                    {feature.testimonial && (
                      <div className="mt-8 border-l-2 border-blue-300 pl-4">
                        <p className="text-sm text-slate-500 dark:text-slate-400 italic leading-relaxed">
                          "{feature.testimonial.quote}"
                        </p>
                        <p className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                          — {feature.testimonial.name}, <span className="font-normal text-slate-500">{feature.testimonial.role}</span>
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Feature mockup */}
                  <div className="flex-1 w-full max-w-md">
                    <FeatureMockup type={feature.mockup} color={feature.color} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  SECTION 4: HOW IT WORKS                                      */}
      {/* ============================================================ */}
      <section id="how-it-works" className="py-24 sm:py-32 bg-slate-50 dark:bg-slate-900/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
              Up and Running in 3 Steps
            </h2>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
              Connect your tools, let AI do the heavy lifting, and get your time back.
            </p>
          </div>

          <div className="relative grid gap-8 md:grid-cols-3 max-w-4xl mx-auto">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-12 left-[calc(16.66%+40px)] right-[calc(16.66%+40px)] h-px bg-slate-300 dark:bg-slate-700" />

            {STEPS.map((step) => {
              const Icon = step.icon
              return (
                <div key={step.num} className="relative text-center">
                  <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 mb-6 shadow-sm">
                    <Icon className="w-8 h-8 text-blue-600" />
                    <span className="absolute -top-2 -right-2 flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold shadow-md">
                      {step.num}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{step.title}</h3>
                  <span className="inline-block mt-1 text-xs font-medium text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">{step.time}</span>
                  <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">{step.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  SECTION 5: INTEGRATION LOGOS                                  */}
      {/* ============================================================ */}
      <section id="integrations" className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
              Connects With the Tools You Already Use
            </h2>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
              Seamlessly integrate with your favorite software. No migration needed.
            </p>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4 max-w-4xl mx-auto">
            {INTEGRATIONS.map((integration) => (
              <div
                key={integration.name}
                className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition-all ${
                  integration.available
                    ? 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-300 hover:shadow-md'
                    : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 opacity-50'
                }`}
              >
                <span className="text-2xl">{integration.icon}</span>
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300 text-center leading-tight">{integration.name}</span>
                {!integration.available && (
                  <span className="text-[9px] font-medium text-slate-400 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded-full">Soon</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  SECTION 6: SECURITY & TRUST                                  */}
      {/* ============================================================ */}
      <section className="py-24 sm:py-32 bg-slate-50 dark:bg-slate-900/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
              Enterprise-Grade Security You Can Trust
            </h2>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
              Your data is encrypted, protected, and never shared.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto mb-12">
            {[
              { icon: Lock, label: 'SSL Encrypted', sub: 'TLS 1.3 in transit' },
              { icon: Shield, label: 'GDPR Compliant', sub: 'Full data rights' },
              { icon: FileCheck, label: 'AES-256', sub: 'Encryption at rest' },
              { icon: Server, label: 'EU Data Centers', sub: 'Frankfurt, Germany' },
            ].map((badge) => {
              const Icon = badge.icon
              return (
                <div key={badge.label} className="flex flex-col items-center text-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center mb-3">
                    <Icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{badge.label}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{badge.sub}</p>
                </div>
              )
            })}
          </div>

          <p className="max-w-2xl mx-auto text-center text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            LytheraHub uses industry-standard encryption for all data in transit and at rest. Your Google tokens are stored with AES-256 encryption. We never sell your data. We never train on your data. Your business information stays yours.
          </p>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  SECTION 7: TESTIMONIALS                                      */}
      {/* ============================================================ */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
              What Our Customers Say
            </h2>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
              Trusted by small business owners and agencies across Europe.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 flex flex-col">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-6 flex-1">"{t.quote}"</p>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{t.name}</p>
                  <p className="text-sm text-slate-500">{t.role}, {t.company}</p>
                  <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                    <Globe className="w-3 h-3" /> {t.location}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  SECTION 8: PRICING                                           */}
      {/* ============================================================ */}
      <section id="pricing" className="py-24 sm:py-32 bg-slate-50 dark:bg-slate-900/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
              Simple, Transparent Pricing
            </h2>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
              Start free, upgrade when you need more. No surprises.
            </p>
          </div>

          {/* Annual/Monthly toggle */}
          <div className="flex items-center justify-center gap-3 mb-12">
            <span className={`text-sm font-medium ${!annual ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>Monthly</span>
            <button
              onClick={() => setAnnual(!annual)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors ${annual ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'}`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform mt-0.5 ${annual ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
            <span className={`text-sm font-medium ${annual ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>
              Annual <span className="text-blue-600 font-semibold">(-20%)</span>
            </span>
          </div>

          <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto items-start">
            {PLANS.map((plan) => {
              const price = annual ? plan.annual : plan.monthly
              const isPro = plan.name === 'Pro'
              return (
                <div
                  key={plan.name}
                  className={`relative flex flex-col rounded-2xl border p-8 transition-all hover:shadow-lg ${
                    isPro
                      ? 'border-blue-500 bg-white dark:bg-slate-800 shadow-lg scale-[1.02] lg:scale-105'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60'
                  }`}
                >
                  {plan.badge && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <span className={`inline-flex items-center gap-1 rounded-full px-4 py-1 text-xs font-bold uppercase tracking-wider text-white ${
                        isPro ? 'bg-blue-600' : 'bg-emerald-600'
                      }`}>
                        {isPro && <Star className="w-3 h-3 fill-current" />}
                        {plan.badge}
                      </span>
                    </div>
                  )}

                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{plan.name}</h3>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{plan.desc}</p>

                  <div className="mt-6 flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-slate-900 dark:text-white">&euro;{price}</span>
                    <span className="text-slate-500 text-sm">/month</span>
                  </div>
                  {annual && price > 0 && (
                    <p className="mt-1 text-xs text-blue-600">Billed annually (&euro;{price * 12}/year)</p>
                  )}

                  <ul className="mt-8 flex flex-col gap-3 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-300">
                        <Check className="w-4 h-4 mt-0.5 shrink-0 text-blue-500" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={plan.name !== 'Business' ? handleStartFree : undefined}
                    className={`mt-8 w-full py-3 px-6 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                      isPro
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-600'
                    }`}
                  >
                    {plan.cta}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  SECTION 9: FAQ                                               */}
      {/* ============================================================ */}
      <section id="faq" className="py-24 sm:py-32">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
              Frequently Asked Questions
            </h2>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
              Everything you need to know about LytheraHub.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            {FAQS.map((faq) => (
              <FAQItem key={faq.q} question={faq.q} answer={faq.a} icon={faq.icon} />
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  SECTION 10: FINAL CTA                                        */}
      {/* ============================================================ */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-slate-900 px-8 py-16 sm:px-16 sm:py-20 text-center">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-transparent" />
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-bold text-white">
                Ready to Put Your Business on Autopilot?
              </h2>
              <p className="mt-4 text-lg text-slate-300 max-w-xl mx-auto">
                Join hundreds of business owners who save 15+ hours every week with LytheraHub.
              </p>
              <button
                onClick={handleStartFree}
                className="mt-8 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-8 py-3.5 text-base font-semibold text-white hover:bg-blue-500 transition-colors cursor-pointer group"
              >
                Get Started for Free
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
              <p className="mt-4 text-sm text-slate-400">No credit card required</p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  SECTION 11: FOOTER                                           */}
      {/* ============================================================ */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
            <div className="lg:col-span-1">
              <Link to="/" className="flex items-center">
                <img src="/logo-full.png" className="h-8" alt="LytheraHub" />
              </Link>
              <p className="mt-4 text-sm text-slate-500 leading-relaxed">
                The AI-powered command center for modern businesses. Built in Europe, for the world.
              </p>
            </div>

            {Object.entries(FOOTER_LINKS).map(([heading, links]) => (
              <div key={heading}>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider">{heading}</h4>
                <ul className="mt-4 flex flex-col gap-3">
                  {links.map((l) => (
                    <li key={l.label}>
                      {l.href.startsWith('#') ? (
                        <button
                          onClick={() => { if (l.href.length > 1) scrollTo(l.href.slice(1)) }}
                          className="text-sm text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
                        >
                          {l.label}
                        </button>
                      ) : (
                        <Link to={l.href} className="text-sm text-slate-500 hover:text-blue-600 transition-colors">
                          {l.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-400">&copy; 2026 LytheraHub. All rights reserved.</p>
            <p className="text-sm text-slate-400">Made with &#9889; for small businesses</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
