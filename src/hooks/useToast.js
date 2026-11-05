import { useState, useEffect, useCallback } from 'react'
const TOAST_DURATION = 3000

export function useToast() {
  const [toast, setToast] = useState(null)

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), TOAST_DURATION)
      return () => clearTimeout(timer)
    }
  }, [toast])

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type })
  }, [])

  function closeToast() {
    setToast(null)
  }

  return { toast, showToast, closeToast }
}
