import { useState, useRef, useEffect, useCallback } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  Sparkles,
  Send,
  X,
  Loader2,
  Command,
  MessageSquare,
  Lightbulb,
} from 'lucide-react'
import api from '../../api/client'
import toast from 'react-hot-toast'

const ACTION_ROUTES = {
  'View Calendar': '/calendar',
  'Open Inbox': '/inbox',
  'Open Pipeline': '/clients',
  'Send Reminders': '/invoices',
  'View Revenue Report': '/reports',
  'Generate Full Report': '/reports',
  'Open Tasks': '/tasks',
}

const exampleCommands = [
  'Schedule a meeting with Hans tomorrow at 2pm',
  'How much revenue this month?',
  'Summarize my inbox',
  'Draft a follow-up to TechVision',
  'Show overdue invoices',
  'Create a weekly report',
]

function getDemoResponse(text) {
  const t = text.toLowerCase()
  if (t.includes('revenue') || t.includes('money') || t.includes('income'))
    return { response: 'Your revenue this month is €27,600, up 12% from January. Top clients: TechVision GmbH (€12,500), FinTech Solutions (€22,000). Outstanding invoices total €39,000.', actions: [{ label: 'View Revenue Report' }] }
  if (t.includes('client') || t.includes('deal') || t.includes('pipeline'))
    return { response: 'You have 15 active clients. 3 deals in negotiation worth €85,000. 2 stale leads need follow-up: StartupHub Berlin (12 days) and GreenEnergy AG (9 days).', actions: [{ label: 'Open Pipeline' }] }
  if (t.includes('invoice') || t.includes('overdue') || t.includes('payment'))
    return { response: '2 invoices overdue totaling €11,700. CloudFirst AG owes €8,500 (17 days late) and MediaWave GmbH owes €3,200 (15 days late). 3 invoices sent pending payment.', actions: [{ label: 'Send Reminders' }] }
  if (t.includes('email') || t.includes('inbox') || t.includes('mail') || t.includes('summarize'))
    return { response: '12 unread emails. 3 urgent: TechVision sent a contract update, Sarah Mitchell needs a decision by Friday, and CloudFirst AG is requesting a meeting. 2 newsletters can be archived.', actions: [{ label: 'Open Inbox' }] }
  if (t.includes('schedule') || t.includes('meeting') || t.includes('calendar'))
    return { response: '2 meetings today: 10:00 AM Standup with Engineering, 3:00 PM Client Call with Hans Weber. Tomorrow: Product demo at 11 AM. Your afternoon is free for focus work.', actions: [{ label: 'View Calendar' }] }
  if (t.includes('report') || t.includes('weekly') || t.includes('summary'))
    return { response: 'Weekly summary: Revenue up 12%, 47 emails processed, 8 meetings completed, 3 new clients onboarded. AI classified 93% of emails correctly. 2 automations saved an estimated 4.5 hours.', actions: [{ label: 'Generate Full Report' }] }
  if (t.includes('task') || t.includes('todo'))
    return { response: 'You have 5 tasks due today: Finalize TechVision contract, Review Q1 budget, Send CloudFirst proposal, Update team roadmap, Prepare NovaTech demo.', actions: [{ label: 'Open Tasks' }] }
  return { response: "Here's your business overview: €27,600 revenue this month (+12%), 12 unread emails, 2 meetings today, 5 tasks due. Everything looks on track!", actions: [] }
}

export default function CommandBar() {
  const [input, setInput] = useState('')
  const [response, setResponse] = useState(null)
  const inputRef = useRef(null)
  const navigate = useNavigate()

  const commandMutation = useMutation({
    mutationFn: async (text) => {
      try {
        const { data } = await api.post('/dashboard/command', { text })
        return data
      } catch {
        return getDemoResponse(text)
      }
    },
    onSuccess: (data) => {
      setResponse(data)
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    const trimmed = input.trim()
    if (!trimmed) return
    commandMutation.mutate(trimmed)
  }

  const handleClear = () => {
    setInput('')
    setResponse(null)
    commandMutation.reset()
    inputRef.current?.focus()
  }

  const handleExampleClick = (example) => {
    setInput(example)
    inputRef.current?.focus()
  }

  // Ctrl+K keyboard shortcut
  const handleKeyDown = useCallback((e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault()
      inputRef.current?.focus()
    }
  }, [])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
      <div className="p-4 sm:p-6">
        {/* Input Form */}
        <form onSubmit={handleSubmit} className="relative">
          <div className="relative flex items-center">
            <Sparkles className="absolute left-4 h-5 w-5 text-violet-400 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything or give a command..."
              disabled={commandMutation.isPending}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-28 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-100 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-700/50 dark:text-white dark:placeholder-slate-500 dark:focus:border-violet-500 dark:focus:bg-slate-700 dark:focus:ring-violet-900/30 sm:text-base sm:py-4"
            />
            <div className="absolute right-2 flex items-center gap-1.5">
              {(input || response) && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors dark:hover:bg-slate-600 dark:hover:text-slate-300"
                  title="Clear"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <button
                type="submit"
                disabled={!input.trim() || commandMutation.isPending}
                className="flex h-9 items-center gap-2 rounded-lg bg-violet-600 px-3.5 text-sm font-medium text-white transition-all hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed dark:bg-violet-500 dark:hover:bg-violet-600"
              >
                {commandMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">Send</span>
              </button>
            </div>
          </div>

          {/* Keyboard shortcut hint */}
          <div className="mt-2 flex items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {exampleCommands.slice(0, 3).map((cmd) => (
                <button
                  key={cmd}
                  type="button"
                  onClick={() => handleExampleClick(cmd)}
                  className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-500 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-600 dark:border-slate-600 dark:bg-slate-700/50 dark:text-slate-400 dark:hover:border-violet-700 dark:hover:bg-violet-900/20 dark:hover:text-violet-400"
                >
                  {cmd}
                </button>
              ))}
            </div>
            <div className="hidden items-center gap-1 text-xs text-slate-400 dark:text-slate-500 sm:flex">
              <kbd className="inline-flex h-5 items-center rounded border border-slate-200 bg-slate-100 px-1.5 font-mono text-[10px] text-slate-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-400">
                <Command className="mr-0.5 h-2.5 w-2.5" />K
              </kbd>
              <span>to focus</span>
            </div>
          </div>
        </form>

        {/* Loading State */}
        {commandMutation.isPending && (
          <div className="mt-4 rounded-xl border border-violet-100 bg-violet-50/50 p-4 dark:border-violet-800/30 dark:bg-violet-900/10">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-800/30">
                <Loader2 className="h-4 w-4 animate-spin text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-violet-700 dark:text-violet-300">
                  Processing your command...
                </p>
                <p className="text-xs text-violet-500 dark:text-violet-400">
                  AI is thinking
                </p>
              </div>
            </div>
          </div>
        )}

        {/* AI Response */}
        {response && !commandMutation.isPending && (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-600 dark:bg-slate-700/50">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-800/30 dark:to-indigo-800/30">
                <MessageSquare className="h-4 w-4 text-violet-600 dark:text-violet-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-900 dark:text-white mb-1">
                  AI Response
                </p>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {response.response || response.message || JSON.stringify(response)}
                </p>
                {response.actions && response.actions.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {response.actions.map((action, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          const route = ACTION_ROUTES[action.label] || action.url
                          if (route) {
                            navigate(route)
                          } else {
                            toast.success(`Action: ${action.label}`)
                          }
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-700 transition-colors hover:bg-violet-100 dark:border-violet-700 dark:bg-violet-900/20 dark:text-violet-300 dark:hover:bg-violet-900/40"
                      >
                        <Lightbulb className="h-3 w-3" />
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
