import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Mail,
  Calendar,
  Receipt,
  Users,
  BarChart3,
  Zap,
  Clock,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  Star,
  Menu,
  X,
  Sparkles,
  Globe,
  Bot,
  Play,
  Shield,
  TrendingUp,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const FEATURES_DEEP = [
  {
    icon: Mail,
    title: 'Smart Inbox',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    bullets: [
      'AI classifies every email into urgent, client, invoice, or newsletter',
      'One-line summaries so you never miss what matters',
      'AI-drafted replies tailored to your tone and context',
      'Action items extracted automatically from every thread',
    ],
  },
  {
    icon: Calendar,
    title: 'AI Calendar',
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    bullets: [
      'Meeting prep briefs generated with full client context',
      'Smart scheduling that respects your focus time blocks',
      'Automated reminders with relevant documents attached',
      'Post-meeting summaries and action items captured instantly',
    ],
  },
  {
    icon: Receipt,
    title: 'Invoice Tracker',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    bullets: [
      'Track every invoice from sent to paid in one view',
      'AI predicts which clients will pay late before they do',
      'Automated payment reminders on your schedule',
      'Revenue forecasting with trend analysis',
    ],
  },
  {
    icon: Users,
    title: 'CRM Pipeline',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    bullets: [
      'Drag-and-drop pipeline board for visual deal tracking',
      'AI enrichment fills in company and contact details',
      'Full activity timeline across email, calls, and meetings',
      'Automated lead scoring based on engagement signals',
    ],
  },
  {
    icon: BarChart3,
    title: 'AI Reports & Analytics',
    color: 'text-rose-600',
    bg: 'bg-rose-50',
    bullets: [
      'Daily morning briefings delivered to your inbox or Slack',
      'Weekly performance reports with actionable insights',
      'Revenue, pipeline, and productivity charts in real-time',
      'Custom report builder with natural language queries',
    ],
  },
  {
    icon: Zap,
    title: 'Automations',
    color: 'text-cyan-600',
    bg: 'bg-cyan-50',
    bullets: [
      '50+ pre-built workflow templates for common tasks',
      'New lead onboarding sequences that run automatically',
      'Invoice follow-up chains that never forget a payment',
      'Custom workflows with a visual drag-and-drop builder',
    ],
  },
]

const STEPS = [
  {
    num: 1,
    icon: Globe,
    title: 'Connect Your Tools',
    desc: 'Link Gmail, Calendar, Stripe, and Slack in one click. Takes under 2 minutes.',
  },
  {
    num: 2,
    icon: Bot,
    title: 'AI Organizes Everything',
    desc: 'Our AI classifies emails, preps meetings, tracks invoices, and enriches your CRM.',
  },
  {
    num: 3,
    icon: Sparkles,
    title: 'You Focus on What Matters',
    desc: 'Get a morning briefing and let automations handle the rest. Your time is yours again.',
  },
]

const TESTIMONIALS = [
  {
    quote: 'LytheraHub saved me 15 hours a week on admin work. The AI inbox alone changed how I run my agency. I actually have time to focus on client strategy now.',
    name: 'Sarah Chen',
    role: 'Founder & CEO',
    company: 'Brightpath Digital',
    stars: 5,
  },
  {
    quote: "The invoice tracker predicted a late payment from a client two weeks before it happened. We followed up early and got paid on time. That alone paid for the subscription.",
    name: 'Marcus Weber',
    role: 'Managing Director',
    company: 'Weber Consulting GmbH',
    stars: 5,
  },
  {
    quote: "I used to start every morning dreading my inbox. Now I get a morning briefing that tells me exactly what needs my attention. It's like having a chief of staff.",
    name: 'Amira Osei',
    role: 'Freelance Designer',
    company: 'Studio Amira',
    stars: 5,
  },
]

const PLANS = [
  {
    name: 'Free',
    monthly: 0,
    annual: 0,
    desc: 'Get started with the essentials',
    popular: false,
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
    popular: true,
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
    popular: false,
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
  {
    q: 'What is LytheraHub?',
    a: 'LytheraHub is an AI-powered business operations dashboard that connects all your tools — email, calendar, invoices, CRM, and more — into a single command center. It uses advanced AI to automate admin work, generate reports, and keep your business running smoothly.',
  },
  {
    q: 'Do I need to connect all my tools?',
    a: "No, start with just one integration and add more whenever you're ready. LytheraHub works with Gmail, Google Calendar, Stripe, Slack, and more. Each integration unlocks new automation capabilities, but even a single connection provides immediate value.",
  },
  {
    q: 'Is my data secure?',
    a: 'Absolutely. We use enterprise-grade encryption at rest and in transit. All data is isolated per account in a multi-tenant architecture. We never share your data with third parties, and you can export or delete your data at any time. We are GDPR compliant.',
  },
  {
    q: 'Can I try it for free?',
    a: 'Yes! Our Free plan includes one email account, five clients, basic AI reports, and a daily morning briefing — no credit card required. You can upgrade to Pro at any time to unlock unlimited capabilities.',
  },
  {
    q: 'How does the AI work?',
    a: 'We use advanced AI models to analyze your emails, meetings, invoices, and client interactions. The AI classifies incoming messages, generates meeting prep briefs, predicts payment timelines, drafts replies, and compiles daily and weekly business reports — all tailored to your specific context.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes, no long-term contracts or hidden fees. You can downgrade to the free plan or cancel entirely at any time from your Settings page. If you cancel a paid plan, you keep access until the end of your current billing period.',
  },
  {
    q: 'Do you offer refunds?',
    a: "If you're not satisfied within the first 14 days of a paid plan, we'll issue a full refund — no questions asked. After that, you can cancel anytime but refunds are not available for partial billing periods.",
  },
  {
    q: 'What support do you offer?',
    a: 'Free plan users get community support via our forum. Pro users get priority email support with 24-hour response times. Business plan customers get a dedicated account manager and priority Slack channel for real-time support.',
  },
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
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function FAQItem({ question, answer }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left bg-white dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
      >
        <span className="text-base font-semibold text-slate-900 dark:text-white">{question}</span>
        {open ? (
          <ChevronUp className="w-5 h-5 shrink-0 text-slate-400" />
        ) : (
          <ChevronDown className="w-5 h-5 shrink-0 text-slate-400" />
        )}
      </button>
      <div
        className={`grid transition-all duration-300 ease-in-out ${
          open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <p className="px-6 pb-5 pt-0 text-slate-600 dark:text-slate-400 leading-relaxed">
            {answer}
          </p>
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
  const { loginDemo } = useAuth()
  const navigate = useNavigate()

  const handleStartFree = async () => {
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
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white overflow-x-hidden">
      {/* ============================================================ */}
      {/*  STICKY NAVIGATION                                           */}
      {/* ============================================================ */}
      <nav className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
              <Zap className="h-4 w-4" />
            </div>
            LytheraHub
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <button onClick={() => scrollTo('features')} className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-brand-600 transition-colors cursor-pointer">Features</button>
            <button onClick={() => scrollTo('how-it-works')} className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-brand-600 transition-colors cursor-pointer">How it Works</button>
            <button onClick={() => scrollTo('pricing')} className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-brand-600 transition-colors cursor-pointer">Pricing</button>
            <button onClick={() => scrollTo('faq')} className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-brand-600 transition-colors cursor-pointer">FAQ</button>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link to="/login" className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-brand-600 transition-colors px-3 py-2">
              Sign In
            </Link>
            <button onClick={handleStartFree} className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 transition-colors cursor-pointer">
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
            <button onClick={() => scrollTo('features')} className="block w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 cursor-pointer">Features</button>
            <button onClick={() => scrollTo('how-it-works')} className="block w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 cursor-pointer">How it Works</button>
            <button onClick={() => scrollTo('pricing')} className="block w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 cursor-pointer">Pricing</button>
            <button onClick={() => scrollTo('faq')} className="block w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 cursor-pointer">FAQ</button>
            <hr className="my-2 border-slate-200" />
            <Link to="/login" className="block px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100">Sign In</Link>
            <button onClick={handleStartFree} className="mt-1 w-full rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 cursor-pointer">Start Free</button>
          </div>
        )}
      </nav>

      {/* ============================================================ */}
      {/*  HERO                                                        */}
      {/* ============================================================ */}
      <section className="py-20 sm:py-28 lg:py-36">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] text-slate-900 dark:text-white">
              Your Business on Autopilot
            </h1>
            <p className="mt-6 text-lg sm:text-xl leading-relaxed text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              The AI-powered command center that connects your email, calendar, invoices, and clients. Stop switching tabs. Start running your business.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={handleStartFree}
                className="group inline-flex items-center gap-2 rounded-lg bg-brand-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-brand-600/25 hover:bg-brand-700 hover:shadow-xl transition-all cursor-pointer"
              >
                Start Free <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
              <button
                onClick={() => scrollTo('features')}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 px-8 py-3.5 text-base font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer"
              >
                <Play className="w-4 h-4" /> Watch Demo
              </button>
            </div>
            <p className="mt-6 text-sm text-slate-400">
              No credit card required &middot; Free forever plan &middot; Setup in 2 minutes
            </p>
          </div>

          {/* Dashboard mockup placeholder */}
          <div className="mt-16 mx-auto max-w-5xl">
            <div className="relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 shadow-2xl shadow-slate-200/50 dark:shadow-slate-900/50 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
                <span className="ml-3 text-xs text-slate-400">app.lytherahub.com/dashboard</span>
              </div>
              <div className="p-8 sm:p-12 min-h-[300px] sm:min-h-[400px] flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-100 dark:bg-brand-900/30">
                    <Zap className="w-8 h-8 text-brand-600" />
                  </div>
                  <p className="text-lg font-semibold text-slate-600 dark:text-slate-400">Dashboard Preview</p>
                  <p className="text-sm text-slate-400">Your AI-powered command center</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  SOCIAL PROOF BAR                                            */}
      {/* ============================================================ */}
      <section className="py-16 border-y border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm font-medium text-slate-400 uppercase tracking-wider mb-8">
            Trusted by 500+ businesses
          </p>
          {/* Placeholder logos */}
          <div className="flex items-center justify-center gap-8 sm:gap-12 flex-wrap mb-12 opacity-40">
            {['Acme Corp', 'TechFlow', 'NovaBuild', 'DataPeak', 'StratEdge', 'Cloudly'].map((name) => (
              <div key={name} className="flex items-center gap-1.5 text-slate-400">
                <div className="w-6 h-6 rounded bg-slate-300 dark:bg-slate-600" />
                <span className="text-sm font-semibold tracking-wide">{name}</span>
              </div>
            ))}
          </div>
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
            {[
              { value: '93%', label: 'Time Saved' },
              { value: '50+', label: 'Automations' },
              { value: '10,000+', label: 'Emails Classified' },
              { value: '500+', label: 'Businesses' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">{stat.value}</div>
                <div className="mt-1 text-sm text-slate-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  FEATURES DEEP-DIVE                                          */}
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

          <div className="space-y-24 lg:space-y-32">
            {FEATURES_DEEP.map((feature, idx) => {
              const Icon = feature.icon
              const reversed = idx % 2 === 1
              return (
                <div key={feature.title} className={`flex flex-col ${reversed ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center gap-12 lg:gap-16`}>
                  {/* Text */}
                  <div className="flex-1 max-w-lg">
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${feature.bg} dark:bg-slate-800 mb-4`}>
                      <Icon className={`w-6 h-6 ${feature.color}`} />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{feature.title}</h3>
                    <ul className="mt-4 space-y-3">
                      {feature.bullets.map((bullet) => (
                        <li key={bullet} className="flex items-start gap-3 text-slate-600 dark:text-slate-400">
                          <Check className="w-5 h-5 mt-0.5 shrink-0 text-brand-500" />
                          <span className="text-sm leading-relaxed">{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  {/* Placeholder image */}
                  <div className="flex-1 w-full max-w-lg">
                    <div className={`aspect-[4/3] rounded-2xl border border-slate-200 dark:border-slate-800 ${feature.bg} dark:bg-slate-800/50 flex items-center justify-center`}>
                      <Icon className={`w-16 h-16 ${feature.color} opacity-30`} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  HOW IT WORKS                                                */}
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
            <div className="hidden md:block absolute top-10 left-[calc(16.66%+40px)] right-[calc(16.66%+40px)] h-px bg-slate-300 dark:bg-slate-700" />

            {STEPS.map((step) => {
              const Icon = step.icon
              return (
                <div key={step.num} className="relative text-center">
                  <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 mb-6 shadow-sm">
                    <Icon className="w-8 h-8 text-brand-600" />
                    <span className="absolute -top-2 -right-2 flex items-center justify-center w-7 h-7 rounded-full bg-brand-600 text-white text-xs font-bold shadow-md">
                      {step.num}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{step.title}</h3>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">{step.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  TESTIMONIALS                                                */}
      {/* ============================================================ */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
              What Our Customers Say
            </h2>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
              Trusted by small business owners and agencies worldwide.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-6">"{t.quote}"</p>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{t.name}</p>
                  <p className="text-sm text-slate-500">{t.role}, {t.company}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  PRICING                                                     */}
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
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors ${annual ? 'bg-brand-600' : 'bg-slate-300 dark:bg-slate-600'}`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform mt-0.5 ${annual ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
            <span className={`text-sm font-medium ${annual ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>
              Annual <span className="text-brand-600 font-semibold">(-20%)</span>
            </span>
          </div>

          <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto items-start">
            {PLANS.map((plan) => {
              const price = annual ? plan.annual : plan.monthly
              return (
                <div
                  key={plan.name}
                  className={`relative flex flex-col rounded-2xl border p-8 transition-all hover:shadow-lg ${
                    plan.popular
                      ? 'border-brand-500 bg-white dark:bg-slate-800 shadow-lg scale-[1.02] lg:scale-105'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-brand-600 px-4 py-1 text-xs font-bold uppercase tracking-wider text-white">
                        <Star className="w-3 h-3 fill-current" /> Most Popular
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
                    <p className="mt-1 text-xs text-brand-600">Billed annually (&euro;{price * 12}/year)</p>
                  )}

                  <ul className="mt-8 flex flex-col gap-3 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-300">
                        <Check className="w-4 h-4 mt-0.5 shrink-0 text-brand-500" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={plan.name !== 'Business' ? handleStartFree : undefined}
                    className={`mt-8 w-full py-3 px-6 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                      plan.popular
                        ? 'bg-brand-600 text-white hover:bg-brand-700'
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
      {/*  FAQ                                                         */}
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
              <FAQItem key={faq.q} question={faq.q} answer={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  FINAL CTA                                                   */}
      {/* ============================================================ */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-brand-600 px-8 py-16 sm:px-16 sm:py-20 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              Ready to Put Your Business on Autopilot?
            </h2>
            <p className="mt-4 text-lg text-brand-100 max-w-xl mx-auto">
              Join hundreds of business owners who save hours every week with LytheraHub.
            </p>
            <button
              onClick={handleStartFree}
              className="mt-8 inline-flex items-center gap-2 rounded-lg bg-white px-8 py-3.5 text-base font-semibold text-brand-700 hover:bg-brand-50 transition-colors cursor-pointer group"
            >
              Get Started for Free
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
            <p className="mt-4 text-sm text-brand-200">No credit card required</p>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  FOOTER                                                      */}
      {/* ============================================================ */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
            <div className="lg:col-span-1">
              <Link to="/" className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
                  <Zap className="h-4 w-4" />
                </div>
                LytheraHub
              </Link>
              <p className="mt-4 text-sm text-slate-500 leading-relaxed">
                The AI-powered command center for modern businesses.
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
                          className="text-sm text-slate-500 hover:text-brand-600 transition-colors cursor-pointer"
                        >
                          {l.label}
                        </button>
                      ) : (
                        <Link to={l.href} className="text-sm text-slate-500 hover:text-brand-600 transition-colors">
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
