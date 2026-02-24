import { useRef } from 'react'
import toast from 'react-hot-toast'

/**
 * Wraps any destructive action with a 5-second undo window.
 *
 * Usage:
 *   const { execute } = useUndoable()
 *   execute({
 *     doAction: () => setItems(prev => prev.filter(i => i.id !== id)),
 *     undoAction: () => setItems(prev => [deletedItem, ...prev]),
 *     apiCall: () => api.delete(`/items/${id}`),
 *     message: 'Item deleted',
 *   })
 */
export function useUndoable() {
  const timerRef = useRef(null)

  const execute = ({ doAction, undoAction, apiCall, message = 'Done' }) => {
    doAction()

    let undone = false

    if (timerRef.current) clearTimeout(timerRef.current)

    const toastId = toast(
      (t) => (
        <div className="flex items-center gap-3">
          <span className="text-sm">{message}</span>
          <button
            onClick={() => {
              undone = true
              clearTimeout(timerRef.current)
              undoAction()
              toast.dismiss(t.id)
              toast.success('Action undone')
            }}
            className="rounded px-2 py-0.5 text-sm font-semibold text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30"
          >
            Undo
          </button>
        </div>
      ),
      { duration: 5000 }
    )

    timerRef.current = setTimeout(() => {
      if (!undone) {
        apiCall?.()
      }
    }, 5100)

    return toastId
  }

  return { execute }
}
