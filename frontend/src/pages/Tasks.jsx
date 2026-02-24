import { useState, useEffect, useCallback } from 'react'
import {
  Plus,
  ListTodo,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowUp,
  ArrowRight,
  ArrowDown,
  Zap,
  Bot,
  Settings2,
  X,
  GripVertical,
  Filter,
  Calendar as CalendarIcon,
  User,
  Search,
} from 'lucide-react'
import api from '../api/client'
import toast from 'react-hot-toast'
import ContextMenu from '../components/shared/ContextMenu'
import EmptyState from '../components/shared/EmptyState'
import { useUndoable } from '../hooks/useUndoable'

const COLUMNS = [
  { id: 'todo', label: 'To Do', icon: ListTodo, color: 'bg-slate-500' },
  { id: 'in_progress', label: 'In Progress', icon: Clock, color: 'bg-brand-500' },
  { id: 'done', label: 'Done', icon: CheckCircle2, color: 'bg-emerald-500' },
]

const PRIORITY_CONFIG = {
  urgent: { label: 'Urgent', icon: AlertTriangle, color: 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/30', ring: 'ring-red-200 dark:ring-red-800' },
  high: { label: 'High', icon: ArrowUp, color: 'text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/30', ring: 'ring-orange-200 dark:ring-orange-800' },
  medium: { label: 'Medium', icon: ArrowRight, color: 'text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/30', ring: 'ring-yellow-200 dark:ring-yellow-800' },
  low: { label: 'Low', icon: ArrowDown, color: 'text-slate-500 bg-slate-50 dark:text-slate-400 dark:bg-slate-800', ring: 'ring-slate-200 dark:ring-slate-700' },
}

const SOURCE_CONFIG = {
  manual: { label: 'Manual', icon: User, color: 'text-slate-500' },
  ai: { label: 'AI', icon: Bot, color: 'text-brand-500' },
  automation: { label: 'Auto', icon: Zap, color: 'text-purple-500' },
}

const _today = new Date()
const _demoDate = (offset) => new Date(_today.getFullYear(), _today.getMonth(), _today.getDate() + offset).toISOString()

const DEMO_TASKS = [
  { id: 't1', title: 'Finalize TechVision contract', description: 'Review final terms and send signed contract by EOD.', priority: 'urgent', status: 'todo', due_date: _demoDate(0), source: 'manual' },
  { id: 't2', title: 'Review Q1 budget report', description: 'Amanda sent the Q4 financial review. Compare with Q1 projections.', priority: 'high', status: 'todo', due_date: _demoDate(1), source: 'ai' },
  { id: 't3', title: 'Send CloudFirst proposal', description: 'Prepare and send the updated proposal with revised pricing.', priority: 'high', status: 'todo', due_date: _demoDate(2), source: 'manual' },
  { id: 't4', title: 'Schedule kickoff call with Brightpath', description: 'Lisa Chen is available Tue/Wed/Thu. Pick a slot and send invite.', priority: 'medium', status: 'todo', due_date: _demoDate(3), source: 'ai' },
  { id: 't5', title: 'Update team on product roadmap', description: 'Share updated roadmap doc in team Slack channel.', priority: 'low', status: 'todo', due_date: _demoDate(5), source: 'manual' },
  { id: 't6', title: 'Prepare NovaTech demo', description: 'Set up demo environment and prepare slide deck for NovaTech.', priority: 'high', status: 'in_progress', due_date: _demoDate(1), source: 'manual' },
  { id: 't7', title: 'Follow up on overdue invoices', description: 'CloudFirst AG (€8,500) and MediaWave GmbH (€3,200) are overdue.', priority: 'urgent', status: 'in_progress', due_date: _demoDate(0), source: 'automation' },
  { id: 't8', title: 'Review PR #247: real-time notifications', description: 'Code review requested by @dev-alex. 12 files changed, +487/-23.', priority: 'medium', status: 'in_progress', due_date: _demoDate(2), source: 'ai' },
  { id: 't9', title: 'Update CRM pipeline stages', description: 'Move DataSync Corp to contacted, update deal values.', priority: 'low', status: 'done', due_date: _demoDate(-1), source: 'manual' },
  { id: 't10', title: 'Send meeting notes — Sprint Planning', description: 'Summarize action items from Friday sprint planning.', priority: 'medium', status: 'done', due_date: _demoDate(-1), source: 'ai' },
  { id: 't11', title: 'Configure email auto-classifier', description: 'Set up AI email classification automation in n8n.', priority: 'medium', status: 'done', due_date: _demoDate(-3), source: 'automation' },
  { id: 't12', title: 'Onboard new client: DataSync Corp', description: 'Create Drive folder, Slack channel, and CRM entry.', priority: 'high', status: 'done', due_date: _demoDate(-2), source: 'automation' },
]

function formatDueDate(dateStr) {
  if (!dateStr) return null
  const due = new Date(dateStr)
  const now = new Date()
  const diff = due - now
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24))

  if (days < 0) return { text: `${Math.abs(days)}d overdue`, className: 'text-red-600 dark:text-red-400 font-medium' }
  if (days === 0) return { text: 'Due today', className: 'text-orange-600 dark:text-orange-400 font-medium' }
  if (days === 1) return { text: 'Due tomorrow', className: 'text-yellow-600 dark:text-yellow-400' }
  if (days <= 7) return { text: `${days}d left`, className: 'text-slate-600 dark:text-slate-400' }
  return { text: due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), className: 'text-slate-500 dark:text-slate-400' }
}

function TaskCard({ task, onStatusChange, onDelete, onSelect, onKbSelect, isKbSelected }) {
  const [dragging, setDragging] = useState(false)
  const [ctxMenu, setCtxMenu] = useState(null)

  const handleContextMenu = (e) => {
    e.preventDefault()
    setCtxMenu({ x: e.clientX, y: e.clientY })
  }

  const ctxItems = [
    { label: 'Edit Task', icon: Settings2, action: () => onSelect?.(task) },
    ...(task.status !== 'in_progress' ? [{ label: 'Move to In Progress', icon: Clock, action: () => onStatusChange(task.id, 'in_progress') }] : []),
    ...(task.status !== 'done' ? [{ label: 'Mark as Done', icon: CheckCircle2, action: () => onStatusChange(task.id, 'done') }] : []),
    'divider',
    { label: 'Delete Task', icon: X, action: () => onDelete(task.id), danger: true },
  ]
  const priority = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium
  const source = SOURCE_CONFIG[task.source] || SOURCE_CONFIG.manual
  const PriorityIcon = priority.icon
  const SourceIcon = source.icon
  const dueInfo = formatDueDate(task.due_date)

  const handleDragStart = (e) => {
    e.dataTransfer.setData('text/plain', task.id)
    e.dataTransfer.setData('application/json', JSON.stringify(task))
    setDragging(true)
  }

  return (
    <>
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={() => setDragging(false)}
      onContextMenu={handleContextMenu}
      onClick={(e) => {
        if (!e.defaultPrevented) {
          onKbSelect?.(task)
          onSelect?.(task)
        }
      }}
      className={`group rounded-lg border bg-white p-3 shadow-sm transition-all dark:bg-slate-800 ${
        dragging
          ? 'opacity-50 border-brand-400 ring-2 ring-brand-200 dark:ring-brand-700'
          : isKbSelected
          ? 'border-brand-400 ring-2 ring-brand-200 dark:border-brand-500 dark:ring-brand-700'
          : 'border-slate-200 dark:border-slate-700 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600'
      } cursor-pointer`}
    >
      {/* Header: priority badge + source */}
      <div className="flex items-center justify-between mb-2">
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${priority.color}`}>
          <PriorityIcon className="h-3 w-3" />
          {priority.label}
        </span>
        <div className="flex items-center gap-1">
          <span className={`${source.color}`} title={`Source: ${source.label}`}>
            <SourceIcon className="h-3.5 w-3.5" />
          </span>
          <GripVertical className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      {/* Title */}
      <h4 className="text-sm font-medium text-slate-900 dark:text-white leading-snug mb-1">
        {task.title}
      </h4>

      {/* Description snippet */}
      {task.description && (
        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-2">
          {task.description}
        </p>
      )}

      {/* Footer: due date + actions */}
      <div className="flex items-center justify-between mt-2">
        {dueInfo ? (
          <span className={`flex items-center gap-1 text-xs ${dueInfo.className}`}>
            <CalendarIcon className="h-3 w-3" />
            {dueInfo.text}
          </span>
        ) : (
          <span />
        )}

        {/* Quick status change buttons (visible on hover) */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {task.status !== 'done' && (
            <button
              onClick={(e) => { e.preventDefault(); onStatusChange(task.id, task.status === 'todo' ? 'in_progress' : 'done') }}
              className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-brand-600 dark:hover:bg-slate-700 dark:hover:text-brand-400"
              title={task.status === 'todo' ? 'Start' : 'Complete'}
            >
              {task.status === 'todo' ? <Clock className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
            </button>
          )}
          <button
            onClick={(e) => { e.preventDefault(); onDelete(task.id) }}
            className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/30 dark:hover:text-red-400"
            title="Delete"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
    {ctxMenu && (
      <ContextMenu
        x={ctxMenu.x}
        y={ctxMenu.y}
        items={ctxItems}
        onClose={() => setCtxMenu(null)}
      />
    )}
    </>
  )
}

function KanbanColumn({ column, tasks, onStatusChange, onDelete, onSelect, onKbSelect, kbTaskId }) {
  const [dragOver, setDragOver] = useState(false)
  const Icon = column.icon

  const handleDragOver = (e) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = () => setDragOver(false)

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const taskId = e.dataTransfer.getData('text/plain')
    if (taskId) {
      onStatusChange(taskId, column.id)
    }
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex flex-col rounded-xl border transition-colors min-h-[24rem] ${
        dragOver
          ? 'border-brand-400 bg-brand-50/50 dark:border-brand-500 dark:bg-brand-900/20'
          : 'border-slate-200 bg-slate-50/50 dark:border-slate-700 dark:bg-slate-900/50'
      }`}
    >
      {/* Column header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-200 dark:border-slate-700">
        <div className={`flex h-6 w-6 items-center justify-center rounded-full ${column.color}`}>
          <Icon className="h-3.5 w-3.5 text-white" />
        </div>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{column.label}</h3>
        <span className="ml-auto rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">
          {tasks.length}
        </span>
      </div>

      {/* Cards */}
      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-slate-400 dark:text-slate-500">
            <Icon className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-xs">No tasks</p>
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onStatusChange={onStatusChange}
              onDelete={onDelete}
              onSelect={onSelect}
              onKbSelect={onKbSelect}
              isKbSelected={kbTaskId === task.id}
            />
          ))
        )}
      </div>
    </div>
  )
}

function AddTaskModal({ open, onClose, onAdd }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('medium')
  const [dueDate, setDueDate] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!title.trim()) return
    onAdd({
      title: title.trim(),
      description: description.trim() || null,
      priority,
      status: 'todo',
      due_date: dueDate ? new Date(dueDate).toISOString() : null,
      source: 'manual',
    })
    setTitle('')
    setDescription('')
    setPriority('medium')
    setDueDate('')
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Add Task</h3>
          <button onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details..."
              rows={3}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-40"
            >
              Add Task
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function TaskDetailPanel({ task, onClose, onStatusChange, onDelete }) {
  if (!task) return null
  const priority = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium
  const source = SOURCE_CONFIG[task.source] || SOURCE_CONFIG.manual
  const PriorityIcon = priority.icon
  const dueInfo = formatDueDate(task.due_date)

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={onClose}>
      <div
        className="w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-xl overflow-y-auto border-l border-slate-200 dark:border-slate-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 px-6 py-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Task Details</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6 space-y-5">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${priority.color}`}>
              <PriorityIcon className="h-3.5 w-3.5" />
              {priority.label}
            </span>
            <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-400 capitalize">
              {task.status.replace('_', ' ')}
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">{task.title}</h2>
          {task.description && (
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{task.description}</p>
          )}
          {dueInfo && (
            <div className={`flex items-center gap-2 text-sm ${dueInfo.className}`}>
              <CalendarIcon className="h-4 w-4" />
              {dueInfo.text}
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span>Source:</span>
            <span className="capitalize font-medium">{task.source}</span>
          </div>
          <div className="flex gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
            {task.status !== 'done' && (
              <button
                onClick={() => { onStatusChange(task.id, task.status === 'todo' ? 'in_progress' : 'done'); onClose() }}
                className="flex-1 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
              >
                {task.status === 'todo' ? 'Start Task' : 'Mark Complete'}
              </button>
            )}
            <button
              onClick={() => { onDelete(task.id); onClose() }}
              className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Tasks() {
  const { execute: withUndo } = useUndoable()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedTask, setSelectedTask] = useState(null)
  const [filterPriority, setFilterPriority] = useState('')
  const [filterSource, setFilterSource] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [kbTask, setKbTask] = useState(null)

  const fetchTasks = useCallback(async () => {
    try {
      const params = { page_size: 100 }
      if (filterPriority) params.priority = filterPriority
      if (filterSource) params.source = filterSource
      const { data } = await api.get('/tasks', { params })
      setTasks(data.items || data || [])
    } catch {
      // Demo fallback
      let demo = DEMO_TASKS
      if (filterPriority) demo = demo.filter((t) => t.priority === filterPriority)
      if (filterSource) demo = demo.filter((t) => t.source === filterSource)
      setTasks(demo)
    } finally {
      setLoading(false)
    }
  }, [filterPriority, filterSource])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  // Keyboard shortcuts (Linear-style)
  useEffect(() => {
    const PRIORITY_MAP = { '1': 'urgent', '2': 'high', '3': 'medium', '4': 'low' }
    const handleKey = (e) => {
      const tag = e.target.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable) return
      if (e.key === 'c' || e.key === 'C') {
        setShowModal(true)
        return
      }
      if (e.key === 'f' || e.key === 'F') {
        const el = document.querySelector('[data-task-search]')
        el?.focus()
        return
      }
      if (PRIORITY_MAP[e.key] && kbTask) {
        setTasks((prev) =>
          prev.map((t) => t.id === kbTask.id ? { ...t, priority: PRIORITY_MAP[e.key] } : t)
        )
        toast.success(`Priority set to ${PRIORITY_MAP[e.key]}`)
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [kbTask])

  const handleStatusChange = async (taskId, newStatus) => {
    // Update local state immediately
    setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, status: newStatus } : t))
    if (newStatus === 'done') toast.success('Task completed!')
    try {
      await api.put(`/tasks/${taskId}`, { status: newStatus })
    } catch {
      // Demo mode: keep local change
    }
  }

  const handleDelete = (taskId) => {
    const deletedTask = tasks.find((t) => t.id === taskId)
    withUndo({
      doAction: () => setTasks((prev) => prev.filter((t) => t.id !== taskId)),
      undoAction: () => {
        if (deletedTask) setTasks((prev) => [deletedTask, ...prev.filter((t) => t.id !== taskId)])
      },
      apiCall: () => api.delete(`/tasks/${taskId}`).catch(() => {}),
      message: 'Task deleted',
    })
  }

  const handleAdd = async (taskData) => {
    const newTask = {
      id: `t-${Date.now()}`,
      ...taskData,
      status: 'todo',
      source: 'manual',
      created_at: new Date().toISOString(),
    }
    setTasks((prev) => [newTask, ...prev])
    toast.success('Task created')
    try {
      const { data } = await api.post('/tasks', taskData)
      // Replace temp task with real one if API succeeds
      setTasks((prev) => prev.map((t) => t.id === newTask.id ? { ...t, ...data } : t))
    } catch {
      // Demo mode: keep locally created task
    }
  }

  // Filter by search
  const filteredTasks = searchQuery
    ? tasks.filter(
        (t) =>
          t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : tasks

  // Group by status
  const grouped = {
    todo: filteredTasks.filter((t) => t.status === 'todo'),
    in_progress: filteredTasks.filter((t) => t.status === 'in_progress'),
    done: filteredTasks.filter((t) => t.status === 'done'),
  }

  // Stats
  const overdue = tasks.filter((t) => t.status !== 'done' && t.due_date && new Date(t.due_date) < new Date()).length
  const dueToday = tasks.filter((t) => {
    if (t.status === 'done' || !t.due_date) return false
    const d = new Date(t.due_date)
    const now = new Date()
    return d.toDateString() === now.toDateString()
  }).length

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-96 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-700" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Tasks</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {tasks.filter((t) => t.status !== 'done').length} active
            {overdue > 0 && <span className="text-red-500 font-medium"> &middot; {overdue} overdue</span>}
            {dueToday > 0 && <span className="text-orange-500 font-medium"> &middot; {dueToday} due today</span>}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-brand-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Task
        </button>
      </div>

      {/* Filters bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            data-task-search
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks..."
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-brand-400 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
          >
            <option value="">All priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select
            value={filterSource}
            onChange={(e) => setFilterSource(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-brand-400 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
          >
            <option value="">All sources</option>
            <option value="manual">Manual</option>
            <option value="ai">AI</option>
            <option value="automation">Automation</option>
          </select>
        </div>
      </div>

      {/* Keyboard shortcut hints */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg bg-slate-50 px-4 py-2 text-xs text-slate-400 dark:bg-slate-800/50">
        <span><kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[10px] dark:border-slate-600 dark:bg-slate-700">C</kbd> New task</span>
        <span><kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[10px] dark:border-slate-600 dark:bg-slate-700">F</kbd> Search</span>
        <span><kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[10px] dark:border-slate-600 dark:bg-slate-700">1–4</kbd> Set priority</span>
        {kbTask && <span className="text-brand-500">Selected: {kbTask.title.slice(0, 30)}</span>}
      </div>

      {/* Kanban board */}
      {filteredTasks.length === 0 ? (
        <EmptyState
          icon={ListTodo}
          title="No tasks found"
          description={searchQuery ? 'No tasks match your search.' : 'Add your first task to get started.'}
          action="Add Task"
          onAction={() => setShowModal(true)}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {COLUMNS.map((col) => (
            <KanbanColumn
              key={col.id}
              column={col}
              tasks={grouped[col.id] || []}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
              onSelect={setSelectedTask}
              onKbSelect={setKbTask}
              kbTaskId={kbTask?.id}
            />
          ))}
        </div>
      )}

      {/* Add task modal */}
      <AddTaskModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onAdd={handleAdd}
      />

      {/* Task detail panel */}
      {selectedTask && (
        <TaskDetailPanel
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onStatusChange={handleStatusChange}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}
