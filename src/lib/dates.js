/**
 * Date utilities - timezone-safe for BRT (UTC-3)
 * Always append 'T00:00:00' to date-only strings to force local interpretation.
 * Never use .toISOString().slice(0,10) for local date extraction.
 */

export function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr.includes('T') ? dateStr : dateStr + 'T00:00:00')
  if (isNaN(d.getTime())) return '—'
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return '—'
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${day}/${month}/${year} ${hours}:${minutes}`
}

export function formatTime(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return '—'
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

export function getLocalDateISO(date) {
  const d = date || new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function getDayOfWeek(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr.includes('T') ? dateStr : dateStr + 'T00:00:00')
  if (isNaN(d.getTime())) return ''
  return d.getDay()
}

export function toLocalDatetimeValue(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return ''
  const offset = d.getTimezoneOffset()
  const local = new Date(d.getTime() - offset * 60000)
  return local.toISOString().slice(0, 16)
}

export function toLocalDateValue(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr.includes('T') ? dateStr : dateStr + 'T00:00:00')
  if (isNaN(d.getTime())) return ''
  return getLocalDateISO(d)
}

export function isToday(dateStr) {
  if (!dateStr) return false
  const d = new Date(dateStr)
  const today = new Date()
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  )
}

export function extractDateKey(dateStr) {
  if (!dateStr) return ''
  if (dateStr.includes('T')) {
    const d = new Date(dateStr)
    return getLocalDateISO(d)
  }
  return dateStr.slice(0, 10)
}

export function formatCurrency(value) {
  if (value == null) return 'R$ 0,00'
  const num = parseFloat(value)
  if (isNaN(num)) return 'R$ 0,00'
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function formatDateOnly(dateStr) {
  return formatDate(dateStr)
}
