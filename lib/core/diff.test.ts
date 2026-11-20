import { test } from 'node:test'
import assert from 'node:assert/strict'
import { describeDiff, diffWords, editDistance, tokenize } from './diff.ts'

const statuses = (expected: string, answer: string, opts = {}) =>
  diffWords(expected, answer, opts).tokens.map((t) => t.status)

test('case, punctuation and curly quotes are ignored', () => {
  const r = diffWords("I'd like a coffee, please.", 'i’d like a COFFEE please')
  assert.equal(r.perfect, true)
  assert.equal(r.accuracy, 1)
  assert.equal(diffWords("Don't stop", 'Don’t stop').perfect, true)
})

test('a missing word is reported once and the rest stays aligned', () => {
  const r = diffWords('She works at a bank.', 'She works at bank.')
  assert.deepEqual(r.tokens.map((t) => t.status), ['correct', 'correct', 'correct', 'missing', 'correct'])
  assert.equal(r.tokens[3].expected, 'a')
  assert.equal(r.accuracy, 4 / 5)
  assert.deepEqual(statuses('the quick brown fox', 'the brown fox'), ['correct', 'missing', 'correct', 'correct'])
})

test('an extra word counts against accuracy', () => {
  const r = diffWords('I like tea', 'I really like tea')
  assert.equal(r.extra, 1)
  assert.equal(r.accuracy, 3 / 4)
  assert.equal(r.perfect, false)
})

test('typos are tolerated on longer words only', () => {
  assert.equal(diffWords('necessary', 'neccessary').typos, 1)
  assert.equal(diffWords('receive', 'recieve').typos, 1)
  assert.equal(diffWords('cat', 'car').wrong, 1)
  assert.equal(diffWords('went', 'gone').wrong, 1)
  assert.equal(diffWords('necessary', 'neccessary').accuracy, 0.5)
})

test('empty answer and empty reference', () => {
  const none = diffWords('Good morning', '')
  assert.equal(none.missing, 2)
  assert.equal(none.accuracy, 0)
  assert.equal(none.perfect, false)
  assert.equal(diffWords('', '').perfect, true)
  assert.equal(diffWords('', 'hello').accuracy, 0)
})

test('contractions are strict unless expandContractions is on', () => {
  assert.equal(diffWords("I'm fine", 'I am fine').perfect, false)
  assert.equal(diffWords("I'm fine", 'I am fine', { expandContractions: true }).perfect, true)
  assert.equal(diffWords('I cannot go', "I can't go", { expandContractions: true }).perfect, true)
})

test('tokenize and editDistance basics', () => {
  assert.deepEqual(tokenize('Well-known—really?'), ['well-known', 'really'])
  assert.equal(editDistance('kitten', 'sitting'), 3)
  assert.equal(editDistance('ab', 'ba'), 1)
  assert.equal(editDistance('', 'abc'), 3)
})

test('prototype keys are not treated as contractions', () => {
  assert.deepEqual(tokenize('constructor toString', { expandContractions: true }), ['constructor', 'tostring'])
})

test('describeDiff reads every mistake aloud, and says nothing for a perfect answer', () => {
  const r = diffWords('She went to a shop', 'She go to shop')
  assert.deepEqual(describeDiff(r.tokens), ['You wrote "go" where the answer has "went".', 'Missing the word "a".'])
  assert.deepEqual(describeDiff(diffWords('I like tea', 'I really like tea').tokens), ['The word "really" is extra.'])
  assert.deepEqual(describeDiff(diffWords('Hello there', 'hello there').tokens), [])
})
