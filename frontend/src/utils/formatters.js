export function formatCurrency(amount, currency = 'EUR') {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency }).format(amount)
}

export function formatDate(date) {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  }).format(new Date(date))
}

export function formatRelativeTime(date) {
  try {
    const d = new Date(date)
    if (isNaN(d.getTime())) {
      // Fallback: show date as "Feb 14" if raw string is parseable, else return as-is
      const fallback = date ? new Date(String(date)) : null
      if (fallback && !isNaN(fallback.getTime())) {
        return fallback.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })
      }
      return date ? String(date) : '—'
    }
    const now = new Date()
    const diff = now - d
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return 'just now'
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  } catch {
    return date ? String(date) : '—'
  }
}
