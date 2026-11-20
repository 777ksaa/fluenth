import { test } from 'node:test'
import assert from 'node:assert/strict'
import { gradeQuestion, gradeQuiz, normalizeAnswer, shuffled } from './quiz.ts'
import type { QuizQuestion } from './quiz.ts'

const QUESTIONS: QuizQuestion[] = [
  { id: 'q1', type: 'choice', prompt: 'She ___ a teacher.', options: ['am', 'is', 'are'], answer: 1, explanation: 'he/she/it takes is.' },
  { id: 'q2', type: 'fill', prompt: "He ___ (not / be) here.", answers: ["isn't", 'is not'], explanation: 'negative of is.' },
  { id: 'q3', type: 'choice', prompt: 'I ___ hungry.', options: ['am', 'is', 'are'], answer: 0, explanation: 'I takes am.' },
  { id: 'q4', type: 'fill', prompt: 'They ___ friends.', answers: ['are'], explanation: 'plural takes are.' },
]

test('choice grading is by index', () => {
  assert.equal(gradeQuestion(QUESTIONS[0], 1).correct, true)
  assert.equal(gradeQuestion(QUESTIONS[0], 0).correct, false)
  assert.equal(gradeQuestion(QUESTIONS[0], 'is').correct, false)
  assert.equal(gradeQuestion(QUESTIONS[0], null).correct, false)
})

test('fill grading ignores case, spacing, final punctuation and curly quotes', () => {
  assert.equal(gradeQuestion(QUESTIONS[1], "  Isn’t. ").correct, true)
  assert.equal(gradeQuestion(QUESTIONS[1], 'IS  NOT').correct, true)
  assert.equal(gradeQuestion(QUESTIONS[1], 'is').correct, false)
  assert.equal(gradeQuestion(QUESTIONS[1], '').correct, false)
  assert.equal(gradeQuestion(QUESTIONS[1], 3).correct, false)
})

test('gradeQuiz scores, passes at 80% and treats missing answers as wrong', () => {
  const perfect = gradeQuiz(QUESTIONS, [1, 'is not', 0, 'are'])
  assert.deepEqual([perfect.score, perfect.correct, perfect.total, perfect.passed], [100, 4, 4, true])

  const partial = gradeQuiz(QUESTIONS, [1, 'is not', 0])
  assert.deepEqual([partial.score, partial.passed], [75, false])
  assert.equal(partial.results[3].expected, 'are')

  assert.equal(gradeQuiz([], []).score, 0)
  const five = gradeQuiz([...QUESTIONS, { ...QUESTIONS[0], id: 'q5' }], [1, 'is not', 0, 'are', 0])
  assert.deepEqual([five.score, five.passed], [80, true])
})

test('normalizeAnswer', () => {
  assert.equal(normalizeAnswer('  Has   been!! '), 'has been')
})

test('shuffled keeps every element and does not mutate', () => {
  const input = [1, 2, 3, 4, 5]
  const out = shuffled(input, () => 0.3)
  assert.deepEqual([...out].sort(), [1, 2, 3, 4, 5])
  assert.deepEqual(input, [1, 2, 3, 4, 5])
})
