import test from 'node:test'
import assert from 'node:assert/strict'
import { fetchAllRows } from '../src/lib/queries.js'

test('loads more than 1000 rows, even if the server caps pages at 200', async () => {
  const source = Array.from({ length: 1207 }, (_, id) => ({ id }))
  const query = { order() { return this }, async range(start, end) { return { data: source.slice(start, Math.min(end + 1, start + 200)), error: null } } }
  const result = await fetchAllRows(query)
  assert.deepEqual(result.data, source)
  assert.equal(result.error, null)
})

test('never returns partial totals after a failed page', async () => {
  const error = new Error('network error')
  const query = { order() { return this }, async range(start) { return start ? { data: null, error } : { data: [{id:1}], error:null } } }
  assert.deepEqual(await fetchAllRows(query), { data: null, error })
})

test('keeps legitimate equal-value entries with distinct IDs', async () => {
  const rows = [{ id:1, valor:50 }, { id:2, valor:50 }]
  const query = { order() { return this }, async range(start) { return {data: start ? [] : rows, error:null} } }
  assert.equal((await fetchAllRows(query)).data.reduce((sum,row)=>sum+row.valor,0),100)
})
