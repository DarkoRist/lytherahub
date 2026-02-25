import { useState, useEffect, useCallback } from 'react'
import {
  Plus, ShoppingCart, MoreVertical, X, Loader2,
  ChevronRight, Building2, Calendar, Truck
} from 'lucide-react'
import { purchaseOrdersApi } from '../api/purchaseOrders'
import { productsApi, warehousesApi } from '../api/products'
import api from '../api/client'
import toast from 'react-hot-toast'

const STATUS_META = {
  draft:               { label: 'Draft',             color: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300' },
  sent:                { label: 'Sent',              color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  partially_received:  { label: 'Partial',           color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  received:            { label: 'Received',          color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  closed:              { label: 'Closed',            color: 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400' },
}

function StatusBadge({ status }) {
  const m = STATUS_META[status] || STATUS_META.draft
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${m.color}`}>{m.label}</span>
}

/* ─── Create PO Modal ─────────────────────────────────────────────────── */
function CreatePOModal({ onClose, onSave }) {
  const [suppliers, setSuppliers] = useState([])
  const [products, setProducts] = useState([])
  const [form, setForm] = useState({ supplier_id: '', currency: 'EUR', expected_date: '', notes: '' })
  const [items, setItems] = useState([{ product_id: '', quantity_ordered: 1, unit_cost: '' }])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    Promise.all([
      api.get('/companies', { params: { company_type: 'supplier', page_size: 100 } }).then(r => setSuppliers(r.data?.items || [])).catch(() => {
        api.get('/companies', { params: { page_size: 100 } }).then(r => setSuppliers((r.data?.items || []).filter(c => c.company_type === 'supplier' || c.company_type === 'both'))).catch(() => {})
      }),
      productsApi.list({ active_only: true, page_size: 200 }).then(r => setProducts(r.data?.items || [])).catch(() => {}),
    ])
  }, [])

  const addItem = () => setItems(i => [...i, { product_id: '', quantity_ordered: 1, unit_cost: '' }])
  const removeItem = idx => setItems(i => i.filter((_, j) => j !== idx))
  const updateItem = (idx, field, value) => {
    setItems(i => i.map((item, j) => {
      if (j !== idx) return item
      const updated = { ...item, [field]: value }
      if (field === 'product_id') {
        const prod = products.find(p => p.id === value)
        if (prod?.cost_price != null) updated.unit_cost = prod.cost_price
      }
      return updated
    }))
  }

  const total = items.reduce((sum, it) => sum + (Number(it.quantity_ordered) || 0) * (Number(it.unit_cost) || 0), 0)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await purchaseOrdersApi.create({
        ...form,
        supplier_id: form.supplier_id || undefined,
        expected_date: form.expected_date || undefined,
        items: items.filter(it => it.product_id).map(it => ({
          product_id: it.product_id,
          quantity_ordered: Number(it.quantity_ordered),
          unit_cost: Number(it.unit_cost),
        })),
      })
      toast.success('Purchase order created')
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
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">New Purchase Order</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Supplier</label>
              <select value={form.supplier_id} onChange={e => setForm(f => ({ ...f, supplier_id: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white">
                <option value="">— No supplier —</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.company_name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Expected Date</label>
              <input type="date" value={form.expected_date} onChange={e => setForm(f => ({ ...f, expected_date: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
            </div>
          </div>

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
                  <input type="number" min="1" step="any" value={it.quantity_ordered} onChange={e => updateItem(idx, 'quantity_ordered', e.target.value)}
                    placeholder="Qty" className="w-20 rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
                  <input type="number" min="0" step="0.01" value={it.unit_cost} onChange={e => updateItem(idx, 'unit_cost', e.target.value)}
                    placeholder="Cost" className="w-24 rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
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
              {loading && <Loader2 className="h-4 w-4 animate-spin" />} Create PO
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ─── Receive Modal ───────────────────────────────────────────────────── */
function ReceiveModal({ order, warehouses, onClose, onSave }) {
  const [warehouseId, setWarehouseId] = useState(warehouses.find(w => w.is_default)?.id || '')
  const [qtys, setQtys] = useState(
    Object.fromEntries(order.items.map(it => [it.id, it.quantity_ordered - it.quantity_received]))
  )
  const [loading, setLoading] = useState(false)

  const handleReceive = async () => {
    if (!warehouseId) { toast.error('Select a warehouse'); return }
    setLoading(true)
    try {
      await purchaseOrdersApi.receive(order.id, {
        warehouse_id: warehouseId,
        items: Object.entries(qtys)
          .filter(([, q]) => Number(q) > 0)
          .map(([item_id, quantity_received]) => ({ item_id, quantity_received: Number(quantity_received) })),
      })
      toast.success('Stock received')
      onSave()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Receive failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl dark:bg-slate-800" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-700">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Receive — {order.order_number}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-4 p-6">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Warehouse *</label>
            <select value={warehouseId} onChange={e => setWarehouseId(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white">
              <option value="">Select warehouse…</option>
              {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}{w.is_default ? ' (default)' : ''}</option>)}
            </select>
          </div>

          <div className="space-y-3">
            {order.items.map(it => {
              const remaining = it.quantity_ordered - it.quantity_received
              const pct = it.quantity_ordered > 0 ? (it.quantity_received / it.quantity_ordered) * 100 : 0
              return (
                <div key={it.id} className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-900 dark:text-white">{it.product_name || it.product_id}</span>
                    <span className="text-xs text-slate-500">{it.quantity_received}/{it.quantity_ordered} received</span>
                  </div>
                  <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                    <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-slate-500">Receive now:</label>
                    <input type="number" min="0" max={remaining} step="any"
                      value={qtys[it.id] ?? 0}
                      onChange={e => setQtys(q => ({ ...q, [it.id]: e.target.value }))}
                      className="w-24 rounded-lg border border-slate-200 px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
                    <span className="text-xs text-slate-400">of {remaining} remaining</span>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700">Cancel</button>
            <button onClick={handleReceive} disabled={loading || !warehouseId}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              <Truck className="h-4 w-4" /> Receive Stock
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Detail Panel ─────────────────────────────────────────────────────── */
function DetailPanel({ order, warehouses, onClose, onRefresh }) {
  const [showReceive, setShowReceive] = useState(false)
  const [acting, setActing] = useState(null)

  const handleSend = async () => {
    setActing('send')
    try {
      await purchaseOrdersApi.send(order.id)
      toast.success('Order marked as sent')
      onRefresh()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed')
    } finally { setActing(null) }
  }

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full max-w-lg overflow-y-auto border-l border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 dark:border-slate-700 dark:bg-slate-900">
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Purchase Order</p>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">{order.order_number}</h2>
        </div>
        <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><X className="h-5 w-5" /></button>
      </div>

      <div className="p-6 space-y-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <StatusBadge status={order.status} />
            {order.supplier_name && (
              <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
                <Building2 className="h-4 w-4 text-slate-400" /> {order.supplier_name}
              </div>
            )}
            {order.expected_date && (
              <div className="flex items-center gap-1.5 text-sm text-slate-500">
                <Calendar className="h-4 w-4 text-slate-400" />
                Expected {new Date(order.expected_date).toLocaleDateString()}
              </div>
            )}
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-slate-900 dark:text-white">€{order.total_amount.toFixed(2)}</p>
            <p className="text-xs text-slate-400">{order.currency}</p>
          </div>
        </div>

        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Items</h3>
          <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 dark:divide-slate-700 dark:border-slate-700">
            {order.items.map(it => {
              const pct = it.quantity_ordered > 0 ? (it.quantity_received / it.quantity_ordered) * 100 : 0
              return (
                <div key={it.id} className="px-4 py-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{it.product_name || it.product_id}</p>
                      {it.product_sku && <p className="text-xs text-slate-400">{it.product_sku}</p>}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">€{(it.subtotal || 0).toFixed(2)}</p>
                      <p className="text-xs text-slate-400">{it.quantity_ordered} × €{it.unit_cost.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                      <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
                    </div>
                    <span className={`text-xs font-medium ${pct >= 100 ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {it.quantity_received}/{it.quantity_ordered}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {order.notes && (
          <div>
            <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Notes</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">{order.notes}</p>
          </div>
        )}

        <div className="flex flex-col gap-2 pt-2">
          {order.status === 'draft' && (
            <button onClick={handleSend} disabled={acting === 'send'}
              className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
              {acting === 'send' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Truck className="h-4 w-4" />}
              Mark as Sent
            </button>
          )}
          {(order.status === 'sent' || order.status === 'partially_received') && (
            <button onClick={() => setShowReceive(true)}
              className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 py-2.5 text-sm font-medium text-white hover:bg-emerald-700">
              <Truck className="h-4 w-4" /> Receive Stock
            </button>
          )}
        </div>
      </div>

      {showReceive && (
        <ReceiveModal order={order} warehouses={warehouses} onClose={() => setShowReceive(false)} onSave={() => { setShowReceive(false); onRefresh() }} />
      )}
    </div>
  )
}

/* ─── Main Page ────────────────────────────────────────────────────────── */
export default function PurchaseOrders() {
  const [orders, setOrders] = useState([])
  const [total, setTotal] = useState(0)
  const [warehouses, setWarehouses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showCreate, setShowCreate] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [openMenu, setOpenMenu] = useState(null)
  const [statusFilter, setStatusFilter] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = { page: 1, page_size: 50 }
      if (statusFilter) params.status = statusFilter
      const [ordRes, whRes] = await Promise.all([
        purchaseOrdersApi.list(params),
        warehousesApi.list(),
      ])
      setOrders(ordRes.data?.items || [])
      setTotal(ordRes.data?.total || 0)
      setWarehouses(whRes.data || [])
    } catch {
      setError('Failed to load purchase orders')
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => { load() }, [load])

  const refreshSelected = async () => {
    if (selectedOrder) {
      try {
        const r = await purchaseOrdersApi.get(selectedOrder.id)
        setSelectedOrder(r.data)
      } catch {}
    }
    load()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Purchase Orders</h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{total} total orders</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
          <Plus className="h-4 w-4" /> New PO
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {['', 'draft', 'sent', 'partially_received', 'received', 'closed'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
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
            <ShoppingCart className="mb-2 h-10 w-10" />
            <p className="font-medium">No purchase orders yet</p>
            <button onClick={() => setShowCreate(true)} className="mt-3 text-sm text-blue-600 hover:underline">Create first PO</button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                {['Order #', 'Supplier', 'Items', 'Total', 'Expected', 'Status', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {orders.map(o => (
                <tr key={o.id} className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/40" onClick={() => setSelectedOrder(o)}>
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-900 dark:text-white">{o.order_number}</td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{o.supplier_name || <span className="text-slate-400">—</span>}</td>
                  <td className="px-4 py-3 text-slate-500">{o.items?.length || 0}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">€{o.total_amount.toFixed(2)}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {o.expected_date ? new Date(o.expected_date).toLocaleDateString() : '—'}
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
                          <button onClick={() => { setSelectedOrder(o); setOpenMenu(null) }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700">
                            <ChevronRight className="h-4 w-4" /> View
                          </button>
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
        <DetailPanel order={selectedOrder} warehouses={warehouses} onClose={() => setSelectedOrder(null)} onRefresh={refreshSelected} />
      )}

      {showCreate && (
        <CreatePOModal onClose={() => setShowCreate(false)} onSave={() => { setShowCreate(false); load() }} />
      )}
    </div>
  )
}
