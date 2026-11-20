import { test } from 'node:test'
import assert from 'node:assert/strict'
import { addDays, xpByDay } from './activity.ts'
import type { ActivityRow } from './activity.ts'

test('addDays crosses month and year boundaries', () => {
  assert.equal(addDays('2026-11-30', 1), '2026-12-01')
  assert.equal(addDays('2026-12-31', 1), '2027-01-01')
  assert.equal(addDays('2026-03-01', -1), '2026-02-28')
  assert.equal(addDays('2024-03-01', -1), '2024-02-29')
})

test('xpByDay groups by the learner’s calendar day, not UTC', () => {
  const rows: ActivityRow[] = [
    { kind: 'quiz', xp_awarded: 20, created_at: '2026-11-17T21:30:00Z' }, // 02:30 on the 18th in Atyrau (UTC+5)
    { kind: 'review', xp_awarded: 2, created_at: '2026-11-18T05:00:00Z' },
    { kind: 'drill', xp_awarded: 15, created_at: '2026-11-16T10:00:00Z' },
  ]
  const atyrau = xpByDay(rows, 'Asia/Atyrau', '2026-11-18', 3)
  assert.deepEqual(atyrau, [
    { date: '2026-11-16', xp: 15 },
    { date: '2026-11-17', xp: 0 },
    { date: '2026-11-18', xp: 22 },
  ])
  const utc = xpByDay(rows, 'UTC', '2026-11-18', 3)
  assert.deepEqual(utc.map((d) => d.xp), [15, 20, 2])
})

test('xpByDay always returns the requested number of days, oldest first', () => {
  const out = xpByDay([], 'UTC', '2026-01-02', 14)
  assert.equal(out.length, 14)
  assert.equal(out[13].date, '2026-01-02')
  assert.equal(out[0].date, '2025-12-20')
  assert.ok(out.every((d) => d.xp === 0))
})
