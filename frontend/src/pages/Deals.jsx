import { useState, useEffect, useRef } from 'react'
import {
  Plus, X, Loader2, DollarSign, Calendar, Building2, User,
  Edit2, Trash2, ChevronRight, MessageSquare, Phone, Mail,
  TrendingUp, Percent,
} from 'lucide-react'
import { dealsApi, activitiesApi } from '../api/deals'
import api from '../api/client'
import toast from 'react-hot-toast'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STAGES = [
  { key: 'lead', label: 'Lead', color: 'slate', bg: 'bg-slate-100 dark:bg-slate-700', text: 'text-slate-700 dark:text-slate-300' },
  { key: 'qualified', label: 'Qualified', color: 'blue', bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400' },
  { key: 'proposal', label: 'Proposal', color: 'violet', bg: 'bg-violet-100 dark:bg-violet-900/30', text: 'text-violet-700 dark:text-violet-400' },
  { key: 'negotiation', label: 'Negotiation', color: 'amber', bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400' },
  { key: 'won', label: 'Won', color: 'green', bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400' },
  { key: 'lost', label: 'Lost', color: 'red', bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400' },
]

const STAGE_PROBABILITY = { lead: 10, qualified: 30, proposal: 50, negotiation: 75, won: 100, lost: 0 }

function fmtCurrency(value, currency = 'EUR') {
  if (!value && value !== 0) return '—'
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency, minimumFractionDigits: 0 }).format(value)
}

function fmtDate(d) {
  if (!d) return null
  return new Date(d).toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ---------------------------------------------------------------------------
// ActivityTypeIcon
// ---------------------------------------------------------------------------

function ActivityIcon({ type }) {
  const icons = { note: MessageSquare, call: Phone, email: Mail, meeting: Calendar, task: ChevronRight }
  const Icon = icons[type] || MessageSquare
  return <Icon className="h-3.5 w-3.5" />
}

// ---------------------------------------------------------------------------
// Deal card
// ---------------------------------------------------------------------------

function DealCard({ deal, onOpenDetail, onDragStart }) {
  return (
    <div
      draggable
      onDragStart={() => onDragStart(deal)}
      onClick={() => onOpenDetail(deal)}
      className="group cursor-pointer rounded-lg border border-slate-200 bg-white p-3 shadow-sm hover:border-blue-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:hover:border-blue-600"
    >
      <p className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-2">{deal.title}</p>
      {deal.company_name && (
        <div className="mt-1.5 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
          <Building2 className="h-3 w-3 shrink-0" />
          <span className="truncate">{deal.company_name}</span>
        </div>
      )}
      <div className="mt-2 flex items-center justify-between">
        <span className="text-sm font-bold text-slate-800 dark:text-white">
          {fmtCurrency(deal.value, deal.currency)}
        </span>
        <span className="flex items-center gap-0.5 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-400">
          <Percent className="h-2.5 w-2.5" />
          {deal.probability}
        </span>
      </div>
      {deal.expected_close_date && (
        <p className="mt-1.5 text-[10px] text-slate-400">Close {fmtDate(deal.expected_close_date)}</p>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// DealModal — create / edit
// ---------------------------------------------------------------------------

function DealModal({ deal, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: deal?.title ?? '',
    company_id: deal?.company_id ?? '',
    contact_id: deal?.contact_id ?? '',
    value: deal?.value ?? '',
    currency: deal?.currency ?? 'EUR',
    stage: deal?.stage ?? 'lead',
    probability: deal?.probability ?? 10,
    expected_close_date: deal?.expected_close_date ? deal.expected_close_date.split('T')[0] : '',
    notes: deal?.notes ?? '',
  })
  const [companies, setCompanies] = useState([])
  const [contacts, setContacts] = useState([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get('/clients').then((r) => setCompanies(r.data || [])).catch(() => {})
    api.get('/contacts').then((r) => setContacts(r.data || [])).catch(() => {})
  }, [])

  const set = (k) => (e) => {
    const val = e.target.value
    setForm((p) => {
      const next = { ...p, [k]: val }
      if (k === 'stage') next.probability = STAGE_PROBABILITY[val] ?? p.probability
      return next
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim()) return toast.error('Title is required')
    setSaving(true)
    try {
      const payload = {
        ...form,
        value: form.value !== '' ? parseFloat(form.value) : null,
        company_id: form.company_id || null,
        contact_id: form.contact_id || null,
        expected_close_date: form.expected_close_date || null,
        probability: parseInt(form.probability),
      }
      const saved = deal
        ? await dealsApi.update(deal.id, payload)
        : await dealsApi.create(payload)
      onSaved(saved.data)
      onClose()
      toast.success(deal ? 'Deal updated' : 'Deal created')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save deal')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-xl bg-white shadow-2xl dark:bg-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-700">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            {deal ? 'Edit Deal' : 'New Deal'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="max-h-[80vh] overflow-y-auto p-6 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
              Deal Title <span className="text-red-500">*</span>
            </label>
            <input
              value={form.title}
              onChange={set('title')}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              placeholder="Enterprise software license renewal"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">Company</label>
              <select
                value={form.company_id}
                onChange={set('company_id')}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              >
                <option value="">No company</option>
                {companies.map((c) => <option key={c.id} value={c.id}>{c.company_name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">Contact</label>
              <select
                value={form.contact_id}
                onChange={set('contact_id')}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              >
                <option value="">No contact</option>
                {contacts.map((c) => <option key={c.id} value={c.id}>{c.first_name} {c.last_name || ''}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">Value</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.value}
                onChange={set('value')}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                placeholder="50000"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">Currency</label>
              <select
                value={form.currency}
                onChange={set('currency')}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              >
                {['EUR', 'USD', 'GBP', 'CHF'].map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">Stage</label>
              <select
                value={form.stage}
                onChange={set('stage')}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              >
                {STAGES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                Probability (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={form.probability}
                onChange={set('probability')}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
              Expected Close Date
            </label>
            <input
              type="date"
              value={form.expected_close_date}
              onChange={set('expected_close_date')}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">Notes</label>
            <textarea
              value={form.notes}
              onChange={set('notes')}
              rows={3}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {deal ? 'Save Changes' : 'Create Deal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Deal Detail Panel
// ---------------------------------------------------------------------------

function DetailPanel({ deal, onClose, onEdit, onDelete, onStageChange }) {
  const [activities, setActivities] = useState([])
  const [loadingAct, setLoadingAct] = useState(false)
  const [newNote, setNewNote] = useState('')
  const [savingNote, setSavingNote] = useState(false)
  const stage = STAGES.find((s) => s.key === deal.stage) || STAGES[0]

  useEffect(() => {
    loadActivities()
  }, [deal.id])

  async function loadActivities() {
    setLoadingAct(true)
    try {
      const res = await activitiesApi.list('deal', deal.id)
      setActivities(res.data)
    } catch {
      // silent
    } finally {
      setLoadingAct(false)
    }
  }

  async function addNote() {
    if (!newNote.trim()) return
    setSavingNote(true)
    try {
      const res = await activitiesApi.create({
        entity_type: 'deal',
        entity_id: deal.id,
        activity_type: 'note',
        title: newNote.trim(),
      })
      setActivities((p) => [res.data, ...p])
      setNewNote('')
    } catch {
      toast.error('Failed to add note')
    } finally {
      setSavingNote(false)
    }
  }

  async function deleteActivity(id) {
    try {
      await activitiesApi.delete(id)
      setActivities((p) => p.filter((a) => a.id !== id))
    } catch {
      toast.error('Delete failed')
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex" onClick={onClose}>
      <div className="ml-auto flex h-full w-full max-w-md flex-col bg-white shadow-2xl dark:bg-slate-800" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-700">
          <div className="flex-1 min-w-0 pr-4">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white line-clamp-2">{deal.title}</h2>
            <div className="mt-1 flex items-center gap-2">
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${stage.bg} ${stage.text}`}>
                {stage.label}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">{deal.probability}% probability</span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              onClick={onEdit}
              className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700"
            >
              <Edit2 className="h-4 w-4" />
            </button>
            <button
              onClick={onDelete}
              className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button onClick={onClose} className="rounded p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* KPIs */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-700/40">
              <p className="text-xs text-slate-500 dark:text-slate-400">Value</p>
              <p className="mt-0.5 text-lg font-bold text-slate-900 dark:text-white">
                {fmtCurrency(deal.value, deal.currency)}
              </p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-700/40">
              <p className="text-xs text-slate-500 dark:text-slate-400">Weighted</p>
              <p className="mt-0.5 text-lg font-bold text-slate-900 dark:text-white">
                {fmtCurrency((deal.value || 0) * (deal.probability / 100), deal.currency)}
              </p>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-2">
            {deal.company_name && (
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="h-4 w-4 shrink-0 text-slate-400" />
                <span className="text-slate-600 dark:text-slate-300">{deal.company_name}</span>
              </div>
            )}
            {deal.contact_name && (
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 shrink-0 text-slate-400" />
                <span className="text-slate-600 dark:text-slate-300">{deal.contact_name}</span>
              </div>
            )}
            {deal.expected_close_date && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 shrink-0 text-slate-400" />
                <span className="text-slate-600 dark:text-slate-300">Close {fmtDate(deal.expected_close_date)}</span>
              </div>
            )}
          </div>

          {/* Stage mover */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Move Stage</p>
            <div className="flex flex-wrap gap-2">
              {STAGES.map((s) => (
                <button
                  key={s.key}
                  disabled={s.key === deal.stage}
                  onClick={() => onStageChange(deal.id, s.key)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    s.key === deal.stage
                      ? `${s.bg} ${s.text} cursor-default`
                      : 'border border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600 dark:border-slate-600 dark:text-slate-400'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          {deal.notes && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Notes</p>
              <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{deal.notes}</p>
            </div>
          )}

          {/* Activity timeline */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Activity</p>
            <div className="flex gap-2">
              <input
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && addNote()}
                placeholder="Add a note…"
                className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              />
              <button
                onClick={addNote}
                disabled={savingNote || !newNote.trim()}
                className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-40"
              >
                {savingNote ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add'}
              </button>
            </div>
            {loadingAct && <p className="mt-3 text-xs text-slate-400">Loading…</p>}
            {activities.length > 0 && (
              <ul className="mt-3 space-y-2">
                {activities.map((act) => (
                  <li key={act.id} className="group flex items-start gap-2 text-sm">
                    <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                      <ActivityIcon type={act.activity_type} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-700 dark:text-slate-300">{act.title}</p>
                      <p className="text-[10px] text-slate-400">
                        {act.user_name} · {fmtDate(act.created_at)}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteActivity(act.id)}
                      className="shrink-0 opacity-0 group-hover:opacity-100 rounded p-0.5 text-slate-400 hover:text-red-500"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Kanban column
// ---------------------------------------------------------------------------

function KanbanColumn({ column, onOpenDetail, onDragStart, onDrop }) {
  const [dragOver, setDragOver] = useState(false)
  const stageInfo = STAGES.find((s) => s.key === column.stage) || STAGES[0]

  return (
    <div
      className={`flex min-w-[220px] max-w-[260px] flex-shrink-0 flex-col rounded-xl border transition-colors ${
        dragOver
          ? 'border-blue-400 bg-blue-50 dark:border-blue-500 dark:bg-blue-900/10'
          : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50'
      }`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={() => { setDragOver(false); onDrop(column.stage) }}
    >
      {/* Column header */}
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span className={`inline-block h-2 w-2 rounded-full ${stageInfo.bg.replace('bg-', 'bg-').split(' ')[0]}`} />
          <span className={`text-sm font-semibold ${stageInfo.text}`}>{stageInfo.label}</span>
          <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-slate-600 shadow-sm dark:bg-slate-700 dark:text-slate-300">
            {column.count}
          </span>
        </div>
        {column.total_value > 0 && (
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {fmtCurrency(column.total_value)}
          </span>
        )}
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-2 overflow-y-auto px-2 pb-2" style={{ maxHeight: 'calc(100vh - 240px)' }}>
        {column.deals.length === 0 && (
          <p className="py-4 text-center text-xs text-slate-400 dark:text-slate-500">No deals</p>
        )}
        {column.deals.map((deal) => (
          <DealCard key={deal.id} deal={deal} onOpenDetail={onOpenDetail} onDragStart={onDragStart} />
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function Deals() {
  const [pipeline, setPipeline] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [editDeal, setEditDeal] = useState(null)
  const [detailDeal, setDetailDeal] = useState(null)
  const dragDeal = useRef(null)

  useEffect(() => {
    loadPipeline()
  }, [])

  async function loadPipeline() {
    setLoading(true)
    setError(null)
    try {
      const res = await dealsApi.pipeline()
      setPipeline(res.data)
    } catch {
      setError('Failed to load pipeline')
    } finally {
      setLoading(false)
    }
  }

  function handleDragStart(deal) {
    dragDeal.current = deal
  }

  async function handleDrop(targetStage) {
    const deal = dragDeal.current
    dragDeal.current = null
    if (!deal || deal.stage === targetStage) return
    try {
      const res = await dealsApi.moveStage(deal.id, { stage: targetStage })
      const updated = res.data
      setPipeline((prev) =>
        prev.map((col) => {
          if (col.stage === deal.stage) {
            const remaining = col.deals.filter((d) => d.id !== deal.id)
            return { ...col, deals: remaining, count: remaining.length, total_value: remaining.reduce((s, d) => s + (d.value || 0), 0) }
          }
          if (col.stage === targetStage) {
            const updated_deals = [updated, ...col.deals]
            return { ...col, deals: updated_deals, count: updated_deals.length, total_value: updated_deals.reduce((s, d) => s + (d.value || 0), 0) }
          }
          return col
        })
      )
      if (detailDeal?.id === deal.id) setDetailDeal(updated)
      toast.success(`Moved to ${targetStage}`)
    } catch {
      toast.error('Failed to move deal')
    }
  }

  async function handleStageChange(dealId, newStage) {
    try {
      const res = await dealsApi.moveStage(dealId, { stage: newStage })
      const updated = res.data
      setPipeline((prev) =>
        prev.map((col) => {
          const old = col.deals.find((d) => d.id === dealId)
          if (old) {
            const remaining = col.deals.filter((d) => d.id !== dealId)
            return { ...col, deals: remaining, count: remaining.length, total_value: remaining.reduce((s, d) => s + (d.value || 0), 0) }
          }
          if (col.stage === newStage) {
            const updated_deals = [updated, ...col.deals]
            return { ...col, deals: updated_deals, count: updated_deals.length, total_value: updated_deals.reduce((s, d) => s + (d.value || 0), 0) }
          }
          return col
        })
      )
      setDetailDeal(updated)
      toast.success(`Moved to ${newStage}`)
    } catch {
      toast.error('Failed to move deal')
    }
  }

  function handleSaved(saved) {
    setPipeline((prev) =>
      prev.map((col) => {
        // Remove from old stage if updating
        const existing = col.deals.find((d) => d.id === saved.id)
        let deals = col.deals.filter((d) => d.id !== saved.id)
        // Add to correct stage
        if (col.stage === saved.stage) deals = [saved, ...deals]
        return { ...col, deals, count: deals.length, total_value: deals.reduce((s, d) => s + (d.value || 0), 0) }
      })
    )
    if (detailDeal?.id === saved.id) setDetailDeal(saved)
  }

  async function handleDelete(dealId) {
    if (!confirm('Delete this deal?')) return
    try {
      await dealsApi.delete(dealId)
      setPipeline((prev) =>
        prev.map((col) => {
          const deals = col.deals.filter((d) => d.id !== dealId)
          return { ...col, deals, count: deals.length, total_value: deals.reduce((s, d) => s + (d.value || 0), 0) }
        })
      )
      setDetailDeal(null)
      toast.success('Deal deleted')
    } catch {
      toast.error('Delete failed')
    }
  }

  const totalPipeline = pipeline.reduce((s, col) => s + col.total_value, 0)
  const totalDeals = pipeline.reduce((s, col) => s + col.count, 0)
  const weightedPipeline = pipeline.reduce(
    (s, col) => s + col.deals.reduce((cs, d) => cs + (d.value || 0) * (d.probability / 100), 0),
    0
  )

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-4 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Deals Pipeline</h1>
          <div className="mt-1 flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
            <span>{totalDeals} deals</span>
            <span>Pipeline: <strong className="text-slate-700 dark:text-slate-300">{fmtCurrency(totalPipeline)}</strong></span>
            <span className="hidden sm:inline">Weighted: <strong className="text-slate-700 dark:text-slate-300">{fmtCurrency(weightedPipeline)}</strong></span>
          </div>
        </div>
        <button
          onClick={() => { setEditDeal(null); setShowModal(true) }}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          New Deal
        </button>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-auto p-6">
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        )}

        {error && !loading && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
            {error}
            <button onClick={loadPipeline} className="ml-2 underline">Retry</button>
          </div>
        )}

        {!loading && !error && (
          <div className="flex gap-4">
            {pipeline.map((col) => (
              <KanbanColumn
                key={col.stage}
                column={col}
                onOpenDetail={setDetailDeal}
                onDragStart={handleDragStart}
                onDrop={handleDrop}
              />
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <DealModal
          deal={editDeal}
          onClose={() => { setShowModal(false); setEditDeal(null) }}
          onSaved={handleSaved}
        />
      )}

      {detailDeal && (
        <DetailPanel
          deal={detailDeal}
          onClose={() => setDetailDeal(null)}
          onEdit={() => { setEditDeal(detailDeal); setShowModal(true) }}
          onDelete={() => handleDelete(detailDeal.id)}
          onStageChange={handleStageChange}
        />
      )}
    </div>
  )
}
