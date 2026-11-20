import { test } from 'node:test'
import assert from 'node:assert/strict'
import { exploreWords, wordOfTheDay } from './explore.ts'

const pool = Array.from({ length: 40 }, (_, i) => `word${i}`)

test('exploreWords is stable, distinct and never includes the word itself', () => {
  for (const word of ['achieve', 'break the ice', 'word3', 'x']) {
    const picks = exploreWords(word, pool, 6)
    assert.equal(picks.length, 6)
    assert.equal(new Set(picks).size, 6)
    assert.ok(!picks.includes(word))
    assert.deepEqual(picks, exploreWords(word, pool, 6))
  }
  assert.ok(!exploreWords('word3', pool, 6).includes('word3'))
})

test('different words get different neighbours', () => {
  const sets = new Set(['alpha', 'beta', 'gamma', 'delta', 'epsilon'].map((w) => exploreWords(w, pool).join(',')))
  assert.ok(sets.size > 1)
})

test('small pools return everything else, and prime and composite sizes both stay distinct', () => {
  assert.deepEqual(exploreWords('a', ['a', 'b', 'c'], 6), ['b', 'c'])
  for (const size of [8, 12, 13, 30]) {
    const p = Array.from({ length: size }, (_, i) => `w${i}`)
    for (const word of ['one', 'two', 'three', 'four']) {
      const picks = exploreWords(word, p, 6)
      assert.equal(new Set(picks).size, picks.length)
    }
  }
})

test('wordOfTheDay changes daily and cycles through the pool', () => {
  const a = wordOfTheDay(new Date('2026-11-18T00:00:00Z'), pool)
  const b = wordOfTheDay(new Date('2026-11-18T23:59:59Z'), pool)
  const c = wordOfTheDay(new Date('2026-11-19T00:00:00Z'), pool)
  assert.equal(a, b)
  assert.notEqual(a, c)
  assert.equal(wordOfTheDay(new Date(0), pool), pool[0])
  assert.throws(() => wordOfTheDay(new Date(), []))
})
