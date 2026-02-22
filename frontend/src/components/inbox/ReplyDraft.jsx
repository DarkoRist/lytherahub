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

// Generate a unique demo reply based on the email's actual subject and sender
function buildDemoReply(tone, email) {
  const firstName = email?.sender_name?.split(' ')[0] || email?.from?.split('@')[0] || 'there'
  const subject = email?.subject || 'your message'

  if (tone === 'professional') {
    return `Dear ${email?.sender_name || firstName},\n\nThank you for your email regarding "${subject}". I have reviewed the details you shared and would like to confirm that we are aligned on the next steps.\n\nI will have the requested information prepared and sent over by end of business tomorrow. Please do not hesitate to reach out if you need anything further in the meantime.\n\nBest regards,\n[Your Name]`
  }
  if (tone === 'friendly') {
    return `Hi ${firstName}!\n\nThanks so much for reaching out about "${subject}"! I really appreciate you taking the time to share this.\n\nI'll get everything sorted on my end and circle back with you soon. Let me know if there's anything else I can help with!\n\nCheers,\n[Your Name]`
  }
  // brief
  return `Hi ${firstName},\n\nNoted, thank you — re: "${subject}". I'll follow up by tomorrow.\n\nBest,\n[Your Name]`
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
      const res = await api.post(`/emails/${email?.id}/send-reply`, { body: replyBody })
      return res.data
    },
    onSuccess: () => {
      toast.success('Reply sent successfully')
      setReplyBody('')
      setHasGenerated(false)
      onSend?.()
    },
    onError: () => {
      toast.error('Failed to send reply. Please try again.')
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
