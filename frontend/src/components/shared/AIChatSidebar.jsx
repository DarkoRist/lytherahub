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

function getLastAIMessage(messages) {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'assistant') return messages[i].content
  }
  return ''
}

function getChatDemoReply(text, messages = []) {
  const t = text.toLowerCase().trim()

  // --- Affirmative follow-ups ---
  const affirmatives = ['yes', 'sure', 'ok', 'okay', 'do it', 'go ahead', 'yep', 'yeah', 'please', 'sounds good', "let's do it"]
  if (affirmatives.some(a => t === a || t === a + '!' || t === a + '.')) {
    const lastAI = getLastAIMessage(messages)
    const ctx = lastAI.toLowerCase()
    if (ctx.includes('draft repl') || ctx.includes('draft replies') || ctx.includes('urgent ones')) {
      return "I'll draft replies for all 3 urgent emails. Here's what I've prepared:\n\n**1. Frank Hartmann (SmartHome)** — Acknowledged the IoT dashboard issue and proposed a fix timeline for next Tuesday.\n\n**2. Hans Weber (TechVision)** — Confirmed the Q1 contract review meeting for Thursday at 2 PM.\n\n**3. Dr. Vogel (BioPharm)** — Thanked them for the data visualization project inquiry and requested a brief call.\n\nWant me to send these, or would you like to edit any of them first?"
    }
    if (ctx.includes('reminder') || ctx.includes('send reminder') || ctx.includes('overdue account')) {
      return "Done! I've sent a polite payment reminder to CloudFirst AG for invoice #INV-1002 (€8,500). This is their second reminder — the tone has been slightly firmed up. I'll escalate again in 7 days if unpaid."
    }
    if (ctx.includes('send') && ctx.includes('these')) {
      return "All 3 emails sent successfully!\n\n- **Frank Hartmann** — Sent at 10:32 AM\n- **Hans Weber** — Sent at 10:32 AM\n- **Dr. Vogel** — Sent at 10:32 AM\n\nI've logged these in your activity feed. Anything else?"
    }
    if (ctx.includes('schedule') || ctx.includes('free slot')) {
      return "Meeting scheduled! I've booked **1:00 PM - 2:00 PM** today.\n\nI'll send a calendar invite and add a prep brief 30 minutes before. What's the meeting about?"
    }
    if (ctx.includes('follow-up') || ctx.includes('follow up') || ctx.includes('stale lead')) {
      return "Done! I've created follow-up tasks for all 3 stale leads:\n\n1. **GreenEnergy AG** — Follow up tomorrow at 9 AM\n2. **StartupHub Berlin** — Follow up tomorrow at 10 AM\n3. **EduLearn Platform** — Follow up Wednesday at 9 AM\n\nI'll draft personalized emails for each. Want to review them?"
    }
    if (ctx.includes('invoice') || ctx.includes('outstanding') || ctx.includes('overdue')) {
      return "Done! I've flagged CloudFirst AG and MediaWave GmbH as overdue and queued reminders. I'll notify you when they respond."
    }
    if (ctx.length > 0) {
      return "Got it! I'm on it. Anything else you'd like me to do?"
    }
    return "Sure! What would you like me to help with?"
  }

  // --- Revenue / money / income ---
  if (t.includes('revenue') || t.includes('money') || t.includes('income') || t.includes('earning')) {
    return "📊 **Revenue Summary**\n\nYour revenue this month is **€27,600**, down 18.3% from January's €33,800. Main drivers:\n- TechVision GmbH: €12,500 paid ✓\n- FinTech Solutions: €22,000 paid ✓\n- CloudFirst AG: €8,500 overdue ⚠️\n- MediaWave GmbH: €3,200 overdue ⚠️\n\nTotal outstanding: **€39,200**. I recommend sending reminders to CloudFirst and MediaWave today."
  }

  // --- Invoice / overdue / payment ---
  if (t.includes('invoice') || t.includes('overdue') || t.includes('payment') || t.includes('unpaid')) {
    return "🧾 **Invoice Status**\n\n2 invoices are overdue:\n- **CloudFirst AG** — €8,500 (17 days late)\n- **MediaWave GmbH** — €3,200 (15 days late)\n\nTotal at risk: **€11,700**. Shall I draft reminder emails for both? I can escalate the tone since these are past 14 days."
  }

  // --- Email / inbox / unread ---
  if (t.includes('email') || t.includes('inbox') || t.includes('mail') || t.includes('unread')) {
    return "📧 **Inbox Summary**\n\n12 unread emails. Here's what needs attention:\n\n**Urgent (3):**\n- Frank Hartmann — IoT dashboard contract update\n- Sarah Mitchell — Decision needed by Friday\n- Dr. Vogel — Q1 review scheduling\n\n**Clients (2):** NovaTech proposal feedback, SecureNet follow-up\n**Invoices (4):** Payment confirmations and queries\n\nI can draft replies to any of these. Who should I start with?"
  }

  // --- Client / pipeline / lead / deal ---
  if (t.includes('client') || t.includes('pipeline') || t.includes('lead') || t.includes('deal')) {
    return "👥 **Pipeline Overview**\n\n15 active clients across 6 stages:\n- **Won** (4): FinTech, TechVision, DesignStudio, DataSync — €147K total\n- **Negotiation** (2): CloudFirst (€28K), BioPharm (€55K) — close soon\n- **Proposal** (2): NovaTech (€35K), GreenEnergy (€22K)\n- **Stale leads** (3): No contact in 7+ days\n\n💡 Recommendation: Follow up with StartupHub Berlin today — 12 days since last contact."
  }

  // --- Meeting / calendar / schedule / today ---
  if (t.includes('meeting') || t.includes('calendar') || t.includes('schedule') || t.includes('today')) {
    return "📅 **Today's Schedule**\n\n**10:00 AM** — Team Standup (Engineering)\n**3:00 PM** — Client Call with Hans Weber (TechVision)\n\nMeeting prep for the 3 PM call is ready. Hans's company has an open invoice of €9,500 and they've expressed interest in expanding scope.\n\nTomorrow: Product demo with NovaTech at 11 AM. Prep brief not yet generated — want me to create it?"
  }

  // --- Task / todo / to do ---
  if (t.includes('task') || t.includes('todo') || t.includes('to do') || t.includes('do today')) {
    return "✅ **Your Tasks**\n\n**Due today (2 urgent):**\n- Finalize TechVision contract — *Urgent*\n- Follow up on overdue invoices — *Urgent*\n\n**Due this week:**\n- Send CloudFirst proposal (tomorrow)\n- Schedule NovaTech kickoff call (Wed)\n- Q1 budget review (Thu)\n\n**In progress (2):** NovaTech demo prep, PR #247 review\n\nWant me to prioritize or create any new tasks?"
  }

  // --- Report / weekly / summary / performance ---
  if (t.includes('report') || t.includes('weekly') || t.includes('summary') || t.includes('performance')) {
    return "📈 **This Week's Summary**\n\n**Revenue:** €22,000 collected, 3 invoices sent\n**Emails:** 42 processed, 6 urgent replied, 12 auto-archived\n**Meetings:** 8 total — 3 client calls, 2 strategy sessions\n**Tasks:** 18 completed, 4 AI-generated\n**Pipeline:** 2 new leads, 1 deal closed (FinTech Solutions)\n\n🤖 Automations saved ~4.5 hours this week.\n\nFull report available in the Reports section."
  }

  // --- Automation / workflow ---
  if (t.includes('automation') || t.includes('workflow')) {
    return "⚡ **Automations Running**\n\n5 of 6 automations are active:\n- **Invoice Reminder** — Ran today at 6 AM ✓\n- **Meeting Prep Generator** — Runs daily at 8 PM ✓\n- **Email Auto-Classifier** — Running continuously ✓\n- **New Lead Onboarding** — Last run: 3 days ago ✓\n- **Weekly Report** — Runs every Monday ✓\n- **Slack Daily Briefing** — *Disabled*\n\n312 total automation runs this month, saving ~15 hours."
  }

  // --- Help / what can you do ---
  if (t.includes('help') || t.includes('what can you') || t.includes('what do')) {
    return "🤖 **I can help you with:**\n\n- **Revenue & Invoices** — \"How much is outstanding?\"\n- **Inbox** — \"Summarize urgent emails\"\n- **Calendar** — \"What's my schedule tomorrow?\"\n- **Clients** — \"Which leads need follow-up?\"\n- **Tasks** — \"What's due today?\"\n- **Reports** — \"Show this week's performance\"\n- **Automations** — \"What automations are running?\"\n\nJust ask naturally — I understand context!"
  }

  // --- Short / ambiguous message: use conversation context ---
  if (t.length <= 10) {
    const lastAI = getLastAIMessage(messages)
    if (lastAI && lastAI.length > 20) {
      const ctx = lastAI.toLowerCase()
      if (ctx.includes('schedule') || ctx.includes('free slot') || ctx.includes('calendar')) {
        return `Got it — I'll check availability around that date. Do you want me to schedule something specific, or would you like to see what's on the calendar then?`
      }
      if (ctx.includes('invoice') || ctx.includes('overdue') || ctx.includes('payment')) {
        return `Understood. I'll filter invoices by that date. Want me to show all invoices due around that time, or just the overdue ones?`
      }
      return `I see you're referencing "${text.trim()}" — can you give me a bit more context? I want to make sure I'm helping with the right thing.`
    }
  }

  // --- Default / fallback ---
  return `I understand you're asking about "${text}". Here's your current business snapshot:\n\n📊 Revenue this month: **€27,600** (+12% QoQ)\n📧 Unread emails: **12** (3 urgent)\n📅 Meetings today: **2**\n✅ Tasks due today: **2 urgent**\n⚠️ Overdue invoices: **€11,700**\n\nAsk me anything specific and I'll give you a detailed answer!`
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
    // Capture current messages synchronously so getChatDemoReply gets reliable history
    const currentMessages = [...messages, userMsg]
    setMessages(currentMessages)
    setInput('')
    setLoading(true)

    try {
      const { data } = await api.post('/chat', {
        message: text.trim(),
        session_id: sessionId,
        page_context: getPageContext(),
        messages: currentMessages,
      })
      setSessionId(data.session_id)
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }])
    } catch {
      const reply = getChatDemoReply(text.trim(), currentMessages)
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }])
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
