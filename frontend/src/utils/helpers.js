export function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export function getInitials(name) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function truncate(str, length = 100) {
  if (!str || str.length <= length) return str
  return str.slice(0, length) + '...'
}
