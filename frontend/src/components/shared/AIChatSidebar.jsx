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

  // --- Affirmative follow-ups: "yes", "sure", "ok", "do it", "go ahead" ---
  // messages includes the current user message; getLastAIMessage skips it to find prior AI reply
  const affirmatives = ['yes', 'sure', 'ok', 'okay', 'do it', 'go ahead', 'yep', 'yeah', 'please', 'sounds good', 'let\'s do it']
  if (affirmatives.some(a => t === a || t === a + '!' || t === a + '.')) {
    const lastAI = getLastAIMessage(messages)
    // Check context even without "?" — match on keywords from the last AI response
    const ctx = lastAI.toLowerCase()
    if (ctx.includes('draft repl') || ctx.includes('draft replies') || ctx.includes('urgent ones')) {
      return "I'll draft replies for all 3 urgent emails. Here's what I've prepared:\n\n" +
        "**1. Frank Hartmann (SmartHome)** — Acknowledged the IoT dashboard issue and proposed a fix timeline for next Tuesday.\n\n" +
        "**2. Hans Weber (TechVision)** — Confirmed the Q1 contract review meeting for Thursday at 2 PM.\n\n" +
        "**3. Dr. Vogel (BioPharm)** — Thanked them for the data visualization project inquiry and requested a brief call.\n\n" +
        "Want me to send these, or would you like to edit any of them first?"
    }
    if (ctx.includes('reminder') || ctx.includes('send reminder') || ctx.includes('overdue account')) {
      return "Done! I've sent a polite payment reminder to CloudFirst AG for invoice #INV-1002 (EUR 8,500). This is their second reminder — the tone has been slightly firmed up. I'll escalate again in 7 days if unpaid."
    }
    if (ctx.includes('send') && ctx.includes('these')) {
      return "All 3 emails sent successfully!\n\n- **Frank Hartmann** — Sent at 10:32 AM\n- **Hans Weber** — Sent at 10:32 AM\n- **Dr. Vogel** — Sent at 10:32 AM\n\nI've logged these in your activity feed. Anything else?"
    }
    if (ctx.includes('schedule') || ctx.includes('free slot')) {
      return "Meeting scheduled! I've booked **1:00 PM - 2:00 PM** today.\n\nI'll send a calendar invite and add a prep brief 30 minutes before. What's the meeting about?"
    }
    if (ctx.includes('follow-up') || ctx.includes('follow up') || ctx.includes('stale lead')) {
      return "Done! I've created follow-up tasks for all 3 stale leads:\n\n1. **GreenEnergy Startup** — Follow up tomorrow at 9 AM\n2. **FoodTech Berlin** — Follow up tomorrow at 10 AM\n3. **BioPharm Research** — Follow up Wednesday at 9 AM\n\nI'll draft personalized emails for each. Want to review them?"
    }
    if (ctx.includes('invoice') || ctx.includes('outstanding') || ctx.includes('overdue')) {
      return "Done! I've flagged CloudFirst AG and MediaWave GmbH as overdue and queued reminders. I'll notify you when they respond."
    }
    if (ctx.length > 0) {
      return "Got it! I'm on it. Anything else you'd like me to do?"
    }
    return "Sure! What would you like me to help with?"
  }

  // --- "reply to [name]" pattern ---
  const replyMatch = t.match(/(?:reply to|respond to|write to|email)\s+(.+)/i)
  if (replyMatch) {
    const name = replyMatch[1].replace(/[?.!]/g, '').trim()
    const capName = name.charAt(0).toUpperCase() + name.slice(1)
    return `I'll draft a reply to ${capName}. Based on recent emails, here's a professional response about the latest discussion:\n\nDear ${capName},\n\nThank you for your message regarding the project update. I'd like to confirm that we're on track with the deliverables and will have the revised proposal ready by end of week.\n\nPlease let me know if you need anything else in the meantime.\n\nBest regards\n\nWant me to adjust the tone or send this?`
  }

  // --- Draft / write / compose ---
  if (t.includes('draft') || t.includes('write') || t.includes('compose')) {
    return "I can help draft that. Here's a professional template based on your recent communications:\n\n**Subject:** Follow-up on our recent discussion\n\nDear [Recipient],\n\nThank you for taking the time to discuss [topic] with us. I wanted to follow up on the key points we covered:\n\n1. [Action item 1]\n2. [Action item 2]\n\nPlease let me know if you have any questions or if you'd like to schedule a follow-up call.\n\nBest regards\n\nTell me who this is for and I'll personalize it with context from your CRM."
  }

  // --- Schedule / book / meeting (with free slots) ---
  if (t.includes('schedule') || t.includes('book')) {
    return "I can schedule that. When works best? I see these free slots today: **11-12**, **1-2:30**, **4-5**.\n\nOr tell me a specific day and time and I'll check availability."
  }

  // --- Remind / follow up ---
  if (t.includes('remind') || t.includes('follow up') || t.includes('follow-up')) {
    return "I'll create a reminder task. Who should I follow up with?\n\nHere are contacts you haven't reached out to recently:\n- **GreenEnergy Startup** — 20 days since last contact\n- **FoodTech Berlin** — 23 days since last contact\n- **BioPharm Research** — 8 days since last contact\n\nWant me to set reminders for all of them?"
  }

  // --- Todo / tasks / to do ---
  if (t.includes('todo') || t.includes('task') || t.includes('to do') || t.includes('to-do')) {
    return "Here are your **pending tasks:**\n\n1. 🔴 **Reply to Frank Hartmann** — urgent IoT dashboard email *(due today)*\n2. 🔴 **Send TechVision Q1 contract** for review *(due today)*\n3. 🟠 **Prepare BioPharm partnership proposal** *(due tomorrow)*\n4. 🟠 **Follow up on CloudFirst AG** overdue invoice *(overdue 3 days)*\n5. 🔵 **Review SmartHome project milestones** *(due Wed)*\n6. 🔵 **Update CRM notes for SecureNet call** *(due Thu)*\n\n**3 overdue tasks:**\n- Send DataStream Analytics onboarding email\n- Complete GreenEnergy pricing proposal\n- Update weekly team report\n\nWant me to prioritize or reassign any of these?"
  }

  // --- Revenue / money / earned / income ---
  if (t.includes('revenue') || t.includes('money') || t.includes('earned') || t.includes('income')) {
    return "Here's your revenue breakdown:\n\n**This month (February):** EUR 27,600 collected from 8 paid invoices\n**Outstanding:** EUR 34,000 across 6 invoices\n**Overdue:** EUR 8,500 (2 invoices — CloudFirst AG and MediaWave GmbH)\n**Trend:** Up 18.3% vs January (EUR 23,300)\n\n| Client | Amount |\n|--------|--------|\n| TechVision GmbH | EUR 8,500 |\n| FinTech Solutions | EUR 22,000 |\n| DesignStudio Co. | EUR 6,800 |\n\nYour top client this month is TechVision GmbH at EUR 8,500. Want me to break this down further?"
  }

  // --- Client / clients / pipeline ---
  if (t.includes('client') || t.includes('pipeline')) {
    return "You have **15 active clients** across your pipeline:\n\n• **Lead:** 4 (MediaWave, QuickShop, EduLearn, FoodTech)\n• **Contacted:** 3 (StartupHub, DataSync, SecureNet)\n• **Proposal:** 2 (NovaTech, GreenEnergy)\n• **Negotiation:** 2 (CloudFirst, BioPharm)\n• **Won:** 3 (TechVision, DesignStudio, FinTech)\n• **Lost:** 1 (LogiTrans)\n\n⚠️ 3 leads haven't been contacted in 10+ days. Want me to draft follow-up emails?"
  }

  // --- Invoice / invoices / overdue / payment ---
  if (t.includes('invoice') || t.includes('overdue') || t.includes('payment')) {
    return "Invoice summary:\n\n**Total outstanding:** EUR 34,000 across 6 invoices\n**Overdue:** 2 invoices totaling EUR 8,500\n  → CloudFirst AG: EUR 5,200 (14 days late)\n  → MediaWave GmbH: EUR 3,300 (7 days late)\n**Paid this month:** EUR 27,600\n**Expected this week:** EUR 12,300 (3 invoices due)\n\nShould I send reminders to the overdue accounts?"
  }

  // --- Email / inbox / unread ---
  if (t.includes('email') || t.includes('inbox') || t.includes('unread') || t.includes('mail')) {
    return "Your inbox right now:\n\n**12 unread emails:**\n• 🔴 3 urgent (Frank Hartmann, Hans Weber, Dr. Vogel)\n• 👤 2 client-related (TechVision contract, SecureNet proposal)\n• 💰 2 invoice-related (payment confirmations)\n• 📰 2 newsletters\n• 3 need replies (oldest: 2 days from Hans at TechVision)\n\nWould you like me to draft replies to the urgent ones?"
  }

  // --- Schedule / calendar / meeting / today ---
  if (t.includes('calendar') || t.includes('meeting') || t.includes('today')) {
    return "Today's schedule:\n\n**10:00 AM** — Team Standup (15 min)\n**3:00 PM** — Client Call with Hans Weber, TechVision GmbH\n  📋 Prep brief ready: Q1 contract review, open invoice EUR 3,200\n\n**Tomorrow:**\n**9:30 AM** — BioPharm Research Partnership Call\n**2:00 PM** — SecureNet Kickoff Meeting\n\nYou have 3 free slots today: 11-12, 1-2:30, and 4-5. Want me to schedule something?"
  }

  // --- Default / fallback ---
  return "I'm your AI business assistant. I have access to all your business data. Here's what I can help with:\n\n📧 **Emails** — \"How many urgent emails do I have?\"\n📅 **Calendar** — \"What's my schedule tomorrow?\"\n💰 **Invoices** — \"Which invoices are overdue?\"\n👥 **Clients** — \"Show me my pipeline\"\n📊 **Revenue** — \"How much revenue this month?\"\n✅ **Tasks** — \"What's due today?\"\n✍️ **Draft** — \"Reply to Hans\" or \"Compose an email\"\n⏰ **Reminders** — \"Follow up with CloudFirst\"\n\nJust ask in plain English!"
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
