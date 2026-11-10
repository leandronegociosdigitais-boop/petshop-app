import test from 'node:test'
import assert from 'node:assert/strict'
import { buildSalesComparison } from '../src/lib/dashboard.js'
const row = (date, value, overrides = {}) => ({ data_hora: date + 'T12:00:00', valor: value, status: 'concluido', ...overrides })

test('compares cumulative completed sales through the same day, without including later prior-month sales', () => {
  const result = buildSalesComparison([
    row('2026-11-01', 10), row('2026-11-03', 20, { valor_2: 5, forma_pagamento_2: 'pix', status_pagamento: 'pendente' }),
    row('2026-10-01', 5), row('2026-10-10', 25), row('2026-10-11', 999), row('2026-11-11', 999),
    row('2026-11-02', 999, { status: 'em_andamento' }), row('2026-11-02', 999, { status: 'cancelado' }),
  ], '2026-11', new Date('2026-11-10T12:00:00'))
  assert.equal(result.points.length, 10)
  assert.deepEqual(result.points[0], { day: 1, atual: 10, anterior: 5 })
  assert.deepEqual(result.points[2], { day: 3, atual: 35, anterior: 5 })
  assert.deepEqual(result.points[9], { day: 10, atual: 35, anterior: 30 })
})

test('handles January, shorter months, leap years, empty months and precise cents', () => {
  const january = buildSalesComparison([row('2025-12-01', 0.1), row('2025-12-01', 0.2)], '2026-01', new Date('2026-01-01T12:00:00'))
  assert.equal(january.previousMonth, '2025-12')
  assert.equal(january.previousTotal, 0.3)
  const march = buildSalesComparison([row('2024-02-29', 80)], '2024-03', new Date('2024-03-31T12:00:00'))
  assert.equal(march.previousCutoff, 29)
  assert.equal(march.points[28].anterior, 80)
  assert.equal(march.points[29].anterior, null)
  assert.equal(march.points[30].atual, 0)
  assert.equal(buildSalesComparison([], '2026-12', new Date('2026-11-10T12:00:00')).points.length, 0)
})
