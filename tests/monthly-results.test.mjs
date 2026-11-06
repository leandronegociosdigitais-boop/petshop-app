import test from 'node:test'
import assert from 'node:assert/strict'
import { buildMonthlyResults, buildDashboard } from '../src/lib/dashboard.js'

test('monthly gross and net use realized ledger entries and match the dashboard cash balance', () => {
  const now = new Date('2026-11-06T12:00:00')
  const finance = [
    { tipo: 'entrada', valor: 100, data: '2026-11-01', status_pagamento: 'pago' },
    { tipo: 'entrada', valor: 100, data: '2026-11-01', status_pagamento: null },
    { tipo: 'saida', valor: 50, data: '2026-11-02', status_pagamento: 'pago' },
    { tipo: 'saida', valor: 500, data: '2026-11-02', status_pagamento: 'pendente' },
    { tipo: 'entrada', valor: 500, data: '2026-11-02', status_pagamento: 'pendente' },
    { tipo: 'entrada', valor: 500, data: '2026-11-07', status_pagamento: 'pago' },
    { tipo: 'entrada', valor: 500, data: '2025-11-02', status_pagamento: 'pago' },
  ]
  const rows = buildMonthlyResults(finance, 2026, now)
  assert.equal(rows.length, 11)
  assert.equal(rows[10].apurado, 200)
  assert.equal(rows[10].despesas, 50)
  assert.equal(rows[10].liquido, 150)
  const dashboard = buildDashboard({ finance }, '2026-11', '2026-11-06', now)
  assert.equal(rows[10].liquido, dashboard.balance)
  assert.equal(rows[10].apurado, dashboard.receipts)
})

test('monthly results preserve negative balances, cents, empty months and year boundaries', () => {
  const rows = buildMonthlyResults([
    { tipo: 'entrada', valor: 0.1, data: '2025-12-31' },
    { tipo: 'entrada', valor: 0.2, data: '2025-12-31' },
    { tipo: 'saida', valor: 1, data: '2025-12-31' },
    { tipo: 'entrada', valor: 999, data: '2026-01-01' },
  ], 2025, new Date('2026-01-02T12:00:00'))
  assert.equal(rows.length, 12)
  assert.equal(rows[0].liquido, 0)
  assert.equal(rows[11].apurado, 0.3)
  assert.equal(rows[11].liquido, -0.7)
  assert.deepEqual(buildMonthlyResults([], 2027, new Date('2026-01-02T12:00:00')), [])
})
