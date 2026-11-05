import test from 'node:test'
import assert from 'node:assert/strict'
import { isWeeklyBackupDue } from '../src/lib/backup-schedule.js'

test('catches up after the app was closed on Saturday', () => {
  assert.equal(isWeeklyBackupDue('2026-10-30T12:00:00',new Date('2026-11-02T10:00:00')),true)
})
test('does not repeat a successful backup in the same week', () => {
  assert.equal(isWeeklyBackupDue('2026-10-31T12:00:00',new Date('2026-11-05T10:00:00')),false)
})
test('retries missing and invalid timestamps', () => {
  const now = new Date('2026-11-05T10:00:00')
  assert.equal(isWeeklyBackupDue(null,now),true)
  assert.equal(isWeeklyBackupDue('invalid',now),true)
})
test('runs again on the next Saturday, including a year boundary', () => {
  assert.equal(isWeeklyBackupDue('2026-12-26T12:00:00',new Date('2027-01-02T00:00:00')),true)
})
