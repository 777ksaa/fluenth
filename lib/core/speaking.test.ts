import { test } from 'node:test'
import assert from 'node:assert/strict'
import { scoreSpeaking, verdictFor } from './speaking.ts'

test('exact match scores 100', () => {
  const r = scoreSpeaking('Nice to meet you.', 'nice to meet you')
  assert.equal(r.score, 100)
  assert.equal(r.verdict, 'excellent')
  assert.deepEqual(r.missed, [])
})

test('contractions are equivalent for speech', () => {
  assert.equal(scoreSpeaking("I'm fine", 'I am fine').score, 100)
})

test('recogniser confidence scales the score, never below 85%', () => {
  assert.equal(scoreSpeaking('good morning', 'good morning', 0.95).score, 100)
  assert.equal(scoreSpeaking('good morning', 'good morning', 0.45).score, 93)
  assert.equal(scoreSpeaking('good morning', 'good morning', 0).score, 85)
  assert.equal(scoreSpeaking('good morning', 'good morning', Number.NaN).score, 100)
})

test('partial match reports the missed words', () => {
  const r = scoreSpeaking('I would like a cup of tea', 'I would like cup tea')
  assert.equal(r.score, 71)
  assert.equal(r.verdict, 'keep-practising')
  assert.deepEqual(r.missed, ['a', 'of'])
})

test('hearing nothing scores 0 even with high confidence', () => {
  const r = scoreSpeaking('good morning', '', 1)
  assert.equal(r.score, 0)
  assert.equal(r.verdict, 'try-again')
})

test('verdict thresholds', () => {
  assert.deepEqual([90, 89, 75, 74, 50, 49].map(verdictFor), [
    'excellent',
    'good',
    'good',
    'keep-practising',
    'keep-practising',
    'try-again',
  ])
})
