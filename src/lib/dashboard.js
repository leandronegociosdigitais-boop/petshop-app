import { extractDateKey, getLocalDateISO } from './dates.js'

const monthPattern = /^\d{4}-(0[1-9]|1[0-2])$/
const dayPattern = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/
const cents = value => Math.round((Number(value) || 0) * 100)
const sum = (rows, getValue) => rows.reduce((total, row) => total + getValue(row), 0) / 100
export const appointmentAmount = row => (cents(row.valor) + (row.forma_pagamento_2 ? cents(row.valor_2) : 0)) / 100
export const isUnpaid = row => row.status !== 'cancelado' && row.status_pagamento !== 'pago'
export const isRealized = row => !row.status_pagamento || row.status_pagamento === 'pago'

export function shiftMonth(month, offset) {
  const [year, number] = month.split('-').map(Number)
  return getLocalDateISO(new Date(year, number - 1 + offset, 1)).slice(0, 7)
}

export function shiftDay(day, offset) {
  const date = new Date(day + 'T12:00:00')
  date.setDate(date.getDate() + offset)
  return getLocalDateISO(date)
}

export function monthRange(month) {
  if (!monthPattern.test(month)) throw new Error('Mês inválido.')
  const [year, number] = month.split('-').map(Number)
  return { start: month + '-01', end: getLocalDateISO(new Date(year, number, 0)), next: shiftMonth(month, 1) + '-01' }
}

export function readDashboardLink(search, now = new Date()) {
  const params = new URLSearchParams(search)
  const inputDay = params.get('data') || ''
  const date = dayPattern.test(inputDay) && getLocalDateISO(new Date(inputDay + 'T12:00:00')) === inputDay ? inputDay : ''
  const inputMonth = params.get('mes') || ''
  const month = date ? date.slice(0, 7) : monthPattern.test(inputMonth) ? inputMonth : getLocalDateISO(now).slice(0, 7)
  return {
    month, date, query: (params.get('buscar') || '').slice(0, 200),
    status: ['agendado', 'em_andamento', 'concluido', 'cancelado'].includes(params.get('status')) ? params.get('status') : 'todos',
    payment: params.get('pagamento') === 'pendente' ? 'pendente' : '',
    service: (params.get('servico') || '').slice(0, 64),
    create: params.get('novo') || '',
  }
}

export function appointmentsLink({ month, date, status, payment, service, query, create } = {}) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries({ mes: month, data: date, status, pagamento: payment, servico: service, buscar: query, novo: create ? '1' : '' })) {
    if (value) params.set(key, value)
  }
  return '/atendimentos' + (params.size ? '?' + params : '')
}

export function financialLink(month, query = '') {
  const params = new URLSearchParams({ mes: month })
  if (query) params.set('buscar', query)
  return '/financeiro?' + params
}

export function buildMonthlyResults(finance, year, now = new Date()) {
  const today = getLocalDateISO(now)
  const months = Array.from({ length: 12 }, (_, index) => ({
    key: `${year}-${String(index + 1).padStart(2, '0')}`,
    label: new Date(2024, index, 1).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
    apurado: 0, despesas: 0,
  })).filter(row => row.key <= today.slice(0, 7))
  for (const row of finance) {
    if (!isRealized(row) || !['entrada', 'saida'].includes(row.tipo) || !dayPattern.test(row.data || '') || row.data > today || row.data.slice(0, 4) !== String(year)) continue
    const month = months[Number(row.data.slice(5, 7)) - 1]
    if (month) month[row.tipo === 'entrada' ? 'apurado' : 'despesas'] += cents(row.valor)
  }
  return months.map(row => ({ ...row, apurado: row.apurado / 100, despesas: row.despesas / 100, liquido: (row.apurado - row.despesas) / 100 }))
}

export function buildDashboard(data, month, day, now = new Date()) {
  const today = getLocalDateISO(now)
  const period = monthRange(month)
  const previousMonth = shiftMonth(month, -1)
  const previousRange = monthRange(previousMonth)
  const currentMonth = month === today.slice(0, 7)
  const elapsedDay = Number(today.slice(8))
  const previousEnd = currentMonth
    ? previousMonth + '-' + String(Math.min(elapsedDay, Number(previousRange.end.slice(8)))).padStart(2, '0')
    : previousRange.end
  const currentEnd = currentMonth ? today : period.end
  const inPeriod = value => value >= period.start && value <= period.end
  const throughNow = value => value >= period.start && value <= currentEnd
  const appointments = data.appointments || []
  const finance = data.finance || []
  const monthAppointments = appointments.filter(row => inPeriod(extractDateKey(row.data_hora)))
  const completed = monthAppointments.filter(row => row.status === 'concluido' && throughNow(extractDateKey(row.data_hora)))
  const previous = appointments.filter(row => row.status === 'concluido' && extractDateKey(row.data_hora) >= previousRange.start && extractDateKey(row.data_hora) <= previousEnd)
  const revenue = sum(completed, row => cents(appointmentAmount(row)))
  const previousRevenue = sum(previous, row => cents(appointmentAmount(row)))
  const realized = finance.filter(row => throughNow(row.data) && isRealized(row))
  const incoming = realized.filter(row => row.tipo === 'entrada')
  const outgoing = realized.filter(row => row.tipo === 'saida')
  const receipts = sum(incoming, row => cents(row.valor))
  const expenses = sum(outgoing, row => cents(row.valor))
  const receivablesMonth = monthAppointments.filter(row => isUnpaid(row) && appointmentAmount(row) > 0)
  const receivables = (data.pendingAppointments || []).filter(row => isUnpaid(row) && appointmentAmount(row) > 0)
  const bills = (data.pendingBills || []).filter(row => row.tipo === 'saida' && row.status_pagamento === 'pendente')
  const byDue = (a, b) => (a.data_vencimento || '9999').localeCompare(b.data_vencimento || '9999')
  const overdueReceivables = receivables.filter(row => row.data_vencimento && row.data_vencimento < today)
  const overdueBills = bills.filter(row => row.data_vencimento && row.data_vencimento < today)
  const agenda = appointments.filter(row => extractDateKey(row.data_hora) === day).sort((a, b) => a.data_hora.localeCompare(b.data_hora))
  const agendaCounts = { todos: agenda.length, agendado: 0, em_andamento: 0, concluido: 0, cancelado: 0 }
  for (const row of agenda) if (row.status in agendaCounts) agendaCounts[row.status] += 1
  const lateAppointments = (data.openAppointments || []).filter(row => ['agendado', 'em_andamento'].includes(row.status) && extractDateKey(row.data_hora) < today)
  const days = Array.from({ length: Number(period.end.slice(8)) }, (_, index) => ({ label: String(index + 1).padStart(2, '0'), key: month + '-' + String(index + 1).padStart(2, '0'), entradas: 0, saidas: 0 }))
  const annual = Array.from({ length: 12 }, (_, index) => ({ label: new Date(2024, index, 1).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''), entradas: 0, saidas: 0 }))
  for (const row of finance) {
    if (!isRealized(row) || !['entrada', 'saida'].includes(row.tipo) || (currentMonth && row.data > today)) continue
    const key = row.tipo === 'entrada' ? 'entradas' : 'saidas'
    if (row.data?.slice(0, 4) === month.slice(0, 4)) annual[Number(row.data.slice(5, 7)) - 1][key] += cents(row.valor)
    if (inPeriod(row.data)) days[Number(row.data.slice(8, 10)) - 1][key] += cents(row.valor)
  }
  for (const row of [...days, ...annual]) { row.entradas /= 100; row.saidas /= 100 }
  if (currentMonth) {
    for (const row of days) if (row.key > today) { row.entradas = null; row.saidas = null }
  }
  const serviceMap = new Map()
  for (const row of completed) {
    const id = row.servico_id || row.servico?.nome || 'outros'
    const service = serviceMap.get(id) || { id, name: row.servico?.nome || 'Serviço', count: 0, revenue: 0 }
    service.count += 1
    service.revenue += cents(appointmentAmount(row))
    serviceMap.set(id, service)
  }
  const services = [...serviceMap.values()].map(row => ({ ...row, revenue: row.revenue / 100 })).sort((a, b) => b.count - a.count || b.revenue - a.revenue)
  const paymentMap = new Map()
  for (const row of incoming) paymentMap.set(row.forma_pagamento || 'outros', (paymentMap.get(row.forma_pagamento || 'outros') || 0) + cents(row.valor))
  const payments = [...paymentMap].map(([key, value]) => ({ key, value: value / 100 })).filter(row => row.value > 0).sort((a, b) => b.value - a.value)
  return {
    today, period, currentMonth, previousEnd, previousRevenue, comparison: previousRevenue > 0 ? (revenue - previousRevenue) / previousRevenue * 100 : null,
    revenue, receipts, expenses, balance: (cents(receipts) - cents(expenses)) / 100, completed: completed.length,
    ticket: completed.length ? revenue / completed.length : 0,
    receiveMonth: sum(receivablesMonth, row => cents(appointmentAmount(row))), receiveMonthCount: receivablesMonth.length,
    receiveTotal: sum(receivables, row => cents(appointmentAmount(row))), payTotal: sum(bills, row => cents(row.valor)),
    receivables: [...receivables].sort(byDue), bills: [...bills].sort(byDue), overdueReceivables, overdueBills, lateAppointments,
    agenda, agendaCounts, days, annual, services, payments,
    monthlyResults: buildMonthlyResults(finance, Number(month.slice(0, 4)), now),
  }
}
