import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import {
  dailyGoalProgress,
  dateInTimeZone,
  daysBetween,
  levelForXp,
  levelProgress,
  streakView,
  titleForLevel,
  XP_AWARDS,
  xpForLevel,
} from './gamification.ts'

// The database function award_xp() is the source of truth for XP; XP_AWARDS only mirrors it for
// display. This reads the migration and fails if the two ever drift apart.
test('XP_AWARDS matches the amounts and daily caps inside award_xp() in the migration', async () => {
  const sql = await readFile(new URL('../../supabase/migrations/0001_init.sql', import.meta.url), 'utf8')
  const blocks = [...sql.matchAll(/case p_kind\s+([\s\S]*?)\s+end\b/g)].map((m) => m[1])
  assert.equal(blocks.length, 2, 'expected one case block for amounts and one for caps')
  const parse = (block: string) =>
    Object.fromEntries([...block.matchAll(/when '(\w+)' then (\d+)/g)].map((m) => [m[1], Number(m[2])]))
  const [amounts, caps] = blocks.map(parse)

  const fromCode = Object.keys(XP_AWARDS).sort()
  assert.deepEqual(Object.keys(amounts).sort(), fromCode)
  assert.deepEqual(Object.keys(caps).sort(), fromCode)
  for (const kind of fromCode as (keyof typeof XP_AWARDS)[]) {
    assert.equal(amounts[kind], XP_AWARDS[kind].perAction, `${kind}: XP per action`)
    assert.equal(caps[kind], XP_AWARDS[kind].dailyCap, `${kind}: daily cap`)
  }
})

test('level thresholds follow 50 * (n-1)^2', () => {
  assert.deepEqual([0, 49, 50, 199, 200, 449, 450].map(levelForXp), [1, 1, 2, 2, 3, 3, 4])
  assert.equal(levelForXp(-10), 1)
  assert.deepEqual([1, 2, 3, 4].map(xpForLevel), [0, 50, 200, 450])
  for (let level = 1; level <= 30; level++) assert.equal(levelForXp(xpForLevel(level)), level)
})

test('levelProgress reports position inside the current level', () => {
  const p = levelProgress(125)
  assert.deepEqual(p, { level: 2, xpIntoLevel: 75, xpForNextLevel: 150, fraction: 0.5 })
  assert.equal(levelProgress(0).fraction, 0)
})

test('dateInTimeZone uses the learner’s local calendar day', () => {
  const instant = new Date('2026-11-17T22:00:00Z')
  assert.equal(dateInTimeZone('UTC', instant), '2026-11-17')
  assert.equal(dateInTimeZone('Asia/Tokyo', instant), '2026-11-18')
  assert.equal(dateInTimeZone('America/Los_Angeles', instant), '2026-11-17')
  assert.equal(dateInTimeZone('Not/AZone', instant), '2026-11-17')
})

test('daysBetween handles month and year boundaries', () => {
  assert.equal(daysBetween('2026-02-28', '2026-03-01'), 1)
  assert.equal(daysBetween('2026-12-31', '2027-01-01'), 1)
  assert.equal(daysBetween('2026-03-10', '2026-03-10'), 0)
})

test('streakView', () => {
  assert.deepEqual(streakView(null, 0, '2026-11-17'), { state: 'none', count: 0 })
  assert.deepEqual(streakView('2026-11-17', 5, '2026-11-17'), { state: 'done-today', count: 5 })
  assert.deepEqual(streakView('2026-11-16', 5, '2026-11-17'), { state: 'at-risk', count: 5 })
  assert.deepEqual(streakView('2026-11-15', 5, '2026-11-17'), { state: 'lost', count: 0 })
})

test('dailyGoalProgress clamps', () => {
  assert.deepEqual(dailyGoalProgress(15, 30), { fraction: 0.5, reached: false })
  assert.deepEqual(dailyGoalProgress(90, 30), { fraction: 1, reached: true })
  assert.deepEqual(dailyGoalProgress(5, 0), { fraction: 1, reached: true })
})

test('titleForLevel steps every three levels and saturates', () => {
  assert.equal(titleForLevel(1), 'Newcomer')
  assert.equal(titleForLevel(4), 'Explorer')
  assert.equal(titleForLevel(999), 'Master')
})
