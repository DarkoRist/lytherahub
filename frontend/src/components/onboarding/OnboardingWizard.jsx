import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  User,
  Link2,
  Users,
  Bell,
  Rocket,
  ChevronRight,
  ChevronLeft,
  Check,
  Globe,
  Mail,
  Calendar,
  HardDrive,
  MessageSquare,
  CreditCard,
  Zap,
  Upload,
  SkipForward,
} from 'lucide-react'
import api from '../../api/client'
import { useAuth } from '../../context/AuthContext'

const STEPS = [
  { id: 'welcome', label: 'Welcome', icon: User },
  { id: 'connect', label: 'Connect Tools', icon: Link2 },
  { id: 'clients', label: 'Import Clients', icon: Users },
  { id: 'preferences', label: 'Preferences', icon: Bell },
  { id: 'ready', label: 'Ready!', icon: Rocket },
]

const TIMEZONES = [
  'Europe/Berlin',
  'Europe/London',
  'Europe/Paris',
  'Europe/Amsterdam',
  'Europe/Zurich',
  'America/New_York',
  'America/Chicago',
  'America/Los_Angeles',
  'Asia/Tokyo',
  'Asia/Singapore',
  'Australia/Sydney',
  'UTC',
]

const INTEGRATIONS = [
  { id: 'gmail', name: 'Gmail', icon: Mail, description: 'Smart inbox with AI classification', color: 'text-red-500' },
  { id: 'calendar', name: 'Google Calendar', icon: Calendar, description: 'AI meeting prep & scheduling', color: 'text-blue-500' },
  { id: 'drive', name: 'Google Drive', icon: HardDrive, description: 'Auto-organized client folders', color: 'text-yellow-500' },
  { id: 'slack', name: 'Slack', icon: MessageSquare, description: 'Notifications & slash commands', color: 'text-purple-500' },
  { id: 'stripe', name: 'Stripe', icon: CreditCard, description: 'Subscription billing & invoices', color: 'text-indigo-500' },
  { id: 'n8n', name: 'n8n Automations', icon: Zap, description: 'Workflow engine', color: 'text-orange-500' },
]

// ---------------------------------------------------------------------------
// Step components
// ---------------------------------------------------------------------------

function StepWelcome({ data, setData }) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-900">
          <Rocket className="h-8 w-8 text-brand-600 dark:text-brand-400" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Welcome to LytheraHub!</h2>
        <p className="mt-2 text-slate-500 dark:text-slate-400">Let's set up your workspace in under 2 minutes.</p>
      </div>

      <div className="space-y-4 max-w-sm mx-auto">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Business name</label>
          <input
            type="text"
            value={data.businessName}
            onChange={(e) => setData({ ...data, businessName: e.target.value })}
            placeholder="e.g. Acme Consulting"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-slate-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Business type</label>
          <select
            value={data.businessType}
            onChange={(e) => setData({ ...data, businessType: e.target.value })}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
          >
            <option value="">Select...</option>
            <option value="consulting">Consulting / Agency</option>
            <option value="saas">SaaS / Technology</option>
            <option value="ecommerce">E-Commerce / Retail</option>
            <option value="freelance">Freelance / Solo</option>
            <option value="services">Professional Services</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Timezone</label>
          <select
            value={data.timezone}
            onChange={(e) => setData({ ...data, timezone: e.target.value })}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
          >
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>{tz.replace('_', ' ')}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}

function StepConnect({ connected, toggleConnect }) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Connect your tools</h2>
        <p className="mt-2 text-slate-500 dark:text-slate-400">Link your accounts so LytheraHub can work its magic. You can skip and connect later.</p>
      </div>

      <div className="grid gap-3 max-w-lg mx-auto">
        {INTEGRATIONS.map((integ) => {
          const Icon = integ.icon
          const isConnected = connected.includes(integ.id)
          return (
            <button
              key={integ.id}
              onClick={() => toggleConnect(integ.id)}
              className={`flex items-center gap-4 rounded-xl border p-4 text-left transition-all ${
                isConnected
                  ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-900/20'
                  : 'border-slate-200 bg-white hover:border-brand-300 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-brand-600'
              }`}
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700 ${integ.color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{integ.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{integ.description}</p>
              </div>
              {isConnected ? (
                <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  <Check className="h-4 w-4" /> Connected
                </span>
              ) : (
                <span className="text-xs font-medium text-brand-600 dark:text-brand-400">Connect</span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function StepClients() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Import your clients</h2>
        <p className="mt-2 text-slate-500 dark:text-slate-400">Add your existing clients to get started or import from a CSV file.</p>
      </div>

      <div className="max-w-sm mx-auto space-y-4">
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center dark:border-slate-600 dark:bg-slate-800/50">
          <Upload className="h-10 w-10 text-slate-400 mb-3" />
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Drag & drop a CSV file here</p>
          <p className="text-xs text-slate-400 mt-1">or click to browse</p>
          <button className="mt-4 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors">
            Choose File
          </button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200 dark:border-slate-700" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white px-2 text-slate-400 dark:bg-slate-900 dark:text-slate-500">or add manually later</span>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400">
          You can always add clients from the Clients page after setup.
        </p>
      </div>
    </div>
  )
}

function StepPreferences({ prefs, setPrefs }) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Set your preferences</h2>
        <p className="mt-2 text-slate-500 dark:text-slate-400">Customize when and how you receive updates.</p>
      </div>

      <div className="max-w-sm mx-auto space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Morning briefing time</label>
          <input
            type="time"
            value={prefs.briefingTime}
            onChange={(e) => setPrefs({ ...prefs, briefingTime: e.target.value })}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
          />
          <p className="mt-1 text-xs text-slate-400">Get a daily AI summary of your business at this time</p>
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Notifications</label>

          <label className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-slate-500" />
              <span className="text-sm text-slate-700 dark:text-slate-300">Email notifications</span>
            </div>
            <input
              type="checkbox"
              checked={prefs.emailNotifications}
              onChange={(e) => setPrefs({ ...prefs, emailNotifications: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
          </label>

          <label className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-4 w-4 text-slate-500" />
              <span className="text-sm text-slate-700 dark:text-slate-300">Slack notifications</span>
            </div>
            <input
              type="checkbox"
              checked={prefs.slackNotifications}
              onChange={(e) => setPrefs({ ...prefs, slackNotifications: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
          </label>

          <label className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-center gap-3">
              <Bell className="h-4 w-4 text-slate-500" />
              <span className="text-sm text-slate-700 dark:text-slate-300">Push notifications</span>
            </div>
            <input
              type="checkbox"
              checked={prefs.pushNotifications}
              onChange={(e) => setPrefs({ ...prefs, pushNotifications: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
          </label>
        </div>
      </div>
    </div>
  )
}

function StepReady({ data }) {
  return (
    <div className="space-y-6 text-center">
      <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
        <Check className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
      </div>
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">You're all set!</h2>
      <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
        Your workspace is ready. LytheraHub will start organizing your business operations right away.
      </p>

      <div className="grid grid-cols-3 gap-4 max-w-xs mx-auto pt-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-brand-600 dark:text-brand-400">AI</p>
          <p className="text-xs text-slate-500">Smart inbox</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-brand-600 dark:text-brand-400">24/7</p>
          <p className="text-xs text-slate-500">Automations</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-brand-600 dark:text-brand-400">1</p>
          <p className="text-xs text-slate-500">Dashboard</p>
        </div>
      </div>

      <div className="pt-2 text-xs text-slate-400 space-y-1">
        <p>Tip: Use the command bar on the dashboard to control everything with natural language.</p>
        <p>Try: "What's my schedule today?" or "How much revenue this month?"</p>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main wizard
// ---------------------------------------------------------------------------

export default function OnboardingWizard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)

  const [profileData, setProfileData] = useState({
    businessName: '',
    businessType: '',
    timezone: 'Europe/Berlin',
  })

  const [connected, setConnected] = useState([])

  const [prefs, setPrefs] = useState({
    briefingTime: '08:00',
    emailNotifications: true,
    slackNotifications: false,
    pushNotifications: true,
  })

  const toggleConnect = (id) => {
    setConnected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const handleNext = async () => {
    if (step < STEPS.length - 1) {
      // Save profile data on step 0 next
      if (step === 0) {
        try {
          await api.post('/onboarding/profile', {
            business_name: profileData.businessName,
            business_type: profileData.businessType,
            timezone: profileData.timezone,
          })
        } catch { /* continue even if save fails */ }
      }
      // Save preferences on step 3 next
      if (step === 3) {
        try {
          await api.post('/onboarding/preferences', {
            briefing_time: prefs.briefingTime,
            email_notifications: prefs.emailNotifications,
            slack_notifications: prefs.slackNotifications,
          })
        } catch { /* continue */ }
      }
      setStep(step + 1)
    }
  }

  const handleBack = () => {
    if (step > 0) setStep(step - 1)
  }

  const handleFinish = async () => {
    setSaving(true)
    try {
      await api.post('/onboarding/complete')
    } catch { /* continue */ }
    setSaving(false)
    navigate('/dashboard')
  }

  const handleSkip = async () => {
    setSaving(true)
    try {
      await api.post('/onboarding/skip')
    } catch { /* continue */ }
    setSaving(false)
    navigate('/dashboard')
  }

  const isLastStep = step === STEPS.length - 1

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            {STEPS.map((s, i) => {
              const Icon = s.icon
              const isDone = i < step
              const isCurrent = i === step
              return (
                <div key={s.id} className="flex flex-col items-center flex-1">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all ${
                      isDone
                        ? 'border-emerald-500 bg-emerald-500 text-white'
                        : isCurrent
                          ? 'border-brand-600 bg-brand-600 text-white'
                          : 'border-slate-300 bg-white text-slate-400 dark:border-slate-600 dark:bg-slate-800'
                    }`}
                  >
                    {isDone ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </div>
                  <span className={`mt-1 text-[10px] font-medium hidden sm:block ${isCurrent ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400'}`}>
                    {s.label}
                  </span>
                </div>
              )
            })}
          </div>
          <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-700">
            <div
              className="h-full rounded-full bg-brand-600 transition-all duration-300"
              style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg dark:border-slate-700 dark:bg-slate-800 sm:p-8">
          {step === 0 && <StepWelcome data={profileData} setData={setProfileData} />}
          {step === 1 && <StepConnect connected={connected} toggleConnect={toggleConnect} />}
          {step === 2 && <StepClients />}
          {step === 3 && <StepPreferences prefs={prefs} setPrefs={setPrefs} />}
          {step === 4 && <StepReady data={profileData} />}

          {/* Navigation buttons */}
          <div className="mt-8 flex items-center justify-between">
            <div>
              {step > 0 && !isLastStep && (
                <button
                  onClick={handleBack}
                  className="flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                >
                  <ChevronLeft className="h-4 w-4" /> Back
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              {!isLastStep && (
                <button
                  onClick={handleSkip}
                  disabled={saving}
                  className="flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
                >
                  <SkipForward className="h-3.5 w-3.5" /> Skip setup
                </button>
              )}

              {isLastStep ? (
                <button
                  onClick={handleFinish}
                  disabled={saving}
                  className="flex items-center gap-2 rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-brand-700 disabled:opacity-60 transition-colors"
                >
                  {saving ? 'Starting...' : 'Go to Dashboard'}
                  <Rocket className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="flex items-center gap-1 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-brand-700 transition-colors"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Step counter */}
        <p className="mt-3 text-center text-xs text-slate-400">
          Step {step + 1} of {STEPS.length}
        </p>
      </div>
    </div>
  )
}
