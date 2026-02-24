import { Mail } from 'lucide-react'
import EmailCard from './EmailCard'

function SkeletonCard() {
  return (
    <div className="flex gap-3 border-l-3 border-l-transparent p-3">
      <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex items-center justify-between">
          <div className="h-4 w-28 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-3 w-10 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
        </div>
        <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
        <div className="h-3 w-full animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
        <div className="flex items-center gap-2">
          <div className="h-4 w-14 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700" />
          <div className="flex-1" />
          <div className="h-3.5 w-3.5 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
        </div>
      </div>
    </div>
  )
}

export default function EmailList({ emails = [], selectedId, onSelect, loading, taskBadges, followUpFlags }) {
  if (loading) {
    return (
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    )
  }

  if (!emails.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
          <Mail className="h-8 w-8 text-slate-400 dark:text-slate-500" />
        </div>
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          No emails found
        </h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Emails matching this filter will appear here.
        </p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-slate-100 dark:divide-slate-800">
      {emails.map((email) => (
        <EmailCard
          key={email.id}
          email={email}
          selected={email.id === selectedId}
          onSelect={onSelect}
          hasTask={taskBadges?.has(email.id)}
          followUpDate={followUpFlags?.[email.id] || null}
        />
      ))}
    </div>
  )
}
