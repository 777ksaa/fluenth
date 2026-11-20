import { test } from 'node:test'
import assert from 'node:assert/strict'
import { extractJson, parseGeneratedQuiz, parseTranslation } from './parse.ts'

const GOOD = [
  { type: 'choice', prompt: 'She ___ to school.', options: ['go', 'goes', 'going'], answer: 1, explanation: 'He/she/it takes -es.' },
  { type: 'fill', prompt: 'They ___ (be) late.', answers: ['were'], explanation: 'Past of be with they.' },
]

test('parses a clean array and a fenced one with chatter', () => {
  const plain = parseGeneratedQuiz(JSON.stringify(GOOD), 'ai')
  assert.equal(plain.length, 2)
  assert.deepEqual(plain.map((q) => q.id), ['ai-1', 'ai-2'])
  const fenced = parseGeneratedQuiz('Here you go!\n```json\n' + JSON.stringify(GOOD) + '\n```\nEnjoy.', 'ai')
  assert.equal(fenced.length, 2)
})

test('drops invalid questions instead of guessing', () => {
  const bad = [
    { type: 'choice', prompt: 'p', options: ['a', 'b'], answer: 5, explanation: 'e' }, // answer out of range
    { type: 'choice', prompt: 'p', options: ['a', 'a'], answer: 0, explanation: 'e' }, // duplicate options
    { type: 'choice', prompt: 'p', options: ['a', ''], answer: 0, explanation: 'e' }, // blank option
    { type: 'choice', prompt: 'p', options: ['a'], answer: 0, explanation: 'e' }, // one option
    { type: 'choice', prompt: 'p', options: ['a', 'b'], answer: '1', explanation: 'e' }, // answer not a number
    { type: 'fill', prompt: 'no gap here', answers: ['x'], explanation: 'e' },
    { type: 'fill', prompt: 'gap ___', answers: [], explanation: 'e' },
    { type: 'essay', prompt: 'p', explanation: 'e' },
    { type: 'choice', options: ['a', 'b'], answer: 0, explanation: 'e' }, // no prompt
    null,
    'text',
    GOOD[0],
  ]
  const out = parseGeneratedQuiz(JSON.stringify(bad), 'x')
  assert.equal(out.length, 1)
  assert.equal(out[0].id, 'x-1')
})

test('garbage and over-long output are handled', () => {
  assert.deepEqual(parseGeneratedQuiz('sorry, I cannot', 'x'), [])
  assert.deepEqual(parseGeneratedQuiz('[not json]', 'x'), [])
  assert.deepEqual(parseGeneratedQuiz('{"a":1}', 'x'), [])
  const many = Array.from({ length: 20 }, () => GOOD[0])
  assert.equal(parseGeneratedQuiz(JSON.stringify(many), 'x', 5).length, 5)
})

test('parseTranslation', () => {
  assert.deepEqual(parseTranslation('{"translation":"привет","example":"Привет, Катя!"}'), { translation: 'привет', example: 'Привет, Катя!' })
  assert.deepEqual(parseTranslation('```json\n{"translation":"здравствуйте"}\n```'), { translation: 'здравствуйте' })
  assert.equal(parseTranslation('{"translation":""}'), null)
  assert.equal(parseTranslation('{"translation":"' + 'x'.repeat(500) + '"}'), null)
  assert.equal(parseTranslation('no json'), null)
  assert.equal(parseTranslation('[1,2]'), null)
})

test('extractJson', () => {
  assert.deepEqual(extractJson('x [1,2] y', '['), [1, 2])
  assert.equal(extractJson('nothing', '{'), undefined)
})
