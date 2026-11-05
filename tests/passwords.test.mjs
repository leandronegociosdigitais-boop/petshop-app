import test from 'node:test'
import assert from 'node:assert/strict'
import { validateNewPassword } from '../src/lib/passwords.js'

test('rejects short and mismatched passwords before an update', () => {
  assert.equal(validateNewPassword('short', 'short'), 'Use uma senha com pelo menos 8 caracteres.')
  assert.equal(validateNewPassword('example-test-123', 'different-test-123'), 'As senhas não coincidem.')
})

test('accepts matching passwords without silently trimming their spaces', () => {
  assert.equal(validateNewPassword(' example-test-123 ', ' example-test-123 '), null)
  assert.equal(validateNewPassword('example-test-123 ', 'example-test-123'), 'As senhas não coincidem.')
})
