/**
 * Consistent empty state component (Linear quality bar).
 *
 * Props:
 *   icon        — Lucide icon component
 *   title       — short heading
 *   description — supporting text
 *   action      — CTA button label (optional)
 *   onAction    — CTA click handler (optional)
 */
export default function EmptyState({ icon: Icon, title, description, action, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-14 text-center dark:border-slate-700 dark:bg-slate-800">
      {Icon && (
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700">
          <Icon className="h-7 w-7 text-slate-400 dark:text-slate-500" />
        </div>
      )}
      <h3 className="mt-4 text-base font-semibold text-slate-800 dark:text-white">{title}</h3>
      {description && (
        <p className="mt-1 max-w-xs text-sm text-slate-500 dark:text-slate-400">{description}</p>
      )}
      {action && onAction && (
        <button
          onClick={onAction}
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          {action}
        </button>
      )}
    </div>
  )
}
