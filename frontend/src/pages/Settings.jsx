import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  Mail, Calendar, HardDrive, MessageSquare, CheckCircle2,
  XCircle, X, CreditCard, Zap, Building2, Users, Shield,
  Package, Key, Loader2, Trash2, UserPlus, Edit2, Clock,
} from 'lucide-react'
import api from '../api/client'
import toast from 'react-hot-toast'

// ---------------------------------------------------------------------------
// Shared UI helpers
// ---------------------------------------------------------------------------

function SettingsField({ label, value, onChange, disabled = false, type = 'text', placeholder }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 disabled:opacity-50 focus:border-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white"
      />
    </div>
  )
}

function ToggleRow({ label, description, checked, onToggle }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-slate-900 dark:text-white">{label}</p>
        {description && <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>}
      </div>
      <button
        onClick={onToggle}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors ${
          checked ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
        }`}
      >
        <span
          className={`mt-0.5 inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  )
}

function Card({ title, children, footer }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
      {title && (
        <div className="border-b border-slate-100 px-6 py-4 dark:border-slate-700">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h3>
        </div>
      )}
      <div className="p-6">{children}</div>
      {footer && (
        <div className="border-t border-slate-100 px-6 py-4 dark:border-slate-700">{footer}</div>
      )}
    </div>
  )
}

function SaveButton({ onClick, saving }) {
  return (
    <button
      onClick={onClick}
      disabled={saving}
      className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
    >
      {saving && <Loader2 className="h-4 w-4 animate-spin" />}
      Save Changes
    </button>
  )
}

// ---------------------------------------------------------------------------
// Workspace Tab
// ---------------------------------------------------------------------------

function WorkspaceTab() {
  const [form, setForm] = useState({ name: '', default_currency: 'EUR', tax_rate: 0 })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get('/workspace').then((r) => {
      setForm({ name: r.data.name || '', default_currency: r.data.default_currency || 'EUR', tax_rate: r.data.tax_rate || 0 })
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }))

  async function save() {
    setSaving(true)
    try {
      await api.put('/workspace', form)
      toast.success('Workspace settings saved')
    } catch {
      toast.error('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-blue-500" /></div>

  return (
    <div className="max-w-2xl space-y-5">
      <Card title="Workspace Details">
        <div className="space-y-4">
          <SettingsField label="Workspace Name" value={form.name} onChange={set('name')} placeholder="Acme Corp" />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Default Currency</label>
              <select
                value={form.default_currency}
                onChange={set('default_currency')}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              >
                {['EUR', 'USD', 'GBP', 'CHF', 'CAD', 'AUD'].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <SettingsField
              label="Default Tax Rate (%)"
              type="number"
              value={form.tax_rate}
              onChange={set('tax_rate')}
              placeholder="19"
            />
          </div>
        </div>
        <div className="mt-4">
          <SaveButton onClick={save} saving={saving} />
        </div>
      </Card>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Members Tab
// ---------------------------------------------------------------------------

const ROLE_LABELS = { owner: 'Owner', admin: 'Admin', sales: 'Sales', ops: 'Operations', viewer: 'Viewer' }
const ROLE_COLORS = {
  owner: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  admin: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  sales: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  ops: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  viewer: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
}

function MembersTab() {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('viewer')
  const [inviting, setInviting] = useState(false)

  useEffect(() => {
    api.get('/workspace/members').then((r) => setMembers(r.data || [])).catch(() => {}).finally(() => setLoading(false))
  }, [])

  async function invite() {
    if (!inviteEmail.trim()) return toast.error('Enter an email address')
    setInviting(true)
    try {
      const res = await api.post('/workspace/invite', { email: inviteEmail, role: inviteRole })
      setMembers((p) => [...p, res.data])
      setInviteEmail('')
      toast.success('Invitation sent')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to invite')
    } finally {
      setInviting(false)
    }
  }

  async function updateRole(id, role) {
    try {
      await api.put(`/workspace/members/${id}`, { role })
      setMembers((p) => p.map((m) => m.id === id ? { ...m, role } : m))
      toast.success('Role updated')
    } catch {
      toast.error('Failed to update role')
    }
  }

  async function removeMember(id) {
    if (!confirm('Remove this member?')) return
    try {
      await api.delete(`/workspace/members/${id}`)
      setMembers((p) => p.filter((m) => m.id !== id))
      toast.success('Member removed')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Cannot remove member')
    }
  }

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-blue-500" /></div>

  return (
    <div className="max-w-2xl space-y-5">
      {/* Invite */}
      <Card title="Invite Member">
        <div className="flex gap-2">
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="colleague@company.com"
            className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white"
          />
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white"
          >
            {Object.entries(ROLE_LABELS).filter(([k]) => k !== 'owner').map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <button
            onClick={invite}
            disabled={inviting}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            Invite
          </button>
        </div>
      </Card>

      {/* Members list */}
      <Card title={`Members (${members.length})`}>
        {members.length === 0 ? (
          <p className="text-center text-sm text-slate-400 py-4">No members yet</p>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-700">
            {members.map((m) => (
              <li key={m.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700">
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      {m.user_id?.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{m.user_id}</p>
                    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${ROLE_COLORS[m.role] || ROLE_COLORS.viewer}`}>
                      {ROLE_LABELS[m.role] || m.role}
                    </span>
                  </div>
                </div>
                {m.role !== 'owner' && (
                  <div className="flex items-center gap-2">
                    <select
                      value={m.role}
                      onChange={(e) => updateRole(m.id, e.target.value)}
                      className="rounded border border-slate-200 bg-white px-2 py-1 text-xs dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                    >
                      {Object.entries(ROLE_LABELS).filter(([k]) => k !== 'owner').map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => removeMember(m.id)}
                      className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Profile Tab
// ---------------------------------------------------------------------------

function ProfileTab({ user }) {
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    timezone: 'Europe/Berlin',
  })
  const [saving, setSaving] = useState(false)
  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  async function save() {
    setSaving(true)
    try {
      await api.patch('/auth/me', { name: form.name, timezone: form.timezone })
      toast.success('Profile saved')
    } catch {
      toast.error('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-5">
      <Card title="Profile Information">
        <div className="mb-5 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-lg font-bold text-white">
            {user?.picture
              ? <img src={user.picture} alt="" className="h-14 w-14 rounded-full" />
              : (user?.name || 'D')[0].toUpperCase()
            }
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">{form.name}</p>
            <p className="text-xs text-slate-500">{form.email}</p>
          </div>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <SettingsField label="Full Name" value={form.name} onChange={set('name')} />
            <SettingsField label="Email" value={form.email} disabled />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Timezone</label>
            <select value={form.timezone} onChange={set('timezone')}
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
        <div className="mt-4"><SaveButton onClick={save} saving={saving} /></div>
      </Card>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Security Tab
// ---------------------------------------------------------------------------

function SecurityTab() {
  const [sessions] = useState([
    { id: 1, device: 'Chrome on Windows', location: 'Berlin, DE', last_active: 'Now', current: true },
    { id: 2, device: 'Safari on iPhone', location: 'Munich, DE', last_active: '2 hours ago', current: false },
  ])

  return (
    <div className="max-w-2xl space-y-5">
      <Card title="Active Sessions">
        <ul className="divide-y divide-slate-100 dark:divide-slate-700">
          {sessions.map((s) => (
            <li key={s.id} className="flex items-center justify-between py-3">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{s.device}</p>
                  {s.current && (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      Current
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{s.location} · {s.last_active}</p>
              </div>
              {!s.current && (
                <button
                  onClick={() => toast.success('Session revoked')}
                  className="text-xs text-red-600 hover:underline dark:text-red-400"
                >
                  Revoke
                </button>
              )}
            </li>
          ))}
        </ul>
        <button
          onClick={() => toast.success('All other sessions revoked')}
          className="mt-3 text-sm text-red-600 hover:underline dark:text-red-400"
        >
          Revoke all other sessions
        </button>
      </Card>

      <Card title="API Keys">
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
          API keys allow external services to access your workspace data.
        </p>
        <div className="rounded-lg bg-slate-50 px-4 py-3 dark:bg-slate-700/40">
          <p className="font-mono text-xs text-slate-600 dark:text-slate-400">lyk_••••••••••••••••••••••••••••••••</p>
        </div>
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => toast.success('API key copied')}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300"
          >
            Copy Key
          </button>
          <button
            onClick={() => { if (confirm('Regenerate API key? The old key will stop working.')) toast.success('New API key generated') }}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300"
          >
            Regenerate
          </button>
        </div>
      </Card>

      <Card title="Danger Zone">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/10">
          <p className="text-sm font-medium text-red-800 dark:text-red-300">Delete Workspace</p>
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">
            Permanently delete this workspace and all its data. This action cannot be undone.
          </p>
          <button
            onClick={() => toast.error('Contact support to delete your workspace')}
            className="mt-3 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
          >
            Delete Workspace
          </button>
        </div>
      </Card>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Inventory Settings Tab
// ---------------------------------------------------------------------------

function InventoryTab() {
  const [warehouses, setWarehouses] = useState([])
  const [form, setForm] = useState({ default_warehouse_id: '', low_stock_alerts: true, reorder_notifications: true })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get('/warehouses').then((r) => {
      setWarehouses(r.data || [])
      const def = r.data.find((w) => w.is_default)
      if (def) setForm((p) => ({ ...p, default_warehouse_id: def.id }))
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }))

  async function save() {
    setSaving(true)
    try {
      if (form.default_warehouse_id) {
        await api.put(`/warehouses/${form.default_warehouse_id}`, { is_default: true })
      }
      toast.success('Inventory settings saved')
    } catch {
      toast.error('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-blue-500" /></div>

  return (
    <div className="max-w-2xl space-y-5">
      <Card title="Warehouse Defaults">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Default Warehouse</label>
          <select
            value={form.default_warehouse_id}
            onChange={set('default_warehouse_id')}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white"
          >
            <option value="">No default</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>{w.name}{w.location ? ` — ${w.location}` : ''}</option>
            ))}
          </select>
          <p className="mt-1 text-xs text-slate-400">Used as the default location for new stock movements and orders.</p>
        </div>
        <div className="mt-4"><SaveButton onClick={save} saving={saving} /></div>
      </Card>

      <Card title="Stock Alerts">
        <div className="space-y-4">
          <ToggleRow
            label="Low Stock Alerts"
            description="Get notified when products reach their reorder level"
            checked={form.low_stock_alerts}
            onToggle={() => setForm((p) => ({ ...p, low_stock_alerts: !p.low_stock_alerts }))}
          />
          <ToggleRow
            label="Reorder Notifications"
            description="Suggest purchase orders for low stock items"
            checked={form.reorder_notifications}
            onToggle={() => setForm((p) => ({ ...p, reorder_notifications: !p.reorder_notifications }))}
          />
        </div>
        <div className="mt-4">
          <button
            onClick={() => toast.success('Alert preferences saved')}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </Card>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Notifications Tab
// ---------------------------------------------------------------------------

function NotificationsTab() {
  const [settings, setSettings] = useState({
    email_alerts: true, push_alerts: true, slack_alerts: true,
    briefing_time: '07:00', severity_threshold: 'warning',
    quiet_start: '22:00', quiet_end: '07:00',
  })
  const toggle = (key) => setSettings((s) => ({ ...s, [key]: !s[key] }))
  const set = (key) => (e) => setSettings((s) => ({ ...s, [key]: e.target.value }))

  return (
    <div className="max-w-2xl space-y-5">
      <Card title="Alert Channels">
        <div className="space-y-4">
          <ToggleRow label="Email Notifications" description="Receive alerts via email" checked={settings.email_alerts} onToggle={() => toggle('email_alerts')} />
          <ToggleRow label="Push Notifications" description="Browser push notifications" checked={settings.push_alerts} onToggle={() => toggle('push_alerts')} />
          <ToggleRow label="Slack Notifications" description="Get alerts in Slack DMs" checked={settings.slack_alerts} onToggle={() => toggle('slack_alerts')} />
        </div>
      </Card>
      <Card title="Preferences">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Morning Briefing Time</label>
              <input type="time" value={settings.briefing_time} onChange={set('briefing_time')} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Minimum Alert Severity</label>
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
        <div className="mt-4">
          <button onClick={() => toast.success('Preferences saved')} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            Save Preferences
          </button>
        </div>
      </Card>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Integrations Tab
// ---------------------------------------------------------------------------

function IntegrationsTab() {
  const [integrations, setIntegrations] = useState([
    { id: 'gmail', name: 'Gmail', icon: Mail, connected: true, lastSync: '2 min ago', description: 'Read inbox, classify, draft replies' },
    { id: 'calendar', name: 'Google Calendar', icon: Calendar, connected: true, lastSync: '5 min ago', description: 'Read events, create meetings' },
    { id: 'drive', name: 'Google Drive', icon: HardDrive, connected: false, lastSync: null, description: 'Create folders, upload documents' },
    { id: 'slack', name: 'Slack', icon: MessageSquare, connected: true, lastSync: '10 min ago', description: 'Notifications, slash commands' },
    { id: 'stripe', name: 'Stripe', icon: CreditCard, connected: true, lastSync: '1 hour ago', description: 'Subscription billing, payments' },
    { id: 'n8n', name: 'n8n', icon: Zap, connected: true, lastSync: 'Running', description: 'Workflow automation engine' },
  ])

  const toggle = (id) => {
    setIntegrations((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i
        const c = !i.connected
        toast.success(c ? `${i.name} connected` : `${i.name} disconnected`)
        return { ...i, connected: c, lastSync: c ? 'Just now' : null }
      })
    )
  }

  return (
    <div className="max-w-2xl space-y-3">
      {integrations.map((intg) => {
        const Icon = intg.icon
        return (
          <div key={intg.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700">
                <Icon className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{intg.name}</p>
                  {intg.connected
                    ? <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400"><CheckCircle2 className="h-3 w-3" /> Connected</span>
                    : <span className="flex items-center gap-1 text-xs text-slate-400"><XCircle className="h-3 w-3" /> Not connected</span>
                  }
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{intg.description}</p>
                {intg.lastSync && <p className="mt-0.5 text-xs text-slate-400">Last synced: {intg.lastSync}</p>}
              </div>
            </div>
            <button
              onClick={() => toggle(intg.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                intg.connected
                  ? 'border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {intg.connected ? 'Disconnect' : 'Connect'}
            </button>
          </div>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Billing Tab
// ---------------------------------------------------------------------------

function BillingTab() {
  const [showPlanModal, setShowPlanModal] = useState(false)

  return (
    <div className="max-w-2xl space-y-5">
      <Card title="Current Plan">
        <div className="flex items-center justify-between">
          <div>
            <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Pro Plan</span>
            <h3 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">€49<span className="text-sm font-normal text-slate-500">/month</span></h3>
          </div>
          <Zap className="h-8 w-8 text-blue-500" />
        </div>
        <ul className="mt-3 space-y-1.5 text-sm text-slate-600 dark:text-slate-400">
          {['Unlimited email accounts', 'All integrations', 'AI reports & insights', 'Slack integration', 'Unlimited automations'].map((f) => (
            <li key={f} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />{f}</li>
          ))}
        </ul>
        <div className="mt-4 flex gap-2">
          <button onClick={() => setShowPlanModal(true)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300">
            Change Plan
          </button>
          <button onClick={() => { if (confirm('Cancel subscription?')) toast.success('Subscription cancelled') }} className="rounded-lg px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400">
            Cancel
          </button>
        </div>
      </Card>

      <Card title="Billing History">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700">
              <th className="pb-2 text-left text-xs font-medium text-slate-500">Date</th>
              <th className="pb-2 text-left text-xs font-medium text-slate-500">Description</th>
              <th className="pb-2 text-right text-xs font-medium text-slate-500">Amount</th>
            </tr>
          </thead>
          <tbody>
            {[['Feb 1, 2026', 'Pro Plan — Monthly', '€49.00'], ['Jan 1, 2026', 'Pro Plan — Monthly', '€49.00'], ['Dec 1, 2025', 'Pro Plan — Monthly', '€49.00']].map(([d, desc, amt]) => (
              <tr key={d} className="border-b border-slate-100 dark:border-slate-700/50">
                <td className="py-2.5 text-slate-600 dark:text-slate-400">{d}</td>
                <td className="py-2.5 text-slate-900 dark:text-white">{desc}</td>
                <td className="py-2.5 text-right font-medium text-slate-900 dark:text-white">{amt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {showPlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowPlanModal(false)}>
          <div className="w-full max-w-3xl rounded-xl bg-white shadow-2xl dark:bg-slate-800" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Choose a Plan</h3>
              <button onClick={() => setShowPlanModal(false)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-3">
              {[
                { name: 'Free', price: '€0', features: ['5 email accounts', 'Basic AI summaries', '3 automations'], current: false },
                { name: 'Pro', price: '€49', features: ['Unlimited emails', 'All integrations', 'AI reports', 'Slack', 'Unlimited automations', 'Priority support'], current: true },
                { name: 'Business', price: '€149', features: ['Everything in Pro', 'Team collaboration', 'API access', 'SSO / SAML', 'Dedicated support'], current: false },
              ].map((plan) => (
                <div key={plan.name} className={`rounded-xl border p-5 ${plan.current ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800' : 'border-slate-200 dark:border-slate-700'}`}>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">{plan.name}</h4>
                  <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{plan.price}<span className="text-sm font-normal text-slate-500">/mo</span></p>
                  <ul className="mt-3 space-y-1.5">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                        <CheckCircle2 className="h-3 w-3 shrink-0 text-green-500" />{f}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => { setShowPlanModal(false); toast.success(plan.current ? 'Already on this plan' : `Switched to ${plan.name}`) }}
                    className={`mt-4 w-full rounded-lg px-3 py-2 text-sm font-medium ${plan.current ? 'border border-blue-500 text-blue-600 dark:text-blue-400' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                  >
                    {plan.current ? 'Current Plan' : `Select ${plan.name}`}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Audit Log Tab
// ---------------------------------------------------------------------------

function AuditLogTab() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/dashboard/activity').then((r) => setLogs(r.data?.slice(0, 50) || [])).catch(() => {}).finally(() => setLoading(false))
  }, [])

  function fmtDate(d) {
    return new Date(d).toLocaleString('de-DE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="max-w-2xl">
      <Card title="Recent Activity">
        {loading ? (
          <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-blue-500" /></div>
        ) : logs.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">No activity logged yet</p>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-700">
            {logs.map((log) => (
              <li key={log.id} className="py-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm text-slate-900 dark:text-white">{log.description}</p>
                    <p className="mt-0.5 text-xs text-slate-400">{log.entity_type} · {log.action}</p>
                  </div>
                  <span className="shrink-0 text-xs text-slate-400">{fmtDate(log.created_at)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Settings Page
// ---------------------------------------------------------------------------

const NAV_GROUPS = [
  {
    heading: 'Workspace',
    items: [
      { key: 'workspace', label: 'General', icon: Building2 },
      { key: 'members', label: 'Members & Roles', icon: Users },
    ],
  },
  {
    heading: 'Account',
    items: [
      { key: 'profile', label: 'Profile', icon: Users },
      { key: 'security', label: 'Security', icon: Shield },
    ],
  },
  {
    heading: 'Operations',
    items: [
      { key: 'inventory', label: 'Inventory', icon: Package },
    ],
  },
  {
    heading: 'Communications',
    items: [
      { key: 'notifications', label: 'Notifications', icon: MessageSquare },
      { key: 'integrations', label: 'Integrations', icon: Zap },
    ],
  },
  {
    heading: 'Billing',
    items: [
      { key: 'billing', label: 'Plan & Usage', icon: CreditCard },
    ],
  },
  {
    heading: 'System',
    items: [
      { key: 'audit_log', label: 'Audit Log', icon: Clock },
    ],
  },
]

export default function Settings() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('workspace')

  const allItems = NAV_GROUPS.flatMap((g) => g.items)

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Manage your workspace, account, and integrations.
        </p>
      </div>

      <div className="flex gap-8">
        {/* Desktop sidebar nav */}
        <nav className="hidden w-52 shrink-0 md:block">
          <div className="sticky top-20 space-y-5">
            {NAV_GROUPS.map((group) => (
              <div key={group.heading}>
                <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  {group.heading}
                </p>
                {group.items.map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      activeTab === key
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {label}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </nav>

        {/* Mobile tabs */}
        <div className="flex w-full items-center gap-1 overflow-x-auto border-b border-slate-200 pb-0 dark:border-slate-700 md:hidden">
          {allItems.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`shrink-0 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                activeTab === key
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {activeTab === 'workspace' && <WorkspaceTab />}
          {activeTab === 'members' && <MembersTab />}
          {activeTab === 'profile' && <ProfileTab user={user} />}
          {activeTab === 'security' && <SecurityTab />}
          {activeTab === 'inventory' && <InventoryTab />}
          {activeTab === 'notifications' && <NotificationsTab />}
          {activeTab === 'integrations' && <IntegrationsTab />}
          {activeTab === 'billing' && <BillingTab />}
          {activeTab === 'audit_log' && <AuditLogTab />}
        </div>
      </div>
    </div>
  )
}
