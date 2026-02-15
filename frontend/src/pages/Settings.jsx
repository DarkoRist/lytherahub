import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  User,
  Link2,
  Bell,
  CreditCard,
  Mail,
  Calendar,
  HardDrive,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Globe,
  Clock,
  Zap,
  ExternalLink,
} from 'lucide-react'
import toast from 'react-hot-toast'

// ---------------------------------------------------------------------------
// Settings Page
// ---------------------------------------------------------------------------

export default function Settings() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')

  const tabs = [
    { key: 'profile', label: 'Profile', icon: User },
    { key: 'integrations', label: 'Integrations', icon: Link2 },
    { key: 'notifications', label: 'Notifications', icon: Bell },
    { key: 'billing', label: 'Billing', icon: CreditCard },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Manage your account, integrations, and preferences.
        </p>
      </div>

      {/* Tab navigation */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-700">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === key
                ? 'border-brand-600 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'profile' && <ProfileTab user={user} />}
      {activeTab === 'integrations' && <IntegrationsTab />}
      {activeTab === 'notifications' && <NotificationsTab />}
      {activeTab === 'billing' && <BillingTab />}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Profile Tab
// ---------------------------------------------------------------------------

function ProfileTab({ user }) {
  const [form, setForm] = useState({
    name: user?.name || 'Demo User',
    email: user?.email || 'demo@lytherahub.dev',
    business_name: 'LytheraHub Demo',
    timezone: 'Europe/Berlin',
  })

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  return (
    <div className="max-w-2xl space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Profile Information</h3>

        {/* Avatar */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-600 text-xl font-bold text-white">
            {user?.picture ? (
              <img src={user.picture} alt="" className="h-16 w-16 rounded-full" />
            ) : (
              (user?.name || 'D')[0].toUpperCase()
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-slate-900 dark:text-white">{form.name}</p>
            <p className="text-xs text-slate-500">{form.email}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <SettingsField label="Full Name" value={form.name} onChange={set('name')} />
            <SettingsField label="Email" value={form.email} onChange={set('email')} disabled />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <SettingsField label="Business Name" value={form.business_name} onChange={set('business_name')} />
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Timezone</label>
              <select
                value={form.timezone}
                onChange={set('timezone')}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              >
                <option value="Europe/Berlin">Europe/Berlin (CET)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
                <option value="America/New_York">America/New York (EST)</option>
                <option value="America/Los_Angeles">America/Los Angeles (PST)</option>
                <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
              </select>
            </div>
          </div>
        </div>

        <button
          onClick={() => toast.success('Profile saved')}
          className="mt-4 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          Save Changes
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Integrations Tab
// ---------------------------------------------------------------------------

function IntegrationsTab() {
  const integrations = [
    { name: 'Gmail', icon: Mail, connected: true, lastSync: '2 min ago', description: 'Read inbox, classify, draft replies' },
    { name: 'Google Calendar', icon: Calendar, connected: true, lastSync: '5 min ago', description: 'Read events, create meetings' },
    { name: 'Google Drive', icon: HardDrive, connected: false, lastSync: null, description: 'Create folders, upload documents' },
    { name: 'Slack', icon: MessageSquare, connected: true, lastSync: '10 min ago', description: 'Notifications, slash commands' },
    { name: 'Stripe', icon: CreditCard, connected: true, lastSync: '1 hour ago', description: 'Subscription billing, payments' },
    { name: 'n8n', icon: Zap, connected: true, lastSync: 'Running', description: 'Workflow automation engine' },
  ]

  return (
    <div className="max-w-2xl space-y-4">
      {integrations.map((integration) => {
        const Icon = integration.icon
        return (
          <div
            key={integration.name}
            className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700">
                <Icon className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">{integration.name}</h4>
                  {integration.connected ? (
                    <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-3 w-3" /> Connected
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <XCircle className="h-3 w-3" /> Not connected
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{integration.description}</p>
                {integration.lastSync && (
                  <p className="text-xs text-slate-400 mt-0.5">Last synced: {integration.lastSync}</p>
                )}
              </div>
            </div>

            <button
              onClick={() =>
                toast.success(integration.connected ? `${integration.name} disconnected` : `${integration.name} connected`)
              }
              className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                integration.connected
                  ? 'border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-700'
                  : 'bg-brand-600 text-white hover:bg-brand-700'
              }`}
            >
              {integration.connected ? 'Disconnect' : 'Connect'}
            </button>
          </div>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Notifications Tab
// ---------------------------------------------------------------------------

function NotificationsTab() {
  const [settings, setSettings] = useState({
    email_alerts: true,
    push_alerts: true,
    slack_alerts: true,
    briefing_time: '07:00',
    severity_threshold: 'warning',
    quiet_start: '22:00',
    quiet_end: '07:00',
  })

  const toggle = (key) => setSettings((s) => ({ ...s, [key]: !s[key] }))
  const set = (key) => (e) => setSettings((s) => ({ ...s, [key]: e.target.value }))

  return (
    <div className="max-w-2xl space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Alert Channels</h3>
        <div className="space-y-4">
          <ToggleRow label="Email Notifications" description="Receive alerts via email" checked={settings.email_alerts} onToggle={() => toggle('email_alerts')} />
          <ToggleRow label="Push Notifications" description="Browser push notifications" checked={settings.push_alerts} onToggle={() => toggle('push_alerts')} />
          <ToggleRow label="Slack Notifications" description="Get alerts in Slack DMs" checked={settings.slack_alerts} onToggle={() => toggle('slack_alerts')} />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Preferences</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Morning Briefing Time</label>
              <input type="time" value={settings.briefing_time} onChange={set('briefing_time')} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Alert Severity</label>
              <select value={settings.severity_threshold} onChange={set('severity_threshold')} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white">
                <option value="info">All (Info + Warning + Critical)</option>
                <option value="warning">Warning + Critical only</option>
                <option value="critical">Critical only</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Quiet Hours Start</label>
              <input type="time" value={settings.quiet_start} onChange={set('quiet_start')} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Quiet Hours End</label>
              <input type="time" value={settings.quiet_end} onChange={set('quiet_end')} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
            </div>
          </div>
        </div>

        <button
          onClick={() => toast.success('Notification preferences saved')}
          className="mt-4 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          Save Preferences
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Billing Tab
// ---------------------------------------------------------------------------

function BillingTab() {
  return (
    <div className="max-w-2xl space-y-6">
      {/* Current plan */}
      <div className="rounded-xl border-2 border-brand-200 bg-gradient-to-br from-brand-50 to-blue-50 p-6 dark:border-brand-800 dark:from-brand-900/20 dark:to-blue-900/20">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="rounded-full bg-brand-600 px-3 py-0.5 text-xs font-semibold text-white">Pro Plan</span>
            <h3 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">€49<span className="text-sm font-normal text-slate-500">/month</span></h3>
          </div>
          <Zap className="h-8 w-8 text-brand-600 dark:text-brand-400" />
        </div>
        <ul className="space-y-1.5 text-sm text-slate-600 dark:text-slate-400">
          <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Unlimited email accounts</li>
          <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> All integrations</li>
          <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> AI reports & insights</li>
          <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Slack integration</li>
          <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Unlimited automations</li>
        </ul>
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => toast.success('Plan selection coming soon. Contact support to upgrade.')}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-white dark:border-slate-600 dark:text-slate-300"
          >
            Change Plan
          </button>
          <button className="rounded-lg px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20">
            Cancel Subscription
          </button>
        </div>
      </div>

      {/* Usage */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Usage This Month</h3>
        <div className="space-y-3">
          <UsageBar label="Emails Classified" used={312} limit="Unlimited" />
          <UsageBar label="AI Reports Generated" used={18} limit="Unlimited" />
          <UsageBar label="Automation Runs" used={427} limit="Unlimited" />
          <UsageBar label="Clients" used={15} limit="Unlimited" />
        </div>
      </div>

      {/* Billing history */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Billing History</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700">
              <th className="pb-2 text-left text-xs font-medium text-slate-500">Date</th>
              <th className="pb-2 text-left text-xs font-medium text-slate-500">Description</th>
              <th className="pb-2 text-right text-xs font-medium text-slate-500">Amount</th>
            </tr>
          </thead>
          <tbody>
            {[
              { date: 'Feb 1, 2026', desc: 'Pro Plan — Monthly', amount: '€49.00' },
              { date: 'Jan 1, 2026', desc: 'Pro Plan — Monthly', amount: '€49.00' },
              { date: 'Dec 1, 2025', desc: 'Pro Plan — Monthly', amount: '€49.00' },
            ].map((row, i) => (
              <tr key={i} className="border-b border-slate-100 dark:border-slate-700/50">
                <td className="py-2.5 text-slate-600 dark:text-slate-400">{row.date}</td>
                <td className="py-2.5 text-slate-900 dark:text-white">{row.desc}</td>
                <td className="py-2.5 text-right font-medium text-slate-900 dark:text-white">{row.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Shared components
// ---------------------------------------------------------------------------

function SettingsField({ label, value, onChange, disabled = false }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
      <input
        type="text"
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 disabled:opacity-50 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
      />
    </div>
  )
}

function ToggleRow({ label, description, checked, onToggle }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-slate-900 dark:text-white">{label}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>
      </div>
      <button
        onClick={onToggle}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors ${
          checked ? 'bg-brand-600' : 'bg-slate-300 dark:bg-slate-600'
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0.5'
          } mt-0.5`}
        />
      </button>
    </div>
  )
}

function UsageBar({ label, used, limit }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-slate-700 dark:text-slate-300">{label}</span>
      <span className="text-sm font-medium text-slate-900 dark:text-white">{used} <span className="text-xs text-slate-400">/ {limit}</span></span>
    </div>
  )
}
