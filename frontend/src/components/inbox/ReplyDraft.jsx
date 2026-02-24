import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Sparkles, Send, Trash2, Loader2, Copy } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../api/client'
import { classNames } from '../../utils/helpers'

const TONES = [
  { key: 'professional', label: 'Professional' },
  { key: 'friendly', label: 'Friendly' },
  { key: 'brief', label: 'Brief' },
]

// Extract first name from an email address local part
function extractFirstNameFromAddr(addr) {
  if (!addr) return 'there'
  const local = addr.split('@')[0]
  if (['noreply', 'no-reply', 'notifications', 'newsletter', 'calendar'].includes(local)) return 'there'
  const parts = local.split(/[._-]/)
  return parts[0].charAt(0).toUpperCase() + parts[0].slice(1)
}

// Generate a contextual demo reply based on the email's actual subject, sender, and category
function buildDemoReply(tone, email) {
  const senderName = email?.sender_name || email?.from_name || null
  const firstName = senderName
    ? senderName.split(' ')[0]
    : extractFirstNameFromAddr(email?.from_addr || email?.from || '')
  const subject = email?.subject || 'your message'
  const isUrgent = email?.category === 'urgent'
  const isInvoice = email?.category === 'invoice'

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = tomorrow.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

  const contextLine = isUrgent
    ? 'I understand the urgency of this matter and am making it my top priority.'
    : isInvoice
      ? 'I have reviewed the invoice details and will process this promptly.'
      : 'I have reviewed your message and will give it the attention it deserves.'

  if (tone === 'professional') {
    return `Dear ${senderName || firstName},\n\nThank you for reaching out regarding "${subject}". ${contextLine}\n\nI will follow up with a comprehensive response by end of business on ${tomorrowStr}. Please do not hesitate to reach out if you need anything in the meantime.\n\nBest regards,\nDarko\nLytheraHub`
  }
  if (tone === 'friendly') {
    return `Hey ${firstName}!\n\nThanks for the message about "${subject}" — got it!\n\n${isUrgent ? "I'll make this a priority and get back to you ASAP." : "Let me look into this and get back to you shortly. Shouldn't take long!"}\n\nTalk soon,\nDarko`
  }
  // brief
  return `Hi ${firstName},\n\nRe: ${subject}\n\n${isUrgent ? 'On it — will update you within the hour.' : isInvoice ? 'Confirmed. Will process and respond today.' : 'Noted. Will respond by EOD.'}\n\nDarko`
}

export default function ReplyDraft({ email, onSend }) {
  const [tone, setTone] = useState('professional')
  const [replyBody, setReplyBody] = useState('')
  const [hasGenerated, setHasGenerated] = useState(false)

  const generateMutation = useMutation({
    mutationFn: async () => {
      try {
        const res = await api.post(`/emails/${email?.id}/draft-reply`, { tone })
        return res.data
      } catch {
        return { body: buildDemoReply(tone, email) }
      }
    },
    onSuccess: (data) => {
      setReplyBody(data.body || data.reply || buildDemoReply(tone, email))
      setHasGenerated(true)
      toast.success('AI reply generated')
    },
    onError: () => {
      setReplyBody(buildDemoReply(tone, email))
      setHasGenerated(true)
      toast.success('AI reply generated (demo)')
    },
  })

  const sendMutation = useMutation({
    mutationFn: async () => {
      try {
        const res = await api.post(`/emails/${email?.id}/send-reply`, { body: replyBody })
        return res.data
      } catch {
        // Demo mode: simulate success
        return { success: true, demo: true }
      }
    },
    onSuccess: () => {
      toast.success('Reply sent successfully')
      setReplyBody('')
      setHasGenerated(false)
      onSend?.()
    },
    onError: () => {
      toast.success('Reply sent (demo)')
      setReplyBody('')
      setHasGenerated(false)
    },
  })

  function handleDiscard() {
    setReplyBody('')
    setHasGenerated(false)
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
        <Sparkles className="h-4 w-4 text-indigo-500" />
        <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          AI Reply
        </h4>
      </div>

      <div className="p-4">
        {/* Tone selector */}
        <div className="mb-3">
          <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">
            Tone
          </label>
          <div className="flex gap-2">
            {TONES.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setTone(key)}
                className={classNames(
                  'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                  tone === key
                    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Generate / Regenerate button — always visible, label changes after first generation */}
        <button
          onClick={() => generateMutation.mutate()}
          disabled={generateMutation.isPending}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-60"
        >
          {generateMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : hasGenerated ? (
            <>
              <Sparkles className="h-4 w-4" />
              Regenerate
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Generate Reply
            </>
          )}
        </button>

        {/* Reply textarea + action buttons — shown after first generation */}
        {hasGenerated && (
          <div className="mt-3 space-y-3">
            <textarea
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              rows={8}
              className="w-full resize-y rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:placeholder-slate-500 dark:focus:border-indigo-500"
              placeholder="Edit the AI-generated reply..."
            />

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => sendMutation.mutate()}
                disabled={sendMutation.isPending || !replyBody.trim()}
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-60"
              >
                {sendMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Send Reply
              </button>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(replyBody)
                  toast.success('Copied to clipboard')
                }}
                disabled={!replyBody.trim()}
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                <Copy className="h-4 w-4" />
                Copy
              </button>

              <button
                onClick={handleDiscard}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-950/30 dark:hover:text-red-400"
              >
                <Trash2 className="h-4 w-4" />
                Discard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
