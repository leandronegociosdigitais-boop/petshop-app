import test from 'node:test'
import assert from 'node:assert/strict'
import { buildDashboard, appointmentsLink, financialLink, readDashboardLink, shiftMonth, shiftDay } from '../src/lib/dashboard.js'

const now = new Date('2026-11-06T12:00:00')
const appointment = (id, overrides = {}) => ({ id, data_hora: '2026-11-05T12:00:00', status: 'concluido', status_pagamento: 'pago', valor: 100, ...overrides })
const financeRow = (id, overrides = {}) => ({ id, data: '2026-11-05', tipo: 'entrada', status_pagamento: 'pago', valor: 100, forma_pagamento: 'pix', ...overrides })

test('keeps service revenue, unpaid work and realized cash as separate metrics', () => {
  const appointments = [appointment('paid', { valor: 70, valor_2: 30, forma_pagamento_2: 'dinheiro' }), appointment('unpaid', { valor: 50, status_pagamento: 'pendente' }), appointment('working', { valor: 80, status: 'em_andamento', status_pagamento: 'pendente' }), appointment('cancelled', { valor: 999, status: 'cancelado', status_pagamento: 'pendente' })]
  const finance = [financeRow('receipt'), financeRow('paid-expense', { tipo: 'saida', valor: 25 }), financeRow('pending-expense', { tipo: 'saida', valor: 300, status_pagamento: 'pendente' }), financeRow('legacy-receipt', { valor: 20, status_pagamento: null })]
  const model = buildDashboard({ appointments, finance, pendingAppointments: appointments }, '2026-11', '2026-11-05', now)
  assert.equal(model.revenue, 150)
  assert.equal(model.completed, 2)
  assert.equal(model.ticket, 75)
  assert.equal(model.receipts, 120)
  assert.equal(model.expenses, 25)
  assert.equal(model.balance, 95)
  assert.equal(model.receiveMonth, 130)
  assert.equal(model.receiveMonthCount, 2)
  assert.equal(model.days[4].entradas, 120)
  assert.equal(model.days[4].saidas, 25)
  assert.equal(model.days[6].entradas, null)
})

test('compares current month with the same elapsed days instead of a whole prior month', () => {
  const appointments = [appointment('current'), appointment('prior', { data_hora: '2026-10-05T12:00:00', valor: 80 }), appointment('later-prior', { data_hora: '2026-10-20T12:00:00', valor: 1000 }), appointment('future', { data_hora: '2026-11-20T12:00:00', valor: 1000 })]
  const model = buildDashboard({ appointments }, '2026-11', '2026-11-06', now)
  assert.equal(model.revenue, 100)
  assert.equal(model.previousRevenue, 80)
  assert.equal(model.comparison, 25)
  assert.equal(buildDashboard({ appointments: [] }, '2026-11', '2026-11-06', now).comparison, null)
})

test('handles year changes, February and complete historical month comparison', () => {
  assert.equal(shiftMonth('2026-01', -1), '2025-12')
  assert.equal(shiftDay('2026-03-01', -1), '2026-02-28')
  const appointments = [appointment('january', { data_hora: '2026-01-20T12:00:00' }), appointment('december', { data_hora: '2025-12-31T12:00:00', valor: 50 })]
  const model = buildDashboard({ appointments }, '2026-01', '2026-01-20', now)
  assert.equal(model.previousRevenue, 50)
  assert.equal(model.comparison, 100)
  const leap = buildDashboard({}, '2024-02', '2024-02-29', now)
  assert.equal(leap.days.length, 29)
})

test('finds overdue items across years without treating missing due dates as overdue', () => {
  const pendingAppointments = [appointment('old', { data_hora: '2025-12-15T12:00:00', status_pagamento: 'pendente', data_vencimento: '2025-12-20' }), appointment('no-due', { status_pagamento: 'pendente' }), appointment('cancelled', { status: 'cancelado', status_pagamento: 'pendente', data_vencimento: '2025-01-01' })]
  const pendingBills = [financeRow('late', { tipo: 'saida', status_pagamento: 'pendente', data_vencimento: '2026-11-01' }), financeRow('no-due', { tipo: 'saida', status_pagamento: 'pendente' }), financeRow('paid', { tipo: 'saida', status_pagamento: 'pago', data_vencimento: '2025-01-01' })]
  const model = buildDashboard({ pendingAppointments, pendingBills }, '2026-11', '2026-11-06', now)
  assert.equal(model.overdueReceivables.length, 1)
  assert.equal(model.overdueBills.length, 1)
  assert.equal(model.receivables.length, 2)
  assert.equal(model.bills.length, 2)
  assert.equal(model.receiveTotal, 200)
})

test('uses cents for equal-value entries and distinguishes every agenda status', () => {
  const appointments = ['agendado', 'em_andamento', 'concluido', 'cancelado'].map((status, id) => appointment(String(id), { status }))
  const model = buildDashboard({ appointments, finance: [financeRow('a', { valor: '0.10' }), financeRow('b', { valor: '0.20' })] }, '2026-11', '2026-11-05', now)
  assert.equal(model.receipts, 0.3)
  assert.deepEqual(model.agendaCounts, { todos: 4, agendado: 1, em_andamento: 1, concluido: 1, cancelado: 1 })
})

test('dashboard links preserve date, period, service and pending payment filters', () => {
  const link = appointmentsLink({ date: '2026-01-15', status: 'concluido', service: 'service-id', query: 'Bidu & Mel', payment: 'pendente', create: true })
  const filter = readDashboardLink(link.slice(link.indexOf('?')), now)
  assert.deepEqual(filter, { month: '2026-01', date: '2026-01-15', status: 'concluido', service: 'service-id', query: 'Bidu & Mel', payment: 'pendente', create: '1' })
  const financial = readDashboardLink(financialLink('2025-12', 'Despesa & loja').split('?')[1], now)
  assert.equal(financial.month, '2025-12')
  assert.equal(financial.query, 'Despesa & loja')
  const invalid = readDashboardLink('?data=2026-02-31&mes=invalid&status=invalid', now)
  assert.equal(invalid.month, '2026-11')
  assert.equal(invalid.date, '')
  assert.equal(invalid.status, 'todos')
})
