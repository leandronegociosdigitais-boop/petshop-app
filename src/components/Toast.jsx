import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

const TOAST_DURATION = 3000

export function useToast() {
  const [toast, setToast] = useState(null)

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), TOAST_DURATION)
      return () => clearTimeout(timer)
    }
  }, [toast])

  function showToast(message, type = 'success') {
    setToast({ message, type })
  }

  function closeToast() {
    setToast(null)
  }

  return { toast, showToast, closeToast }
}

export function Toast({ toast, onClose }) {
  if (!toast) return null

  return (
    <div
      className={`fixed top-4 right-4 z-50 max-w-[calc(100vw-2rem)] flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium shadow-lg transition-all ${
        toast.type === 'error'
          ? 'bg-red-600 text-white'
          : 'bg-emerald-600 text-white'
      }`}
    >
      <span>{toast.message}</span>
      <button onClick={onClose} className="ml-2 hover:opacity-80">
        <X size={16} />
      </button>
    </div>
  )
}
