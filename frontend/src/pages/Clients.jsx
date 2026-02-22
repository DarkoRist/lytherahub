import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  X,
  Sparkles,
  Loader2,
  Users,
  Mail,
  Calendar,
  Receipt,
  Globe,
  Building2,
  MapPin,
  Phone,
  AlertTriangle,
  Clock,
  FileText,
  GripVertical,
  Upload,
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../api/client'
import { formatCurrency, formatDate } from '../utils/formatters'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PIPELINE_STAGES = ['lead', 'contacted', 'proposal', 'negotiation', 'won', 'lost']
const STAGE_LABELS = {
  lead: 'Lead',
  contacted: 'Contacted',
  proposal: 'Proposal',
  negotiation: 'Negotiation',
  won: 'Won',
  lost: 'Lost',
}
const STAGE_COLORS = {
  lead: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
  contacted: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  proposal: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  negotiation: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  won: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  lost: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

// ---------------------------------------------------------------------------
// Demo data
// ---------------------------------------------------------------------------

const DEMO_CLIENTS = [
  { id: 'c1', company_name: 'TechVision GmbH', contact_name: 'Hans Weber', email: 'hans@techvision.de', phone: '+49 30 1234567', website: 'techvision.de', industry: 'SaaS', location: 'Berlin', pipeline_stage: 'won', deal_value: 45000, notes: 'Long-term client, very responsive.', last_contacted: '2026-02-13', enrichment_data: { description: 'Enterprise SaaS provider specializing in cloud infrastructure management.', size: '50-200 employees', founded: '2019' } },
  { id: 'c2', company_name: 'CloudFirst AG', contact_name: 'Sarah Mitchell', email: 'sarah@cloudfirst.com', phone: '+49 89 9876543', website: 'cloudfirst.com', industry: 'Cloud Services', location: 'Munich', pipeline_stage: 'negotiation', deal_value: 28000, notes: 'Interested in premium tier.', last_contacted: '2026-02-10', enrichment_data: { description: 'Cloud migration and managed services for SMBs.', size: '20-50 employees', founded: '2021' } },
  { id: 'c3', company_name: 'NovaTech Solutions', contact_name: 'Anna Schmidt', email: 'anna@novatech.io', phone: '+49 40 5551234', website: 'novatech.io', industry: 'AI/ML', location: 'Hamburg', pipeline_stage: 'proposal', deal_value: 35000, notes: 'Proposal sent, awaiting feedback.', last_contacted: '2026-02-08', enrichment_data: { description: 'AI and machine learning solutions for manufacturing.', size: '10-50 employees', founded: '2022' } },
  { id: 'c4', company_name: 'DesignStudio Co.', contact_name: 'Marcus Johnson', email: 'marcus@designstudio.com', phone: '+49 30 7778899', website: 'designstudio.com', industry: 'Design', location: 'Berlin', pipeline_stage: 'won', deal_value: 18000, notes: 'Recurring web design work.', last_contacted: '2026-02-12', enrichment_data: null },
  { id: 'c5', company_name: 'StartupHub Berlin', contact_name: 'Thomas Müller', email: 'thomas@startuphub.de', phone: '+49 30 2223344', website: 'startuphub.de', industry: 'Coworking', location: 'Berlin', pipeline_stage: 'contacted', deal_value: 15000, notes: 'Initial meeting went well.', last_contacted: '2026-02-05', enrichment_data: null },
  { id: 'c6', company_name: 'MediaWave GmbH', contact_name: 'Lisa Braun', email: 'lisa@mediawave.de', phone: '+49 69 4445566', website: 'mediawave.de', industry: 'Media', location: 'Frankfurt', pipeline_stage: 'lead', deal_value: 12000, notes: 'Found via LinkedIn.', last_contacted: '2026-01-28', enrichment_data: null },
  { id: 'c7', company_name: 'FinTech Solutions', contact_name: 'Robert Fischer', email: 'robert@fintech-solutions.de', phone: '+49 89 1112233', website: 'fintech-solutions.de', industry: 'FinTech', location: 'Munich', pipeline_stage: 'won', deal_value: 62000, notes: 'Biggest account. Quarterly reviews.', last_contacted: '2026-02-14', enrichment_data: { description: 'Payment processing and banking infrastructure for startups.', size: '200-500 employees', founded: '2018' } },
  { id: 'c8', company_name: 'GreenEnergy AG', contact_name: 'Petra Hoffmann', email: 'petra@greenenergy.de', phone: '+49 711 6667788', website: 'greenenergy.de', industry: 'Energy', location: 'Stuttgart', pipeline_stage: 'proposal', deal_value: 22000, notes: 'Interested in dashboard solution.', last_contacted: '2026-02-06', enrichment_data: null },
  { id: 'c9', company_name: 'DataSync Corp.', contact_name: 'Michael Schwarz', email: 'michael@datasync.io', phone: '+49 30 8889900', website: 'datasync.io', industry: 'Data', location: 'Berlin', pipeline_stage: 'contacted', deal_value: 20000, notes: 'Follow-up scheduled for next week.', last_contacted: '2026-02-11', enrichment_data: null },
  { id: 'c10', company_name: 'QuickShop GmbH', contact_name: 'Eva Klein', email: 'eva@quickshop.de', phone: '+49 221 3334455', website: 'quickshop.de', industry: 'E-commerce', location: 'Cologne', pipeline_stage: 'lead', deal_value: 8000, notes: 'Inbound from website.', last_contacted: '2026-02-01', enrichment_data: null },
  { id: 'c11', company_name: 'LogiTrans AG', contact_name: 'Kai Richter', email: 'kai@logitrans.de', phone: '+49 40 1234000', website: 'logitrans.de', industry: 'Logistics', location: 'Hamburg', pipeline_stage: 'lost', deal_value: 30000, notes: 'Went with competitor.', last_contacted: '2026-01-20', enrichment_data: null },
  { id: 'c12', company_name: 'BioPharm AG', contact_name: 'Sandra Meier', email: 'sandra@biopharm.de', phone: '+49 89 5556677', website: 'biopharm.de', industry: 'Pharma', location: 'Munich', pipeline_stage: 'negotiation', deal_value: 55000, notes: 'Complex procurement process.', last_contacted: '2026-02-09', enrichment_data: { description: 'Pharmaceutical R&D and clinical trial management.', size: '500+ employees', founded: '2012' } },
  { id: 'c13', company_name: 'EduLearn Platform', contact_name: 'Florian Wolf', email: 'florian@edulearn.de', phone: '+49 30 9990011', website: 'edulearn.de', industry: 'EdTech', location: 'Berlin', pipeline_stage: 'lead', deal_value: 10000, notes: 'Referral from TechVision.', last_contacted: '2026-02-03', enrichment_data: null },
  { id: 'c14', company_name: 'SecureNet GmbH', contact_name: 'Alex Bauer', email: 'alex@securenet.de', phone: '+49 69 7778800', website: 'securenet.de', industry: 'Cybersecurity', location: 'Frankfurt', pipeline_stage: 'contacted', deal_value: 40000, notes: 'Very interested after demo.', last_contacted: '2026-02-07', enrichment_data: null },
  { id: 'c15', company_name: 'FoodTech Berlin', contact_name: 'Julia Hartmann', email: 'julia@foodtech.de', phone: '+49 30 6665544', website: 'foodtech.de', industry: 'FoodTech', location: 'Berlin', pipeline_stage: 'lead', deal_value: 16000, notes: 'Met at conference.', last_contacted: '2026-01-25', enrichment_data: null },
]

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function Clients() {
  const queryClient = useQueryClient()
  const [viewMode, setViewMode] = useState('pipeline')
  const [search, setSearch] = useState('')
  const [selectedClient, setSelectedClient] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)

  const { data: clients, isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: () => api.get('/clients').then((r) => r.data?.items || r.data),
    placeholderData: DEMO_CLIENTS,
  })

  const { data: staleLeads } = useQuery({
    queryKey: ['clients-stale'],
    queryFn: () => api.get('/clients/stale').then((r) => r.data),
    placeholderData: DEMO_CLIENTS.filter((c) => {
      const days = Math.floor((Date.now() - new Date(c.last_contacted)) / 86400000)
      return days >= 7 && !['won', 'lost'].includes(c.pipeline_stage)
    }),
  })

  const updateStage = useMutation({
    mutationFn: ({ id, stage }) => api.put(`/clients/${id}/stage`, { pipeline_stage: stage }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      toast.success('Client stage updated')
    },
    onError: () => toast.error('Failed to update stage'),
  })

  const createClient = useMutation({
    mutationFn: (data) => api.post('/clients', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      setShowAddModal(false)
      toast.success('Client created')
    },
    onError: () => toast.error('Failed to create client'),
  })

  const enrichClient = useMutation({
    mutationFn: (id) => api.post(`/clients/${id}/enrich`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      toast.success('Client enriched with AI')
    },
    onError: () => toast.error('Failed to enrich client'),
  })

  const filteredClients = useMemo(() => {
    if (!clients) return []
    if (!search) return clients
    const q = search.toLowerCase()
    return clients.filter(
      (c) =>
        c.company_name.toLowerCase().includes(q) ||
        c.contact_name?.toLowerCase().includes(q) ||
        c.industry?.toLowerCase().includes(q) ||
        c.location?.toLowerCase().includes(q)
    )
  }, [clients, search])

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Clients</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Manage your pipeline and track client relationships.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" />
          Add Client
        </button>
      </div>

      {/* Stale leads alert */}
      {staleLeads?.length > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-900/20">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
              {staleLeads.length} lead{staleLeads.length !== 1 ? 's' : ''} haven't been contacted in 7+ days
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400">
              {staleLeads.slice(0, 3).map((c) => c.company_name).join(', ')}{staleLeads.length > 3 ? ` and ${staleLeads.length - 3} more` : ''}
            </p>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search clients..."
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          />
        </div>

        <div className="flex rounded-lg border border-slate-200 dark:border-slate-600">
          <button
            onClick={() => setViewMode('pipeline')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-l-lg transition-colors ${
              viewMode === 'pipeline'
                ? 'bg-brand-600 text-white'
                : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            <LayoutGrid className="h-4 w-4" />
            Pipeline
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-r-lg transition-colors ${
              viewMode === 'table'
                ? 'bg-brand-600 text-white'
                : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            <List className="h-4 w-4" />
            Table
          </button>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'pipeline' ? (
        <PipelineBoard
          clients={filteredClients}
          onClientClick={setSelectedClient}
          onStageChange={(id, stage) => updateStage.mutate({ id, stage })}
        />
      ) : (
        <ClientTable clients={filteredClients} loading={isLoading} onClientClick={setSelectedClient} />
      )}

      {/* Client detail slide-over */}
      {selectedClient && (
        <ClientDetailPanel
          client={selectedClient}
          onClose={() => setSelectedClient(null)}
          onEnrich={() => enrichClient.mutate(selectedClient.id)}
          enriching={enrichClient.isPending}
        />
      )}

      {/* Add client modal */}
      {showAddModal && (
        <AddClientModal
          isPending={createClient.isPending}
          onSubmit={(data) => createClient.mutate(data)}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Pipeline Board (Kanban)
// ---------------------------------------------------------------------------

function PipelineBoard({ clients, onClientClick, onStageChange }) {
  const grouped = useMemo(() => {
    const map = {}
    PIPELINE_STAGES.forEach((s) => (map[s] = []))
    clients.forEach((c) => {
      const stage = c.pipeline_stage || 'lead'
      if (map[stage]) map[stage].push(c)
    })
    return map
  }, [clients])

  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {PIPELINE_STAGES.map((stage) => {
        const stageClients = grouped[stage]
        const totalValue = stageClients.reduce((sum, c) => sum + (c.deal_value || 0), 0)

        return (
          <div
            key={stage}
            className="flex w-64 shrink-0 flex-col rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              const clientId = e.dataTransfer.getData('text/plain')
              if (clientId) onStageChange(clientId, stage)
            }}
          >
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STAGE_COLORS[stage]}`}>
                  {STAGE_LABELS[stage]}
                </span>
                <span className="text-xs text-slate-400">{stageClients.length}</span>
              </div>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {formatCurrency(totalValue)}
              </span>
            </div>

            <div className="flex-1 space-y-2 p-2 min-h-[200px]">
              {stageClients.map((client) => (
                <div
                  key={client.id}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData('text/plain', client.id)}
                  onClick={() => onClientClick(client)}
                  className="cursor-pointer rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition-all hover:shadow-md hover:-translate-y-px dark:border-slate-600 dark:bg-slate-800"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {client.company_name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {client.contact_name}
                      </p>
                    </div>
                    <GripVertical className="h-4 w-4 shrink-0 text-slate-300 dark:text-slate-600" />
                  </div>
                  {client.deal_value > 0 && (
                    <p className="mt-2 text-sm font-bold text-slate-800 dark:text-slate-200">
                      {formatCurrency(client.deal_value)}
                    </p>
                  )}
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    {client.industry && (
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-400">
                        {client.industry}
                      </span>
                    )}
                    {client.last_contacted && (
                      <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                        <Clock className="h-2.5 w-2.5" />
                        {formatDate(client.last_contacted)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Client Table
// ---------------------------------------------------------------------------

function ClientTable({ clients, loading, onClientClick }) {
  if (!loading && clients.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-16 dark:border-slate-700 dark:bg-slate-800">
        <Users className="h-12 w-12 text-slate-300 dark:text-slate-600" />
        <h3 className="mt-4 text-base font-semibold text-slate-800 dark:text-white">No clients found</h3>
        <p className="mt-1 text-sm text-slate-500">Add your first client to get started.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
      <table className="w-full min-w-[800px] text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/80 dark:border-slate-700 dark:bg-slate-800/80">
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Company</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Contact</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Industry</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Stage</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Deal Value</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Last Contact</th>
          </tr>
        </thead>
        <tbody>
          {clients.map((c) => (
            <tr
              key={c.id}
              onClick={() => onClientClick(c)}
              className="cursor-pointer border-b border-slate-100 transition-colors hover:bg-slate-50/50 dark:border-slate-700/50 dark:hover:bg-slate-700/30"
            >
              <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{c.company_name}</td>
              <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{c.contact_name}</td>
              <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{c.industry || '—'}</td>
              <td className="px-4 py-3">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STAGE_COLORS[c.pipeline_stage]}`}>
                  {STAGE_LABELS[c.pipeline_stage]}
                </span>
              </td>
              <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">
                {c.deal_value ? formatCurrency(c.deal_value) : '—'}
              </td>
              <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
                {c.last_contacted ? formatDate(c.last_contacted) : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Client Detail Panel (slide-over)
// ---------------------------------------------------------------------------

function ClientDetailPanel({ client, onClose, onEnrich, enriching }) {
  const c = client
  const [newNote, setNewNote] = useState('')
  const [notes, setNotes] = useState([
    { id: 1, text: 'Discussed Q1 roadmap and pricing adjustments.', date: '2026-02-10' },
  ])
  const [uploadedDocs, setUploadedDocs] = useState([])
  const [previewDoc, setPreviewDoc] = useState(null)

  const demoDocuments = [
    { name: 'Proposal_v2.pdf', date: '2026-02-12', size: '245 KB' },
    { name: 'Contract_Draft.docx', date: '2026-01-28', size: '128 KB' },
    { name: 'Meeting_Notes_Jan.pdf', date: '2026-01-15', size: '89 KB' },
  ]

  function formatFileSize(bytes) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  function handleFileUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const doc = {
      name: file.name,
      date: new Date().toISOString().split('T')[0],
      size: formatFileSize(file.size),
    }
    setUploadedDocs((prev) => [doc, ...prev])
    toast.success('Document uploaded')
    // Reset input so same file can be re-uploaded
    e.target.value = ''
  }

  const activities = [
    { type: 'email', desc: `Email sent to ${c.contact_name}`, time: '2 days ago' },
    { type: 'meeting', desc: 'Strategy meeting', time: '1 week ago' },
    { type: 'invoice', desc: `Invoice sent`, time: '2 weeks ago' },
    { type: 'note', desc: 'Pipeline stage updated', time: '3 weeks ago' },
  ]

  const activityIcons = { email: Mail, meeting: Calendar, invoice: Receipt, note: FileText }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={onClose}>
      <div className="h-full w-full max-w-lg overflow-y-auto bg-white shadow-xl dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 dark:border-slate-700 dark:bg-slate-900">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">{c.company_name}</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6 p-6">
          <div className="flex items-center gap-3">
            <span className={`rounded-full px-3 py-1 text-sm font-semibold ${STAGE_COLORS[c.pipeline_stage]}`}>
              {STAGE_LABELS[c.pipeline_stage]}
            </span>
            {c.deal_value > 0 && (
              <span className="text-lg font-bold text-slate-900 dark:text-white">{formatCurrency(c.deal_value)}</span>
            )}
          </div>

          <div className="space-y-2.5">
            <InfoRow icon={Users} label={c.contact_name} />
            <InfoRow icon={Mail} label={c.email} />
            {c.phone && <InfoRow icon={Phone} label={c.phone} />}
            {c.website && <InfoRow icon={Globe} label={c.website} />}
            {c.location && <InfoRow icon={MapPin} label={c.location} />}
            {c.industry && <InfoRow icon={Building2} label={c.industry} />}
          </div>

          {c.enrichment_data ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">AI Enrichment</span>
              </div>
              {c.enrichment_data.description && (
                <p className="text-sm text-slate-600 dark:text-slate-400">{c.enrichment_data.description}</p>
              )}
              <div className="mt-2 flex flex-wrap gap-2">
                {c.enrichment_data.size && (
                  <span className="rounded bg-slate-200 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-700 dark:text-slate-400">{c.enrichment_data.size}</span>
                )}
                {c.enrichment_data.founded && (
                  <span className="rounded bg-slate-200 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-700 dark:text-slate-400">Founded {c.enrichment_data.founded}</span>
                )}
              </div>
            </div>
          ) : (
            <button
              onClick={onEnrich}
              disabled={enriching}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 py-3 text-sm font-medium text-slate-500 hover:border-brand-400 hover:text-brand-600 dark:border-slate-600 dark:hover:border-brand-500 dark:hover:text-brand-400"
            >
              {enriching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Enrich with AI
            </button>
          )}

          {c.notes && (
            <div>
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Notes</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">{c.notes}</p>
            </div>
          )}

          <div>
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Activity Timeline</h4>
            <div className="space-y-3">
              {activities.map((a, i) => {
                const Icon = activityIcons[a.type] || FileText
                return (
                  <div key={i} className="flex items-start gap-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700">
                      <Icon className="h-3.5 w-3.5 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-700 dark:text-slate-300">{a.desc}</p>
                      <p className="text-xs text-slate-400">{a.time}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Documents & Notes */}
          <div>
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Documents & Notes</h4>

            {/* Add Note */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add a note..."
                className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              />
              <button
                onClick={() => {
                  if (newNote.trim()) {
                    setNotes((prev) => [{ id: Date.now(), text: newNote.trim(), date: new Date().toISOString().split('T')[0] }, ...prev])
                    setNewNote('')
                    toast.success('Note saved')
                  }
                }}
                className="rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
              >
                Save
              </button>
            </div>

            {/* Notes list */}
            {notes.length > 0 && (
              <div className="space-y-2 mb-4">
                {notes.map((note) => (
                  <div key={note.id} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/50">
                    <p className="text-sm text-slate-700 dark:text-slate-300">{note.text}</p>
                    <p className="text-xs text-slate-400 mt-1">{note.date}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Upload Document */}
            <label className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 py-3 text-sm font-medium text-slate-500 hover:border-brand-400 hover:text-brand-600 dark:border-slate-600 dark:hover:border-brand-500 dark:hover:text-brand-400 mb-3">
              <Upload className="h-4 w-4" />
              Upload Document
              <input type="file" className="hidden" onChange={handleFileUpload} />
            </label>

            {/* Uploaded documents (from this session) */}
            {uploadedDocs.length > 0 && (
              <div className="space-y-2 mb-2">
                {uploadedDocs.map((doc, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-lg border border-brand-200 bg-brand-50 px-3 py-2.5 dark:border-brand-800 dark:bg-brand-900/20 cursor-pointer hover:bg-brand-100 dark:hover:bg-brand-900/30 transition-colors"
                    onClick={() => toast.success(`Document preview available in production`)}
                  >
                    <FileText className="h-4 w-4 shrink-0 text-brand-500" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{doc.name}</p>
                      <p className="text-xs text-slate-400">{doc.date} · {doc.size}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Demo documents */}
            <div className="space-y-2">
              {demoDocuments.map((doc, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                  onClick={() => setPreviewDoc(doc)}
                >
                  <FileText className="h-4 w-4 shrink-0 text-slate-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{doc.name}</p>
                    <p className="text-xs text-slate-400">{doc.date} · {doc.size}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Document preview modal */}
            {previewDoc && (
              <div
                className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
                onClick={() => setPreviewDoc(null)}
              >
                <div
                  className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl dark:bg-slate-800"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <FileText className="h-6 w-6 text-brand-500" />
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white">{previewDoc.name}</h3>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                    Preview: <strong>{previewDoc.name}</strong> — This document would open in your browser when connected to Google Drive.
                  </p>
                  <p className="text-xs text-slate-400">{previewDoc.date} · {previewDoc.size}</p>
                  <button
                    onClick={() => setPreviewDoc(null)}
                    className="mt-4 w-full rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ icon: Icon, label }) {
  return (
    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
      <Icon className="h-4 w-4 shrink-0 text-slate-400" />
      <span>{label}</span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Add Client Modal
// ---------------------------------------------------------------------------

function AddClientModal({ isPending, onSubmit, onClose }) {
  const [form, setForm] = useState({
    company_name: '',
    contact_name: '',
    email: '',
    phone: '',
    website: '',
    industry: '',
    location: '',
    deal_value: '',
    pipeline_stage: 'lead',
    notes: '',
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.company_name.trim()) {
      toast.error('Company name is required')
      return
    }
    onSubmit({ ...form, deal_value: form.deal_value ? parseFloat(form.deal_value) : 0 })
  }

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-2xl dark:bg-slate-800">
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 dark:border-slate-700 dark:bg-slate-800">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Add Client</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Company Name *" value={form.company_name} onChange={set('company_name')} placeholder="TechVision GmbH" />
            <FormField label="Contact Name" value={form.contact_name} onChange={set('contact_name')} placeholder="Hans Weber" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Email" value={form.email} onChange={set('email')} placeholder="email@company.com" type="email" />
            <FormField label="Phone" value={form.phone} onChange={set('phone')} placeholder="+49 30 ..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Website" value={form.website} onChange={set('website')} placeholder="company.com" />
            <FormField label="Industry" value={form.industry} onChange={set('industry')} placeholder="SaaS, FinTech, ..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Location" value={form.location} onChange={set('location')} placeholder="Berlin" />
            <FormField label="Deal Value (EUR)" value={form.deal_value} onChange={set('deal_value')} placeholder="0" type="number" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Pipeline Stage</label>
            <select value={form.pipeline_stage} onChange={set('pipeline_stage')} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white">
              {PIPELINE_STAGES.map((s) => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
            </select>
          </div>
          <FormField label="Notes" value={form.notes} onChange={set('notes')} placeholder="Any additional notes..." textarea />

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700">Cancel</button>
            <button type="submit" disabled={isPending} className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50">
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Add Client
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function FormField({ label, value, onChange, placeholder, type = 'text', textarea = false }) {
  const cls = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
      {textarea ? (
        <textarea value={value} onChange={onChange} placeholder={placeholder} rows={2} className={cls} />
      ) : (
        <input type={type} value={value} onChange={onChange} placeholder={placeholder} className={cls} />
      )}
    </div>
  )
}
