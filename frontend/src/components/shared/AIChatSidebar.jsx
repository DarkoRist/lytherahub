import { useState, useRef, useEffect, useCallback } from 'react'
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  Loader2,
  Mail,
  Calendar,
  Receipt,
  ListTodo,
  Bot,
} from 'lucide-react'
import { useLocation } from 'react-router-dom'
import api from '../../api/client'

const QUICK_ACTIONS = [
  { label: 'Inbox summary', icon: Mail, prompt: 'Summarize my inbox' },
  { label: 'Today\'s schedule', icon: Calendar, prompt: 'What\'s my schedule today?' },
  { label: 'Overdue invoices', icon: Receipt, prompt: 'Show overdue invoices' },
  { label: 'My tasks', icon: ListTodo, prompt: 'What\'s on my todo list?' },
]

function MarkdownLite({ text }) {
  // Lightweight markdown: bold, italic, headers, tables, lists, line breaks
  const lines = text.split('\n')
  return (
    <div className="prose-sm dark:prose-invert max-w-none">
      {lines.map((line, i) => {
        // Headers
        if (line.startsWith('###')) return <h4 key={i} className="font-semibold text-sm mt-2 mb-1">{line.replace(/^###\s*/, '')}</h4>
        if (line.startsWith('##')) return <h3 key={i} className="font-semibold text-sm mt-2 mb-1">{line.replace(/^##\s*/, '')}</h3>

        // Table separator
        if (/^\|[-|:\s]+\|$/.test(line)) return null

        // Table rows
        if (line.startsWith('|')) {
          const cells = line.split('|').filter(Boolean).map(c => c.trim())
          const isHeader = i + 1 < lines.length && /^\|[-|:\s]+\|$/.test(lines[i + 1])
          return (
            <div key={i} className={`grid gap-1 text-xs py-0.5 ${isHeader ? 'font-semibold border-b border-slate-200 dark:border-slate-600' : ''}`}
              style={{ gridTemplateColumns: `repeat(${cells.length}, minmax(0, 1fr))` }}>
              {cells.map((cell, j) => <span key={j}>{formatInline(cell)}</span>)}
            </div>
          )
        }

        // List items
        if (/^\d+\.\s/.test(line)) return <div key={i} className="ml-2 text-sm">{formatInline(line)}</div>
        if (line.startsWith('- ')) return <div key={i} className="ml-2 text-sm">{formatInline(line)}</div>

        // Blockquote
        if (line.startsWith('>')) return <div key={i} className="border-l-2 border-brand-400 pl-2 text-sm text-slate-600 dark:text-slate-400 my-0.5">{formatInline(line.replace(/^>\s*/, ''))}</div>

        // Empty lines
        if (!line.trim()) return <div key={i} className="h-1" />

        return <p key={i} className="text-sm">{formatInline(line)}</p>
      })}
    </div>
  )
}

function formatInline(text) {
  // Bold, italic, inline code
  return text
    .replace(/\*\*(.+?)\*\*/g, '⟨b⟩$1⟨/b⟩')
    .replace(/\*(.+?)\*/g, '⟨i⟩$1⟨/i⟩')
    .replace(/`(.+?)`/g, '⟨code⟩$1⟨/code⟩')
    .split(/(⟨\/?[bi]⟩|⟨\/?code⟩)/)
    .reduce((acc, part, idx) => {
      if (part === '⟨b⟩') { acc.push({ type: 'b', start: true }); return acc }
      if (part === '⟨/b⟩') { acc.push({ type: 'b', start: false }); return acc }
      if (part === '⟨i⟩') { acc.push({ type: 'i', start: true }); return acc }
      if (part === '⟨/i⟩') { acc.push({ type: 'i', start: false }); return acc }
      if (part === '⟨code⟩') { acc.push({ type: 'code', start: true }); return acc }
      if (part === '⟨/code⟩') { acc.push({ type: 'code', start: false }); return acc }
      if (part) acc.push(part)
      return acc
    }, [])
    .map((part, i) => {
      if (typeof part === 'string') return <span key={i}>{part}</span>
      return null
    })
    // Simpler approach: use dangerouslySetInnerHTML for the inline formatting
    ? <span dangerouslySetInnerHTML={{
        __html: text
          .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
          .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.+?)\*/g, '<em>$1</em>')
          .replace(/`(.+?)`/g, '<code class="bg-slate-100 dark:bg-slate-700 px-1 rounded text-xs">$1</code>')
      }} />
    : text
}

export default function AIChatSidebar() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Welcome! I'm your AI business assistant. Ask me anything about your emails, calendar, invoices, clients, or tasks.",
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState(null)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const location = useLocation()

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  const getPageContext = () => {
    const path = location.pathname
    if (path.includes('inbox')) return 'inbox'
    if (path.includes('calendar')) return 'calendar'
    if (path.includes('invoices')) return 'invoices'
    if (path.includes('clients')) return 'clients'
    if (path.includes('reports')) return 'reports'
    if (path.includes('automations')) return 'automations'
    if (path.includes('tasks')) return 'tasks'
    if (path.includes('analytics')) return 'analytics'
    return 'dashboard'
  }

  const sendMessage = async (text) => {
    if (!text.trim() || loading) return
    const userMsg = { role: 'user', content: text.trim() }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const { data } = await api.post('/chat', {
        message: text.trim(),
        session_id: sessionId,
        page_context: getPageContext(),
      })
      setSessionId(data.session_id)
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }])
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: "Sorry, I couldn't process that request. Please try again." },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    sendMessage(input)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setOpen(!open)}
        className={`fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all duration-200 hover:scale-105 ${
          open
            ? 'bg-slate-600 text-white hover:bg-slate-700'
            : 'bg-brand-600 text-white hover:bg-brand-700'
        }`}
        aria-label="Toggle AI Chat"
      >
        {open ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
      </button>

      {/* Chat panel */}
      <div
        className={`fixed bottom-24 right-6 z-50 flex w-96 max-w-[calc(100vw-2rem)] flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl transition-all duration-300 dark:border-slate-700 dark:bg-slate-900 ${
          open ? 'h-[32rem] opacity-100 translate-y-0' : 'h-0 opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-700">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-900">
            <Sparkles className="h-4 w-4 text-brand-600 dark:text-brand-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">LytheraHub AI</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Ask anything about your business</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 ${
                  msg.role === 'user'
                    ? 'bg-brand-600 text-white rounded-br-md'
                    : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 rounded-bl-md'
                }`}
              >
                {msg.role === 'assistant' ? (
                  <MarkdownLite text={msg.content} />
                ) : (
                  <p className="text-sm">{msg.content}</p>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 dark:bg-slate-800">
                <Bot className="h-4 w-4 text-brand-500 animate-pulse" />
                <div className="flex gap-1">
                  <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick actions — show only when few messages */}
        {messages.length <= 2 && !loading && (
          <div className="flex flex-wrap gap-1.5 px-4 pb-2">
            {QUICK_ACTIONS.map(({ label, icon: Icon, prompt }) => (
              <button
                key={label}
                onClick={() => sendMessage(prompt)}
                className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-brand-500 dark:hover:bg-brand-900/30"
              >
                <Icon className="h-3 w-3" />
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <form
          onSubmit={handleSubmit}
          className="border-t border-slate-200 px-3 py-3 dark:border-slate-700"
        >
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything..."
              rows={1}
              className="flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white transition-colors hover:bg-brand-700 disabled:opacity-40 disabled:hover:bg-brand-600"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
