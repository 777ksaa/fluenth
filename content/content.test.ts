import { test } from 'node:test'
import assert from 'node:assert/strict'
import { DICTATION_SETS, getDictationSet } from './dictation.ts'
import { DIALOGUES, getDialogue } from './dialogues.ts'
import { SEED_WORDS } from './seed-words.ts'
import { LEVELS } from '../lib/core/levels.ts'
import { normalizeWord } from '../lib/core/words.ts'
import { tokenize } from '../lib/core/diff.ts'

test('dictation: one set per level, five unique lines, difficulty rises', () => {
  assert.deepEqual(DICTATION_SETS.map((s) => s.level), [...LEVELS])
  const ids = new Set<string>()
  const averages: number[] = []
  for (const set of DICTATION_SETS) {
    assert.equal(set.lines.length, 5, set.level)
    assert.equal(getDictationSet(set.level), set)
    for (const line of set.lines) {
      assert.ok(!ids.has(line.id), `duplicate ${line.id}`)
      ids.add(line.id)
      assert.ok(/[.?!]$/.test(line.text), `${line.id} should end with punctuation`)
      assert.ok(tokenize(line.text).length >= 4, line.id)
    }
    averages.push(set.lines.reduce((n, l) => n + tokenize(l.text).length, 0) / set.lines.length)
  }
  for (let i = 1; i < averages.length; i++) {
    assert.ok(averages[i] >= averages[i - 1] - 0.5, `level ${LEVELS[i]} is not harder than ${LEVELS[i - 1]}: ${averages.join(', ')}`)
  }
})

test('dialogues are complete and both roles speak', () => {
  const slugs = DIALOGUES.map((d) => d.slug)
  assert.equal(new Set(slugs).size, slugs.length)
  for (const d of DIALOGUES) {
    assert.match(d.slug, /^[a-z]+(-[a-z]+)*$/)
    assert.equal(getDialogue(d.slug), d)
    assert.ok(d.summary.length >= 100 && d.summary.length <= 175, `${d.slug}: summary ${d.summary.length}`)
    assert.notEqual(d.roles.A, d.roles.B)
    for (const role of ['A', 'B'] as const) {
      assert.ok(d.lines.filter((l) => l.speaker === role).length >= 3, `${d.slug}: role ${role}`)
    }
    assert.equal(d.lines[0].speaker, 'A')
    assert.ok(d.phrases.length >= 3)
  }
  assert.equal(getDialogue('missing'), undefined)
})

test('seed words are valid, unique and cover phrases', () => {
  assert.equal(new Set(SEED_WORDS).size, SEED_WORDS.length)
  for (const w of SEED_WORDS) assert.equal(normalizeWord(w), w, `"${w}" is not in canonical form`)
  assert.ok(SEED_WORDS.some((w) => w.includes(' ')))
})
