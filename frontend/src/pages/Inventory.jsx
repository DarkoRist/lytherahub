import { useState, useEffect, useCallback } from 'react'
import {
  Warehouse, ArrowUpCircle, ArrowDownCircle, AlertTriangle,
  Search, Filter, Loader2, SlidersHorizontal, Plus, X
} from 'lucide-react'
import { inventoryApi } from '../api/inventory'
import { productsApi, warehousesApi } from '../api/products'
import toast from 'react-hot-toast'

const TYPE_META = {
  purchase:   { label: 'Purchase',   color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400', sign: '+' },
  sale:       { label: 'Sale',       color: 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400',               sign: '-' },
  adjustment: { label: 'Adjustment', color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400',           sign: '±' },
  transfer:   { label: 'Transfer',   color: 'text-violet-600 bg-violet-50 dark:bg-violet-900/20 dark:text-violet-400',   sign: '↔' },
  return:     { label: 'Return',     color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400',       sign: '+' },
}

function StockBar({ on_hand, reserved, reorder_level }) {
  const available = Math.max(0, on_hand - reserved)
  const max = Math.max(on_hand, reorder_level * 2, 1)
  const pctAvailable = Math.min(100, (available / max) * 100)
  const pctReserved = Math.min(100 - pctAvailable, (reserved / max) * 100)
  const isLow = on_hand <= reorder_level
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
        <div className="flex h-full">
          <div className={`h-full rounded-l-full ${isLow ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${pctAvailable}%` }} />
          <div className="h-full bg-slate-400 dark:bg-slate-500" style={{ width: `${pctReserved}%` }} />
        </div>
      </div>
      <span className={`text-xs font-semibold ${isLow ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
        {available}
      </span>
    </div>
  )
}

function AdjustModal({ products, warehouses, onClose, onSave }) {
  const [form, setForm] = useState({ product_id: '', warehouse_id: '', quantity_delta: '', notes: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.product_id || !form.warehouse_id || form.quantity_delta === '') return
    setLoading(true)
    try {
      await inventoryApi.adjust({
        product_id: form.product_id,
        warehouse_id: form.warehouse_id,
        quantity_delta: Number(form.quantity_delta),
        notes: form.notes || undefined,
      })
      toast.success('Stock adjusted')
      onSave()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to adjust stock')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl bg-white shadow-2xl dark:bg-slate-800" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-700">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Manual Stock Adjustment</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Product *</label>
            <select required value={form.product_id} onChange={e => setForm(f => ({ ...f, product_id: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white">
              <option value="">Select product…</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name} {p.sku ? `(${p.sku})` : ''}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Warehouse *</label>
            <select required value={form.warehouse_id} onChange={e => setForm(f => ({ ...f, warehouse_id: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white">
              <option value="">Select warehouse…</option>
              {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
              Quantity delta * <span className="text-slate-400">(positive = add, negative = remove)</span>
            </label>
            <input type="number" required value={form.quantity_delta} onChange={e => setForm(f => ({ ...f, quantity_delta: e.target.value }))}
              placeholder="e.g. 50 or -10"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Notes</label>
            <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Reason for adjustment…"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700">Cancel</button>
            <button type="submit" disabled={loading} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />} Adjust Stock
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Inventory() {
  const [tab, setTab] = useState('levels')
  const [levels, setLevels] = useState([])
  const [movements, setMovements] = useState([])
  const [movTotal, setMovTotal] = useState(0)
  const [products, setProducts] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showAdjust, setShowAdjust] = useState(false)
  const [movPage, setMovPage] = useState(1)
  const [filters, setFilters] = useState({ product_id: '', warehouse_id: '', movement_type: '' })

  const loadAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [levRes, movRes, prodRes, whRes] = await Promise.all([
        inventoryApi.levels(),
        inventoryApi.movements({ page: movPage, page_size: 50, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) }),
        productsApi.list({ active_only: true, page_size: 200 }),
        warehousesApi.list(),
      ])
      setLevels(levRes.data || [])
      setMovements(movRes.data?.items || [])
      setMovTotal(movRes.data?.total || 0)
      setProducts(prodRes.data?.items || [])
      setWarehouses(whRes.data || [])
    } catch {
      setError('Failed to load inventory data')
    } finally {
      setLoading(false)
    }
  }, [movPage, filters])

  useEffect(() => { loadAll() }, [loadAll])

  const lowStockLevels = levels.filter(l => l.is_low_stock)

  const tabs = [
    { id: 'levels', label: 'Stock Levels' },
    { id: 'movements', label: 'Movements' },
    { id: 'low-stock', label: `Low Stock (${lowStockLevels.length})` },
  ]

  const displayLevels = tab === 'low-stock' ? lowStockLevels : levels

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Inventory</h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            {levels.length} stock entries · {lowStockLevels.length} below reorder
          </p>
        </div>
        <button onClick={() => setShowAdjust(true)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
          <Plus className="h-4 w-4" /> Adjust Stock
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-slate-100 p-1 w-fit dark:bg-slate-800">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${tab === t.id ? 'bg-white shadow text-slate-900 dark:bg-slate-700 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      ) : tab === 'movements' ? (
        <MovementsTab
          movements={movements}
          total={movTotal}
          page={movPage}
          onPageChange={setMovPage}
          products={products}
          warehouses={warehouses}
          filters={filters}
          onFilterChange={setFilters}
        />
      ) : (
        <LevelsTab levels={displayLevels} />
      )}

      {showAdjust && (
        <AdjustModal
          products={products}
          warehouses={warehouses}
          onClose={() => setShowAdjust(false)}
          onSave={() => { setShowAdjust(false); loadAll() }}
        />
      )}
    </div>
  )
}

function LevelsTab({ levels }) {
  if (levels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white py-16 dark:border-slate-700 dark:bg-slate-800">
        <Warehouse className="mb-2 h-10 w-10 text-slate-300 dark:text-slate-600" />
        <p className="font-medium text-slate-500">No stock entries yet</p>
        <p className="mt-1 text-sm text-slate-400">Receive a purchase order or adjust stock to get started</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-700">
            {['Product', 'SKU', 'Warehouse', 'On Hand', 'Reserved', 'Available', 'Reorder', 'Status'].map(h => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
          {levels.map(l => (
            <tr key={`${l.product_id}-${l.warehouse_id}`} className="hover:bg-slate-50 dark:hover:bg-slate-700/40">
              <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{l.product_name}</td>
              <td className="px-4 py-3 font-mono text-xs text-slate-500">{l.sku || '—'}</td>
              <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{l.warehouse_name}</td>
              <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{l.on_hand}</td>
              <td className="px-4 py-3 text-slate-500">{l.reserved}</td>
              <td className="px-4 py-3">
                <StockBar on_hand={l.on_hand} reserved={l.reserved} reorder_level={l.reorder_level} />
              </td>
              <td className="px-4 py-3 text-slate-500">{l.reorder_level}</td>
              <td className="px-4 py-3">
                {l.is_low_stock ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-600 dark:bg-amber-900/20 dark:text-amber-400">
                    <AlertTriangle className="h-3 w-3" /> Low
                  </span>
                ) : (
                  <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">OK</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function MovementsTab({ movements, total, page, onPageChange, products, warehouses, filters, onFilterChange }) {
  const pageSize = 50
  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-600 dark:bg-slate-800">
          <SlidersHorizontal className="h-4 w-4 text-slate-400" />
          <select value={filters.product_id} onChange={e => onFilterChange(f => ({ ...f, product_id: e.target.value }))}
            className="text-sm text-slate-700 outline-none dark:bg-slate-800 dark:text-slate-300">
            <option value="">All products</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-600 dark:bg-slate-800">
          <select value={filters.warehouse_id} onChange={e => onFilterChange(f => ({ ...f, warehouse_id: e.target.value }))}
            className="text-sm text-slate-700 outline-none dark:bg-slate-800 dark:text-slate-300">
            <option value="">All warehouses</option>
            {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-600 dark:bg-slate-800">
          <select value={filters.movement_type} onChange={e => onFilterChange(f => ({ ...f, movement_type: e.target.value }))}
            className="text-sm text-slate-700 outline-none dark:bg-slate-800 dark:text-slate-300">
            <option value="">All types</option>
            {Object.entries(TYPE_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
        <span className="ml-auto text-sm text-slate-500">{total} movements</span>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
        {movements.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <ArrowUpCircle className="mb-2 h-10 w-10 text-slate-300 dark:text-slate-600" />
            <p className="font-medium text-slate-500">No movements found</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                {['Date', 'Product', 'Warehouse', 'Type', 'Delta', 'Reference', 'Notes'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {movements.map(m => {
                const meta = TYPE_META[m.type] || TYPE_META.adjustment
                const isPositive = m.quantity_delta > 0
                return (
                  <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/40">
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                      {new Date(m.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{m.product_name || m.product_id}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{m.warehouse_name || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${meta.color}`}>
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-semibold ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                        {isPositive ? '+' : ''}{m.quantity_delta}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{m.reference_id || '—'}</td>
                    <td className="px-4 py-3 text-slate-500">{m.notes || '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button disabled={page <= 1} onClick={() => onPageChange(p => p - 1)}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm disabled:opacity-40 hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-700">
            Previous
          </button>
          <span className="text-sm text-slate-500">Page {page} of {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => onPageChange(p => p + 1)}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm disabled:opacity-40 hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-700">
            Next
          </button>
        </div>
      )}
    </div>
  )
}
