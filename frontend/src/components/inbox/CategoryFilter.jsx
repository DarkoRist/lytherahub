import { classNames } from '../../utils/helpers'

const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'urgent', label: 'Urgent' },
  { key: 'client', label: 'Clients' },
  { key: 'invoice', label: 'Invoices' },
  { key: 'newsletter', label: 'Newsletters' },
  { key: 'other', label: 'Other' },
]

const DEMO_STATS = {
  all: 47,
  urgent: 5,
  client: 12,
  invoice: 8,
  newsletter: 15,
  other: 7,
}

function getBadgeClasses(key, isActive) {
  if (key === 'urgent') {
    return isActive
      ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
      : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
  }
  return isActive
    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
    : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
}

export default function CategoryFilter({ activeCategory = 'all', onChange, stats }) {
  const mergedStats = { ...DEMO_STATS, ...stats }

  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-hide">
      {CATEGORIES.map(({ key, label }) => {
        const isActive = activeCategory === key
        const count = mergedStats[key] ?? 0

        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={classNames(
              'relative flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
            )}
          >
            {label}
            {count > 0 && (
              <span
                className={classNames(
                  'inline-flex min-w-[1.25rem] items-center justify-center rounded-full px-1.5 py-0.5 text-xs font-semibold',
                  getBadgeClasses(key, isActive)
                )}
              >
                {count}
              </span>
            )}
            {isActive && (
              <span className="absolute bottom-0 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-indigo-600 dark:bg-indigo-400" />
            )}
          </button>
        )
      })}
    </div>
  )
}
