import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus,
  Upload,
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Receipt,
  X,
  Loader2,
  BarChart3,
  LineChart,
  Filter,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  Line,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
} from 'recharts'
import toast from 'react-hot-toast'
import api from '../api/client'
import InvoiceTable from '../components/invoices/InvoiceTable'

// ---------------------------------------------------------------------------
// Demo data
// ---------------------------------------------------------------------------

const DEMO_INVOICES = [
  { id: '1', invoice_number: 'INV-1001', client_name: 'TechVision GmbH', client_id: 'c1', amount: 12500, status: 'paid', due_date: '2026-01-15', paid_date: '2026-01-12', issued_date: '2025-12-15', currency: 'EUR' },
  { id: '2', invoice_number: 'INV-1002', client_name: 'CloudFirst AG', client_id: 'c2', amount: 8500, status: 'overdue', due_date: '2026-01-30', paid_date: null, issued_date: '2025-12-30', currency: 'EUR' },
  { id: '3', invoice_number: 'INV-1003', client_name: 'NovaTech Solutions', client_id: 'c3', amount: 4200, status: 'sent', due_date: '2026-02-28', paid_date: null, issued_date: '2026-02-01', currency: 'EUR' },
  { id: '4', invoice_number: 'INV-1004', client_name: 'DesignStudio Co.', client_id: 'c4', amount: 6800, status: 'paid', due_date: '2026-01-20', paid_date: '2026-01-18', issued_date: '2025-12-20', currency: 'EUR' },
  { id: '5', invoice_number: 'INV-1005', client_name: 'StartupHub Berlin', client_id: 'c5', amount: 15000, status: 'sent', due_date: '2026-03-01', paid_date: null, issued_date: '2026-02-01', currency: 'EUR' },
  { id: '6', invoice_number: 'INV-1006', client_name: 'MediaWave GmbH', client_id: 'c6', amount: 3200, status: 'overdue', due_date: '2026-02-01', paid_date: null, issued_date: '2026-01-01', currency: 'EUR' },
  { id: '7', invoice_number: 'INV-1007', client_name: 'FinTech Solutions', client_id: 'c7', amount: 22000, status: 'paid', due_date: '2026-02-10', paid_date: '2026-02-08', issued_date: '2026-01-10', currency: 'EUR' },
  { id: '8', invoice_number: 'INV-1008', client_name: 'TechVision GmbH', client_id: 'c1', amount: 9500, status: 'draft', due_date: '2026-03-15', paid_date: null, issued_date: '2026-02-14', currency: 'EUR' },
  { id: '9', invoice_number: 'INV-1009', client_name: 'GreenEnergy AG', client_id: 'c8', amount: 7800, status: 'sent', due_date: '2026-02-25', paid_date: null, issued_date: '2026-01-25', currency: 'EUR' },
  { id: '10', invoice_number: 'INV-1010', client_name: 'DataSync Corp.', client_id: 'c9', amount: 18500, status: 'paid', due_date: '2026-02-05', paid_date: '2026-02-03', issued_date: '2026-01-05', currency: 'EUR' },
]

const DEMO_STATS = {
  total_outstanding: 39200,
  total_overdue: 11700,
  paid_this_month: 40500,
  monthly_revenue: 52300,
  invoice_count: 10,
  overdue_count: 2,
}

const DEMO_REVENUE_DATA = [
  { month: 'Sep', revenue: 28000, invoiced: 32000 },
  { month: 'Oct', revenue: 35000, invoiced: 38000 },
  { month: 'Nov', revenue: 42000, invoiced: 45000 },
  { month: 'Dec', revenue: 31000, invoiced: 48000 },
  { month: 'Jan', revenue: 41300, invoiced: 44500 },
  { month: 'Feb', revenue: 40500, invoiced: 52300 },
]

const DEMO_FORECAST = Array.from({ length: 30 }, (_, i) => {
  const d = new Date()
  d.setDate(d.getDate() + i)
  return {
    date: d.toISOString().split('T')[0],
    expected_income: Math.round((Math.random() * 3000 + 500) * (i < 10 ? 1.2 : 0.8)),
    cumulative: Math.round(40500 + (i + 1) * 1500 + Math.random() * 2000),
  }
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(amount) {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// ---------------------------------------------------------------------------
// Invoices Page
// ---------------------------------------------------------------------------

export default function Invoices() {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('due_date')
  const [sortDir, setSortDir] = useState('desc')
  const [showAddModal, setShowAddModal] = useState(false)
  const [chartMode, setChartMode] = useState('revenue') // 'revenue' | 'forecast'

  // Fetch invoices
  const { data: invoices, isLoading } = useQuery({
    queryKey: ['invoices', statusFilter],
    queryFn: () => {
      const params = {}
      if (statusFilter !== 'all') params.status = statusFilter
      return api.get('/invoices', { params }).then((r) => r.data?.items || r.data)
    },
    placeholderData: DEMO_INVOICES,
  })

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['invoice-stats'],
    queryFn: () => api.get('/invoices/stats').then((r) => r.data),
    placeholderData: DEMO_STATS,
  })

  // Fetch forecast
  const { data: forecast } = useQuery({
    queryKey: ['invoice-forecast'],
    queryFn: () => api.get('/invoices/forecast').then((r) => r.data),
    placeholderData: DEMO_FORECAST,
    enabled: chartMode === 'forecast',
  })

  // Mark as paid
  const markPaid = useMutation({
    mutationFn: (id) =>
      api.put(`/invoices/${id}`, { status: 'paid', paid_date: new Date().toISOString() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['invoice-stats'] })
      toast.success('Invoice marked as paid')
    },
    onError: () => toast.error('Failed to update invoice'),
  })

  // Send reminder
  const sendReminder = useMutation({
    mutationFn: (id) => api.post(`/invoices/${id}/remind`),
    onSuccess: () => toast.success('Payment reminder sent'),
    onError: () => toast.error('Failed to send reminder'),
  })

  // Create invoice
  const createInvoice = useMutation({
    mutationFn: (data) => api.post('/invoices', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['invoice-stats'] })
      setShowAddModal(false)
      toast.success('Invoice created')
    },
    onError: () => toast.error('Failed to create invoice'),
  })

  // Delete invoice
  const deleteInvoice = useMutation({
    mutationFn: (id) => api.delete(`/invoices/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['invoice-stats'] })
      toast.success('Invoice deleted')
    },
    onError: () => toast.error('Failed to delete invoice'),
  })

  // Sort invoices client-side
  const sortedInvoices = useMemo(() => {
    if (!invoices) return []
    return [...invoices].sort((a, b) => {
      let av = a[sortBy]
      let bv = b[sortBy]
      if (typeof av === 'string') av = av.toLowerCase()
      if (typeof bv === 'string') bv = bv.toLowerCase()
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [invoices, sortBy, sortDir])

  const handleSort = (key, dir) => {
    setSortBy(key)
    setSortDir(dir)
  }

  const handleAction = (action, invoice) => {
    switch (action) {
      case 'mark_paid':
        markPaid.mutate(invoice.id)
        break
      case 'remind':
        sendReminder.mutate(invoice.id)
        break
      case 'delete':
        deleteInvoice.mutate(invoice.id)
        break
      default:
        break
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Invoices</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Track payments, send reminders, and forecast cash flow.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            <Plus className="h-4 w-4" />
            New Invoice
          </button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total Outstanding"
          value={formatCurrency(stats?.total_outstanding || 0)}
          icon={DollarSign}
          color="blue"
        />
        <StatCard
          label="Overdue"
          value={formatCurrency(stats?.total_overdue || 0)}
          sub={`${stats?.overdue_count || 0} invoices`}
          icon={AlertTriangle}
          color="red"
        />
        <StatCard
          label="Paid This Month"
          value={formatCurrency(stats?.paid_this_month || 0)}
          icon={CheckCircle2}
          color="green"
        />
        <StatCard
          label="Monthly Revenue"
          value={formatCurrency(stats?.monthly_revenue || 0)}
          icon={TrendingUp}
          color="purple"
        />
      </div>

      {/* Revenue chart */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            {chartMode === 'revenue' ? 'Revenue Overview' : 'Cash Flow Forecast'}
          </h3>
          <div className="flex rounded-lg border border-slate-200 dark:border-slate-600">
            <button
              onClick={() => setChartMode('revenue')}
              className={`flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-l-lg transition-colors ${
                chartMode === 'revenue'
                  ? 'bg-brand-600 text-white'
                  : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-700'
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              Revenue
            </button>
            <button
              onClick={() => setChartMode('forecast')}
              className={`flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-r-lg transition-colors ${
                chartMode === 'forecast'
                  ? 'bg-brand-600 text-white'
                  : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-700'
              }`}
            >
              <LineChart className="h-3.5 w-3.5" />
              Forecast
            </button>
          </div>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            {chartMode === 'revenue' ? (
              <ComposedChart data={DEMO_REVENUE_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid, #e2e8f0)" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(value) => [`€${value.toLocaleString()}`, '']}
                  contentStyle={{
                    background: 'var(--tooltip-bg, white)',
                    border: '1px solid var(--tooltip-border, #e2e8f0)',
                    borderRadius: '8px',
                    fontSize: '13px',
                  }}
                />
                <Bar dataKey="invoiced" name="Invoiced" fill="#93c5fd" radius={[4, 4, 0, 0]} />
                <Bar dataKey="revenue" name="Collected" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey="revenue" stroke="#1d4ed8" strokeWidth={2} dot={false} />
              </ComposedChart>
            ) : (
              <ComposedChart data={forecast || DEMO_FORECAST}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid, #e2e8f0)" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  stroke="#94a3b8"
                  tickFormatter={(v) => {
                    const d = new Date(v)
                    return `${d.getDate()}/${d.getMonth() + 1}`
                  }}
                  interval={4}
                />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(value, name) => [
                    `€${value.toLocaleString()}`,
                    name === 'cumulative' ? 'Cumulative' : 'Expected',
                  ]}
                  contentStyle={{
                    background: 'var(--tooltip-bg, white)',
                    border: '1px solid var(--tooltip-border, #e2e8f0)',
                    borderRadius: '8px',
                    fontSize: '13px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="cumulative"
                  fill="#dbeafe"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fillOpacity={0.3}
                />
                <Bar dataKey="expected_income" name="Expected" fill="#93c5fd" radius={[2, 2, 0, 0]} />
              </ComposedChart>
            )}
          </ResponsiveContainer>
        </div>

        {chartMode === 'forecast' && (
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 italic">
            Based on payment history, expect ~{formatCurrency(stats?.monthly_revenue ? stats.monthly_revenue * 0.85 : 44000)} collected this month.
          </p>
        )}
      </div>

      {/* Filter bar + table */}
      <div>
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Filter className="h-4 w-4 text-slate-400" />
          {['all', 'draft', 'sent', 'paid', 'overdue'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors ${
                statusFilter === s
                  ? 'bg-brand-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <InvoiceTable
          invoices={sortedInvoices}
          loading={isLoading}
          onAction={handleAction}
          sortBy={sortBy}
          sortDir={sortDir}
          onSort={handleSort}
        />
      </div>

      {/* Add Invoice Modal */}
      {showAddModal && (
        <AddInvoiceModal
          isPending={createInvoice.isPending}
          onSubmit={(data) => createInvoice.mutate(data)}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Stat Card
// ---------------------------------------------------------------------------

function StatCard({ label, value, sub, icon: Icon, color }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    red: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    green: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</span>
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${colors[color]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{sub}</p>}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Add Invoice Modal
// ---------------------------------------------------------------------------

function AddInvoiceModal({ isPending, onSubmit, onClose }) {
  const [form, setForm] = useState({
    invoice_number: `INV-${Date.now().toString().slice(-4)}`,
    client_name: '',
    amount: '',
    due_date: '',
    notes: '',
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.client_name.trim() || !form.amount || !form.due_date) {
      toast.error('Please fill in all required fields')
      return
    }
    onSubmit({
      ...form,
      amount: parseFloat(form.amount),
      status: 'draft',
      currency: 'EUR',
    })
  }

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl dark:bg-slate-800">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">New Invoice</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Invoice #</label>
              <input type="text" value={form.invoice_number} onChange={set('invoice_number')} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Client *</label>
              <input type="text" value={form.client_name} onChange={set('client_name')} placeholder="Company name" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Amount (EUR) *</label>
              <input type="number" step="0.01" value={form.amount} onChange={set('amount')} placeholder="0.00" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Due Date *</label>
              <input type="date" value={form.due_date} onChange={set('due_date')} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Notes</label>
            <textarea value={form.notes} onChange={set('notes')} rows={2} placeholder="Optional notes..." className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700">
              Cancel
            </button>
            <button type="submit" disabled={isPending} className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50">
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Invoice
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
