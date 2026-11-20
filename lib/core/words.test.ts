import { test } from 'node:test'
import assert from 'node:assert/strict'
import { normalizeWord, slugToCandidates, wordToSlug } from './words.ts'

test('normalizeWord cleans case, spacing, punctuation and curly quotes', () => {
  assert.equal(normalizeWord('  Hello! '), 'hello')
  assert.equal(normalizeWord('Break   the  ICE'), 'break the ice')
  assert.equal(normalizeWord('don’t'), "don't")
  assert.equal(normalizeWord('-well-known-'), 'well-known')
  assert.equal(normalizeWord('Let the cat out of the bag'), 'let the cat out of the bag')
})

test('normalizeWord rejects anything that is not a plausible entry', () => {
  for (const bad of ['', '   ', '123', '3d', '24/7', 'foo_bar', 'hello--world', '<script>', 'a b c d e f g h i', 'x'.repeat(61), 'cafés ok?']) {
    assert.equal(normalizeWord(bad), null, `should reject ${JSON.stringify(bad)}`)
  }
  assert.equal(normalizeWord(42), null)
  assert.equal(normalizeWord(undefined), null)
})

test('slugs round-trip through candidates', () => {
  assert.equal(wordToSlug('break the ice'), 'break-the-ice')
  assert.deepEqual(slugToCandidates('break-the-ice'), ['break the ice', 'break-the-ice'])
  assert.deepEqual(slugToCandidates('hello'), ['hello'])
  assert.deepEqual(slugToCandidates('well-known'), ['well known', 'well-known'])
  assert.deepEqual(slugToCandidates('%E0%A4%A'), [])
  assert.deepEqual(slugToCandidates('100%25'), [])
})
