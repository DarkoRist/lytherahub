import { useEffect, useRef } from 'react'

/**
 * Right-click context menu.
 *
 * Props:
 *   x, y       — screen coordinates
 *   items      — array of { label, icon?, action, danger? } or the string 'divider'
 *   onClose    — called when menu should close
 */
export default function ContextMenu({ x, y, items, onClose }) {
  const menuRef = useRef(null)

  useEffect(() => {
    const handleClick = () => onClose()
    const handleContext = (e) => {
      // Close on any subsequent right-click
      if (!menuRef.current?.contains(e.target)) {
        e.preventDefault()
        onClose()
      }
    }
    // Use capture so we catch clicks before they bubble
    document.addEventListener('click', handleClick, true)
    document.addEventListener('contextmenu', handleContext, true)
    return () => {
      document.removeEventListener('click', handleClick, true)
      document.removeEventListener('contextmenu', handleContext, true)
    }
  }, [onClose])

  // Clamp to viewport
  const menuWidth = 192
  const itemCount = items.filter((i) => i !== 'divider').length
  const divCount = items.filter((i) => i === 'divider').length
  const menuHeight = itemCount * 36 + divCount * 9 + 8
  const clampedX = Math.min(x, window.innerWidth - menuWidth - 8)
  const clampedY = Math.min(y, window.innerHeight - menuHeight - 8)

  return (
    <div
      ref={menuRef}
      className="fixed z-[150] w-48 rounded-lg border border-slate-200 bg-white py-1 shadow-xl dark:border-slate-700 dark:bg-slate-800"
      style={{ top: clampedY, left: clampedX }}
      onClick={(e) => e.stopPropagation()}
    >
      {items.map((item, i) => {
        if (item === 'divider') {
          return <div key={i} className="my-1 border-t border-slate-100 dark:border-slate-700" />
        }
        const Icon = item.icon
        return (
          <button
            key={i}
            onClick={() => {
              item.action()
              onClose()
            }}
            className={`flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/50 ${
              item.danger
                ? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20'
                : 'text-slate-700 dark:text-slate-300'
            }`}
          >
            {Icon && <Icon className="h-4 w-4 shrink-0" />}
            {item.label}
          </button>
        )
      })}
    </div>
  )
}
