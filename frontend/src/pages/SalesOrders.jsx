import { useState, useEffect, useCallback } from 'react'
import {
  Plus, FileText, MoreVertical, X, Loader2, ChevronRight,
  Package, Building2, Calendar, CheckCircle, AlertCircle
} from 'lucide-react'
import { salesOrdersApi } from '../api/salesOrders'
import { productsApi } from '../api/products'
import api from '../api/client'
import toast from 'react-hot-toast'

const STATUS_META = {
  draft:               { label: 'Draft',                color: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300' },
  confirmed:           { label: 'Confirmed',            color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  partially_fulfilled: { label: 'Partial',              color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  fulfilled:           { label: 'Fulfilled',            color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  cancelled:           { label: 'Cancelled',            color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
}

function StatusBadge({ status }) {
  const m = STATUS_META[status] || STATUS_META.draft
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${m.color}`}>{m.label}</span>
}

/* ─── Create Order Modal ───────────────────────────────────────────────── */
function CreateOrderModal({ onClose, onSave }) {
  const [companies, setCompanies] = useState([])
  const [products, setProducts] = useState([])
  const [form, setForm] = useState({ company_id: '', currency: 'EUR', notes: '', due_date: '' })
  const [items, setItems] = useState([{ product_id: '', quantity: 1, unit_price: '', discount: 0 }])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    Promise.all([
      api.get('/companies').then(r => setCompanies(r.data?.items || [])),
      productsApi.list({ active_only: true, page_size: 200 }).then(r => setProducts(r.data?.items || [])),
    ]).catch(() => {})
  }, [])

  const addItem = () => setItems(i => [...i, { product_id: '', quantity: 1, unit_price: '', discount: 0 }])
  const removeItem = (idx) => setItems(i => i.filter((_, j) => j !== idx))
  const updateItem = (idx, field, value) => {
    setItems(i => i.map((item, j) => {
      if (j !== idx) return item
      const updated = { ...item, [field]: value }
      if (field === 'product_id') {
        const prod = products.find(p => p.id === value)
        if (prod?.sale_price != null) updated.unit_price = prod.sale_price
      }
      return updated
    }))
  }

  const total = items.reduce((sum, it) => {
    const q = Number(it.quantity) || 0
    const p = Number(it.unit_price) || 0
    const d = Number(it.discount) || 0
    return sum + q * p * (1 - d / 100)
  }, 0)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await salesOrdersApi.create({
        ...form,
        company_id: form.company_id || undefined,
        due_date: form.due_date || undefined,
        items: items.filter(it => it.product_id).map(it => ({
          product_id: it.product_id,
          quantity: Number(it.quantity),
          unit_price: Number(it.unit_price),
          discount: Number(it.discount) || 0,
        })),
      })
      toast.success('Sales order created')
      onSave()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create order')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-16" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-2xl dark:bg-slate-800" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-700">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">New Sales Order</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Company</label>
              <select value={form.company_id} onChange={e => setForm(f => ({ ...f, company_id: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white">
                <option value="">— No company —</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Due Date</label>
              <input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
            </div>
          </div>

          {/* Line items */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Line Items</label>
              <button type="button" onClick={addItem} className="text-xs text-blue-600 hover:underline">+ Add line</button>
            </div>
            <div className="space-y-2">
              {items.map((it, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <select value={it.product_id} onChange={e => updateItem(idx, 'product_id', e.target.value)}
                    className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white">
                    <option value="">Select product…</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <input type="number" min="0.01" step="any" value={it.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)}
                    placeholder="Qty" className="w-20 rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
                  <input type="number" min="0" step="0.01" value={it.unit_price} onChange={e => updateItem(idx, 'unit_price', e.target.value)}
                    placeholder="Price" className="w-24 rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
                  <input type="number" min="0" max="100" value={it.discount} onChange={e => updateItem(idx, 'discount', e.target.value)}
                    placeholder="% disc" className="w-20 rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
                  {items.length > 1 && (
                    <button type="button" onClick={() => removeItem(idx)} className="text-slate-400 hover:text-red-500"><X className="h-4 w-4" /></button>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-3 text-right text-sm font-semibold text-slate-900 dark:text-white">
              Total: €{total.toFixed(2)}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Notes</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700">Cancel</button>
            <button type="submit" disabled={loading} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />} Create Order
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ─── Fulfill Modal ────────────────────────────────────────────────────── */
function FulfillModal({ order, warehouses, onClose, onSave }) {
  const [warehouseId, setWarehouseId] = useState(warehouses.find(w => w.is_default)?.id || '')
  const [loading, setLoading] = useState(false)

  const handleFulfill = async () => {
    if (!warehouseId) { toast.error('Select a warehouse'); return }
    setLoading(true)
    try {
      await salesOrdersApi.fulfill(order.id, { warehouse_id: warehouseId })
      toast.success('Order fulfilled')
      onSave()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Fulfillment failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl bg-white shadow-2xl dark:bg-slate-800" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-700">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Fulfill {order.order_number}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-4 p-6">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            This will fulfill all remaining items and deduct stock from the selected warehouse.
          </p>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Warehouse *</label>
            <select value={warehouseId} onChange={e => setWarehouseId(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white">
              <option value="">Select warehouse…</option>
              {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}{w.is_default ? ' (default)' : ''}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            {order.items.map(it => (
              <div key={it.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm dark:bg-slate-700/50">
                <span className="text-slate-700 dark:text-slate-300">{it.product_name || it.product_id}</span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {it.fulfilled_quantity}/{it.quantity}
                </span>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700">Cancel</button>
            <button onClick={handleFulfill} disabled={loading || !warehouseId}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />} Fulfill All
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Detail Panel ─────────────────────────────────────────────────────── */
function DetailPanel({ order, warehouses, onClose, onRefresh }) {
  const [acting, setActing] = useState(null)
  const [showFulfill, setShowFulfill] = useState(false)

  const handleConfirm = async () => {
    setActing('confirm')
    try {
      await salesOrdersApi.confirm(order.id)
      toast.success('Order confirmed')
      onRefresh()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to confirm')
    } finally { setActing(null) }
  }

  const STATUS_STEPS = ['draft', 'confirmed', 'partially_fulfilled', 'fulfilled']
  const stepIdx = STATUS_STEPS.indexOf(order.status)

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full max-w-lg overflow-y-auto border-l border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 dark:border-slate-700 dark:bg-slate-900">
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Sales Order</p>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">{order.order_number}</h2>
        </div>
        <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><X className="h-5 w-5" /></button>
      </div>

      <div className="p-6 space-y-6">
        {/* Status + company */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <StatusBadge status={order.status} />
            {order.company_name && (
              <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
                <Building2 className="h-4 w-4 text-slate-400" />
                {order.company_name}
              </div>
            )}
            {order.due_date && (
              <div className="flex items-center gap-1.5 text-sm text-slate-500">
                <Calendar className="h-4 w-4 text-slate-400" />
                Due {new Date(order.due_date).toLocaleDateString()}
              </div>
            )}
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-slate-900 dark:text-white">€{order.total_amount.toFixed(2)}</p>
            <p className="text-xs text-slate-400">{order.currency}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            {STATUS_STEPS.map((s, i) => (
              <div key={s} className="flex items-center">
                <div className={`h-2 w-2 rounded-full ${i <= stepIdx ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`} />
                {i < STATUS_STEPS.length - 1 && (
                  <div className={`h-0.5 w-16 sm:w-24 ${i < stepIdx ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400">
            {STATUS_STEPS.map(s => <span key={s} className="capitalize">{s.replace('_', ' ')}</span>)}
          </div>
        </div>

        {/* Line items */}
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Items</h3>
          <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 dark:divide-slate-700 dark:border-slate-700">
            {order.items.map(it => (
              <div key={it.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{it.product_name || it.product_id}</p>
                  {it.product_sku && <p className="text-xs text-slate-400">{it.product_sku}</p>}
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">€{(it.subtotal || 0).toFixed(2)}</p>
                  <p className="text-xs text-slate-400">
                    {it.quantity} × €{it.unit_price.toFixed(2)}
                    {it.discount > 0 ? ` (${it.discount}% off)` : ''}
                  </p>
                  {order.status !== 'draft' && (
                    <p className={`text-xs font-medium ${it.fulfilled_quantity >= it.quantity ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {it.fulfilled_quantity}/{it.quantity} fulfilled
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {order.notes && (
          <div>
            <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Notes</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">{order.notes}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-2 pt-2">
          {order.status === 'draft' && (
            <button onClick={handleConfirm} disabled={acting === 'confirm'}
              className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
              {acting === 'confirm' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              Confirm Order
            </button>
          )}
          {(order.status === 'confirmed' || order.status === 'partially_fulfilled') && (
            <button onClick={() => setShowFulfill(true)}
              className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 py-2.5 text-sm font-medium text-white hover:bg-emerald-700">
              <Package className="h-4 w-4" /> Fulfill Order
            </button>
          )}
          {order.status === 'fulfilled' && (
            <button className="flex items-center justify-center gap-2 rounded-lg bg-slate-100 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300">
              <FileText className="h-4 w-4" /> Generate Invoice
            </button>
          )}
        </div>
      </div>

      {showFulfill && (
        <FulfillModal order={order} warehouses={warehouses} onClose={() => setShowFulfill(false)} onSave={() => { setShowFulfill(false); onRefresh() }} />
      )}
    </div>
  )
}

/* ─── Main Page ────────────────────────────────────────────────────────── */
export default function SalesOrders() {
  const [orders, setOrders] = useState([])
  const [total, setTotal] = useState(0)
  const [warehouses, setWarehouses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showCreate, setShowCreate] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [openMenu, setOpenMenu] = useState(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = { page, page_size: 20 }
      if (statusFilter) params.status = statusFilter
      const [ordRes, whRes] = await Promise.all([
        salesOrdersApi.list(params),
        import('../api/products').then(m => m.warehousesApi.list()),
      ])
      setOrders(ordRes.data?.items || [])
      setTotal(ordRes.data?.total || 0)
      setWarehouses(whRes.data || [])
    } catch {
      setError('Failed to load sales orders')
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter])

  useEffect(() => { load() }, [load])

  const handleAction = async (action, order) => {
    setOpenMenu(null)
    try {
      if (action === 'confirm') {
        await salesOrdersApi.confirm(order.id)
        toast.success('Order confirmed')
      } else if (action === 'cancel') {
        await salesOrdersApi.delete(order.id)
        toast.success('Order cancelled')
      }
      load()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Action failed')
    }
  }

  const refreshSelected = async () => {
    if (selectedOrder) {
      try {
        const r = await salesOrdersApi.get(selectedOrder.id)
        setSelectedOrder(r.data)
      } catch {}
    }
    load()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Sales Orders</h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{total} total orders</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
          <Plus className="h-4 w-4" /> New Order
        </button>
      </div>

      {/* Status filter */}
      <div className="flex flex-wrap gap-2">
        {['', 'draft', 'confirmed', 'partially_fulfilled', 'fulfilled', 'cancelled'].map(s => (
          <button key={s} onClick={() => { setStatusFilter(s); setPage(1) }}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${statusFilter === s ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'}`}>
            {s === '' ? 'All' : STATUS_META[s]?.label || s}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>
        ) : error ? (
          <div className="p-8 text-center text-red-600 dark:text-red-400">{error}</div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <FileText className="mb-2 h-10 w-10" />
            <p className="font-medium">No sales orders yet</p>
            <button onClick={() => setShowCreate(true)} className="mt-3 text-sm text-blue-600 hover:underline">Create first order</button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                {['Order #', 'Company', 'Items', 'Total', 'Due Date', 'Status', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {orders.map(o => (
                <tr key={o.id} className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/40"
                  onClick={() => setSelectedOrder(o)}>
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-900 dark:text-white">{o.order_number}</td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{o.company_name || <span className="text-slate-400">—</span>}</td>
                  <td className="px-4 py-3 text-slate-500">{o.items?.length || 0}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">€{o.total_amount.toFixed(2)}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {o.due_date ? new Date(o.due_date).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <div className="relative">
                      <button onClick={() => setOpenMenu(openMenu === o.id ? null : o.id)}
                        className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                      {openMenu === o.id && (
                        <div className="absolute right-0 top-8 z-20 min-w-36 rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-800">
                          <button onClick={() => setSelectedOrder(o)} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700">
                            <ChevronRight className="h-4 w-4" /> View
                          </button>
                          {o.status === 'draft' && (
                            <button onClick={() => handleAction('confirm', o)} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                              <CheckCircle className="h-4 w-4" /> Confirm
                            </button>
                          )}
                          {o.status !== 'cancelled' && o.status !== 'fulfilled' && (
                            <button onClick={() => handleAction('cancel', o)} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                              Cancel
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedOrder && (
        <DetailPanel
          order={selectedOrder}
          warehouses={warehouses}
          onClose={() => setSelectedOrder(null)}
          onRefresh={refreshSelected}
        />
      )}

      {showCreate && (
        <CreateOrderModal onClose={() => setShowCreate(false)} onSave={() => { setShowCreate(false); load() }} />
      )}
    </div>
  )
}
