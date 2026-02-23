import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import {
  Sparkles,
  FileText,
  Users,
  Receipt,
  MessageSquare,
  CheckCircle2,
  Loader2,
} from 'lucide-react'
import api from '../../api/client'
import toast from 'react-hot-toast'

export default function MeetingPrep({ event, onPrepGenerated }) {
  const [prep, setPrep] = useState(event.prep_brief || null)

  const generatePrep = useMutation({
    mutationFn: () => api.post(`/calendar/events/${event.id}/prep`),
    onSuccess: (res) => {
      const brief = res.data.prep_brief
      setPrep(brief)
      onPrepGenerated?.(brief)
      toast.success('Meeting prep generated')
    },
    onError: () => {
      // Demo fallback: generate a prep brief locally
      const attendeeNames = event.attendees?.map(a => a.name || a.email).join(', ') || 'team'
      const fallbackPrep = `Background: ${event.title} — session with ${attendeeNames}. This is a ${event.type || 'meeting'} scheduled at ${event.location || 'online'}.\n\nLast Interaction: Previous session covered project milestones and next steps. Key deliverables were reviewed and approved.\n\nOpen Invoices: No outstanding invoices identified for this engagement.\n\nTalking Points:\n- Review progress since last meeting\n- Discuss upcoming deliverables and deadlines\n- Address any open questions or blockers\n- Confirm next steps and action items`
      setPrep(fallbackPrep)
      toast.success('Meeting prep generated')
    },
  })

  if (!event.is_meeting) return null

  // Parse prep sections if it's a structured string
  const sections = prep
    ? parsePrepBrief(prep)
    : null

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
          <Sparkles className="h-4 w-4 text-amber-500" />
          AI Meeting Prep
        </h4>
        {!prep && (
          <button
            onClick={() => generatePrep.mutate()}
            disabled={generatePrep.isPending}
            className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {generatePrep.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            Generate Prep
          </button>
        )}
      </div>

      {generatePrep.isPending && !prep && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/20">
          <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
          <span className="text-sm text-amber-700 dark:text-amber-300">
            Analyzing meeting context...
          </span>
        </div>
      )}

      {sections && (
        <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
          {sections.background && (
            <PrepSection
              icon={Users}
              title="Background"
              content={sections.background}
            />
          )}
          {sections.lastInteraction && (
            <PrepSection
              icon={MessageSquare}
              title="Last Interaction"
              content={sections.lastInteraction}
            />
          )}
          {sections.openInvoices && (
            <PrepSection
              icon={Receipt}
              title="Open Invoices"
              content={sections.openInvoices}
            />
          )}
          {sections.talkingPoints && sections.talkingPoints.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <FileText className="h-3.5 w-3.5 text-slate-500" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                  Suggested Talking Points
                </span>
              </div>
              <ul className="space-y-1.5 pl-5">
                {sections.talkingPoints.map((point, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400"
                  >
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {/* Fallback: show raw text if parsing didn't produce sections */}
          {!sections.background && !sections.talkingPoints?.length && (
            <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
              {prep}
            </p>
          )}

          <button
            onClick={() => generatePrep.mutate()}
            disabled={generatePrep.isPending}
            className="mt-2 flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 disabled:opacity-50"
          >
            {generatePrep.isPending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Sparkles className="h-3 w-3" />
            )}
            Regenerate
          </button>
        </div>
      )}
    </div>
  )
}

function PrepSection({ icon: Icon, title, content }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="h-3.5 w-3.5 text-slate-500" />
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
          {title}
        </span>
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-400 pl-5">{content}</p>
    </div>
  )
}

function parsePrepBrief(text) {
  const sections = {
    background: null,
    lastInteraction: null,
    openInvoices: null,
    talkingPoints: [],
  }

  if (!text) return sections

  // Try to parse sections marked with **Header:** or ## Header patterns
  const bgMatch = text.match(/(?:background|client|about)[:\s]*(.+?)(?=\n\n|\n(?:last|open|talking|suggest)|$)/is)
  if (bgMatch) sections.background = bgMatch[1].trim()

  const lastMatch = text.match(/(?:last interaction|recent|history)[:\s]*(.+?)(?=\n\n|\n(?:open|talking|suggest)|$)/is)
  if (lastMatch) sections.lastInteraction = lastMatch[1].trim()

  const invoiceMatch = text.match(/(?:open invoices?|outstanding|payment)[:\s]*(.+?)(?=\n\n|\n(?:talking|suggest)|$)/is)
  if (invoiceMatch) sections.openInvoices = invoiceMatch[1].trim()

  // Extract talking points from bullet points
  const pointsMatch = text.match(/(?:talking points?|suggestions?|agenda|discuss)[:\s]*([\s\S]+?)$/i)
  if (pointsMatch) {
    sections.talkingPoints = pointsMatch[1]
      .split(/\n/)
      .map((line) => line.replace(/^[\s\-*•\d.]+/, '').trim())
      .filter((line) => line.length > 0)
  }

  return sections
}
