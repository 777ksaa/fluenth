import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isEmail, safeNextPath } from './safe-redirect.ts'

test('same-site paths are allowed', () => {
  assert.equal(safeNextPath('/review'), '/review')
  assert.equal(safeNextPath('/grammar/present-perfect?x=1#top'), '/grammar/present-perfect?x=1#top')
})

test('anything that could leave the site falls back', () => {
  for (const bad of [
    '//evil.example',
    '/\\evil.example',
    'https://evil.example',
    'http://evil.example/dashboard',
    'javascript:alert(1)',
    'evil.example',
    '',
    '/ok\nLocation: x',
    '/a\\b',
    '/' + 'a'.repeat(400),
  ]) {
    assert.equal(safeNextPath(bad), '/dashboard', JSON.stringify(bad))
  }
  assert.equal(safeNextPath(null), '/dashboard')
  assert.equal(safeNextPath(undefined, '/x'), '/x')
})

test('isEmail', () => {
  assert.equal(isEmail('anna@example.com'), true)
  for (const bad of ['', 'anna', 'anna@', '@example.com', 'a b@example.com', 'anna@example', 'a@b.c']) {
    assert.equal(isEmail(bad), false, bad)
  }
})
