import { useState, useEffect } from 'react'
import { Plus, Package, AlertTriangle, Search, Edit2, MoreVertical, ChevronDown, X, Loader2 } from 'lucide-react'
import { productsApi } from '../api/products'
import toast from 'react-hot-toast'

const UNITS = ['pcs', 'kg', 'm', 'l', 'box', 'set', 'pair']
const STOCK_COLOR = (on_hand, reorder_level) => {
  if (on_hand <= 0) return 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400'
  if (on_hand <= reorder_level) return 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400'
  return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400'
}

function ProductModal({ product, onClose, onSave }) {
  const [form, setForm] = useState({
    sku: '', name: '', description: '', category: '', unit: 'pcs',
    cost_price: '', sale_price: '', reorder_level: 5, track_inventory: true, is_active: true,
    ...product,
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = {
        ...form,
        cost_price: form.cost_price === '' ? null : Number(form.cost_price),
        sale_price: form.sale_price === '' ? null : Number(form.sale_price),
        reorder_level: Number(form.reorder_level),
      }
      if (product?.id) {
        await productsApi.update(product.id, payload)
      } else {
        await productsApi.create(payload)
      }
      onSave()
    } catch {
      toast.error('Failed to save product')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl dark:bg-slate-800" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-700">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            {product?.id ? 'Edit Product' : 'Add Product'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">SKU</label>
              <input value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white" placeholder="SKU-001" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Unit</label>
              <select value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white">
                {UNITS.map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Name *</label>
            <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Category</label>
            <input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Cost Price</label>
              <input type="number" step="0.01" value={form.cost_price} onChange={e => setForm(f => ({ ...f, cost_price: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Sale Price</label>
              <input type="number" step="0.01" value={form.sale_price} onChange={e => setForm(f => ({ ...f, sale_price: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Reorder Level</label>
              <input type="number" min="0" value={form.reorder_level} onChange={e => setForm(f => ({ ...f, reorder_level: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.track_inventory} onChange={e => setForm(f => ({ ...f, track_inventory: e.target.checked }))}
                className="h-4 w-4 rounded text-blue-600" />
              <span className="text-sm text-slate-700 dark:text-slate-300">Track inventory</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                className="h-4 w-4 rounded text-blue-600" />
              <span className="text-sm text-slate-700 dark:text-slate-300">Active</span>
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {product?.id ? 'Save Changes' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Products() {
  const [tab, setTab] = useState('products')
  const [products, setProducts] = useState([])
  const [lowStock, setLowStock] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null) // null | 'create' | product object
  const [openMenu, setOpenMenu] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const [pRes, lsRes] = await Promise.all([
        productsApi.list({ search: search || undefined, active_only: true }),
        productsApi.lowStock(),
      ])
      setProducts(pRes.data.items || [])
      setLowStock(lsRes.data || [])
    } catch {
      toast.error('Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [search])

  const handleSave = () => { setModal(null); load() }

  const handleDeactivate = async (id) => {
    try {
      await productsApi.delete(id)
      toast.success('Product deactivated')
      load()
    } catch {
      toast.error('Failed to deactivate product')
    }
    setOpenMenu(null)
  }

  const displayList = tab === 'low-stock' ? lowStock : products

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Products</h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            {products.length} active products · {lowStock.length} below reorder level
          </p>
        </div>
        <button onClick={() => setModal('create')}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
          <Plus className="h-4 w-4" /> Add Product
        </button>
      </div>

      {/* Tabs + search */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
          {[{ id: 'products', label: 'Products' }, { id: 'low-stock', label: `Low Stock (${lowStock.length})` }].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${tab === t.id ? 'bg-white shadow text-slate-900 dark:bg-slate-700 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search products..."
            className="rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        ) : displayList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Package className="h-10 w-10 mb-2" />
            <p className="font-medium">{tab === 'low-stock' ? 'No low stock items' : 'No products yet'}</p>
            {tab !== 'low-stock' && (
              <button onClick={() => setModal('create')} className="mt-3 text-sm text-blue-600 hover:underline">
                Add your first product
              </button>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                {['SKU', 'Name', 'Category', 'Unit', 'Cost', 'Sale Price', 'Stock', 'Reorder', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {displayList.map(p => (
                <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/40">
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{p.sku || '—'}</td>
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{p.name}</td>
                  <td className="px-4 py-3 text-slate-500">{p.category || '—'}</td>
                  <td className="px-4 py-3 text-slate-500">{p.unit}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {p.cost_price != null ? `€${p.cost_price.toFixed(2)}` : '—'}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                    {p.sale_price != null ? `€${p.sale_price.toFixed(2)}` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${STOCK_COLOR(p.stock_on_hand ?? 0, p.reorder_level)}`}>
                      {p.stock_on_hand ?? 0} {p.unit}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{p.reorder_level}</td>
                  <td className="px-4 py-3">
                    <div className="relative">
                      <button onClick={() => setOpenMenu(openMenu === p.id ? null : p.id)}
                        className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                      {openMenu === p.id && (
                        <div className="absolute right-0 top-8 z-20 min-w-36 rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-800">
                          <button onClick={() => { setModal(p); setOpenMenu(null) }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700">
                            <Edit2 className="h-4 w-4" /> Edit
                          </button>
                          <button onClick={() => handleDeactivate(p.id)}
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                            Deactivate
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

      {modal && (
        <ProductModal
          product={modal === 'create' ? null : modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
