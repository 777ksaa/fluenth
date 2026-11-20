import { test } from 'node:test'
import assert from 'node:assert/strict'
import { GRAMMAR_TOPICS, PLANNED_TOPICS, getTopic, groupedByLevel } from './index.ts'
import { LEVELS } from '../../lib/core/levels.ts'
import { gradeQuiz } from '../../lib/core/quiz.ts'
import type { QuizAnswer } from '../../lib/core/quiz.ts'

test('every level has at least two published lessons and a planned list', () => {
  for (const group of groupedByLevel()) {
    assert.ok(group.topics.length >= 2, `${group.level} has ${group.topics.length} topics`)
    assert.ok(group.planned.length >= 3)
  }
  assert.deepEqual(Object.keys(PLANNED_TOPICS), [...LEVELS])
})

test('slugs are unique, URL-safe and look up correctly', () => {
  const slugs = GRAMMAR_TOPICS.map((t) => t.slug)
  assert.equal(new Set(slugs).size, slugs.length)
  for (const t of GRAMMAR_TOPICS) {
    assert.match(t.slug, /^[a-z]+(-[a-z]+)*$/)
    assert.equal(getTopic(t.slug), t)
  }
  assert.equal(getTopic('nope'), undefined)
  assert.equal(getTopic('constructor'), undefined)
})

test('topic content is complete', () => {
  for (const t of GRAMMAR_TOPICS) {
    const where = t.slug
    assert.ok(t.summary.length >= 100 && t.summary.length <= 175, `${where}: summary length ${t.summary.length}`)
    assert.ok(t.title.length > 3 && t.youglish.length > 2, where)
    assert.ok(t.rules.length >= 5, `${where}: rules`)
    assert.ok(t.mistakes.length >= 3, `${where}: mistakes`)
    for (const m of t.mistakes) assert.notEqual(m.wrong, m.right, where)
    assert.ok(t.sections.length >= 2, `${where}: sections`)
    for (const s of t.sections) {
      assert.ok(s.body || s.table || s.examples, `${where}/${s.heading}: empty section`)
      for (const row of s.table?.rows ?? []) {
        assert.equal(row.length, s.table!.head.length, `${where}/${s.heading}: ragged table row ${JSON.stringify(row)}`)
      }
      for (const e of s.examples ?? []) assert.ok(e.en.length > 3, where)
    }
    for (const related of t.related) {
      assert.ok(getTopic(related), `${where}: unknown related topic ${related}`)
      assert.notEqual(related, t.slug)
    }
  }
})

test('quizzes are well formed and the answer key scores 100', () => {
  const ids = new Set<string>()
  for (const t of GRAMMAR_TOPICS) {
    assert.equal(t.quiz.length, 5, `${t.slug}: quiz length`)
    for (const q of t.quiz) {
      assert.ok(!ids.has(q.id), `duplicate question id ${q.id}`)
      ids.add(q.id)
      assert.ok(q.explanation.length > 5)
      if (q.type === 'choice') {
        assert.ok(q.options.length >= 2 && new Set(q.options).size === q.options.length, q.id)
        assert.ok(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < q.options.length, q.id)
      } else {
        assert.ok(q.answers.length >= 1 && q.answers.every((a) => a.trim().length > 0), q.id)
        assert.ok(q.prompt.includes('___'), `${q.id}: fill prompt needs a gap`)
      }
    }
    const key: QuizAnswer[] = t.quiz.map((q) => (q.type === 'choice' ? q.answer : q.answers[0]))
    const result = gradeQuiz(t.quiz, key)
    assert.equal(result.score, 100, `${t.slug}: answer key scored ${result.score}`)
    assert.equal(gradeQuiz(t.quiz, []).score, 0)
  }
})
