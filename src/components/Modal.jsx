import { useEffect, useEffectEvent, useRef } from 'react'
import { X } from 'lucide-react'

export default function Modal({ open, onClose, title, icon: Icon, children }) {
  const dialog = useRef(null)
  const closeFromKeyboard = useEffectEvent(() => onClose())
  useEffect(() => {
    if (!open || !window.matchMedia('(max-width: 639px)').matches) return
    const previous = document.body.style.overflow
    const previousFocus = document.activeElement
    document.body.style.overflow = 'hidden'
    dialog.current?.focus()
    function handleKey(event) {
      if (event.key === 'Escape') closeFromKeyboard()
      if (event.key !== 'Tab') return
      const items = [...dialog.current.querySelectorAll('button, input, select, textarea, a[href]')].filter(node => !node.disabled && node.getClientRects().length)
      const first = items[0], last = items.at(-1)
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog.current)) { event.preventDefault(); last?.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
    }
    document.addEventListener('keydown', handleKey)
    return () => {
      document.body.style.overflow = previous
      document.removeEventListener('keydown', handleKey)
      previousFocus?.focus()
    }
  }, [open])
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm modal-backdrop"
      onClick={onClose}
    >
      <div
        ref={dialog} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title}
        className="app-form-dialog relative w-full max-w-lg mx-4 max-h-[90vh] flex flex-col rounded-xl border border-gray-200 bg-white shadow-xl modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-2">
            {Icon && <Icon size={20} className="text-indigo-600" />}
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          </div>
          <button
            onClick={onClose} aria-label="Fechar formulário"
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {children}
        </div>
      </div>
    </div>
  )
}
