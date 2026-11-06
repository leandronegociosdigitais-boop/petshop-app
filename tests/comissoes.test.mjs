import test from 'node:test'
import assert from 'node:assert/strict'
import { commissionableAppointments } from '../src/lib/comissoes.js'
import { buildDashboard } from '../src/lib/dashboard.js'

test('commission counts work in progress before payment without counting scheduled or cancelled work', () => {
  const rows = [
    { id: 'working', status: 'em_andamento', status_pagamento: 'pendente', valor: 60, valor_2: 40, data_hora: '2026-11-06T10:00:00' },
    { id: 'completed', status: 'concluido', status_pagamento: 'pendente', valor: 80, data_hora: '2026-11-06T11:00:00' },
    { id: 'scheduled', status: 'agendado', status_pagamento: 'pago', valor: 500 },
    { id: 'cancelled', status: 'cancelado', status_pagamento: 'pago', valor: 500 },
  ]
  const eligible = commissionableAppointments(rows)
  assert.deepEqual(eligible.map(row => row.id), ['working', 'completed'])
  assert.equal(eligible.reduce((total, row) => total + (row.valor + (row.valor_2 || 0)) * 0.4, 0), 72)
  const dashboard = buildDashboard({ appointments: rows, finance: [], pendingAppointments: rows }, '2026-11', '2026-11-06', new Date('2026-11-06T12:00:00'))
  assert.equal(dashboard.completed, 1)
  assert.equal(dashboard.revenue, 80)
  assert.equal(dashboard.receipts, 0)
})

test('completing work keeps the same commission count and cancelling removes it', () => {
  const working = { id: 'same-service', status: 'em_andamento', valor: 100 }
  assert.equal(commissionableAppointments([working]).length, 1)
  assert.equal(commissionableAppointments([{ ...working, status: 'concluido' }]).length, 1)
  assert.equal(commissionableAppointments([{ ...working, status: 'cancelado' }]).length, 0)
})
