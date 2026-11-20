import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  formatInterval,
  isDue,
  newCardState,
  previewIntervals,
  schedule,
  stateFromRow,
  stateToRow,
} from './sm2.ts'
import type { Rating, SrsState } from './sm2.ts'

const NOW = new Date('2026-01-01T00:00:00Z')
const MIN = 60_000
const DAY = 86_400_000
const delta = (c: SrsState) => c.dueAt.getTime() - NOW.getTime()

const reviewCard = (over: Partial<SrsState> = {}): SrsState => ({
  state: 'review',
  learningStep: 0,
  easeFactor: 2.5,
  intervalDays: 10,
  repetitions: 4,
  lapses: 0,
  dueAt: NOW,
  ...over,
})

test('new card: Good, Good graduates after the 1m and 10m steps', () => {
  let c = newCardState(NOW)
  assert.equal(isDue(c, NOW), true)
  c = schedule(c, 3, NOW)
  assert.equal(c.state, 'learning')
  assert.equal(c.learningStep, 1)
  assert.equal(delta(c), 10 * MIN)
  c = schedule(c, 3, NOW)
  assert.equal(c.state, 'review')
  assert.equal(c.intervalDays, 1)
  assert.equal(c.repetitions, 1)
  assert.equal(delta(c), DAY)
})

test('new card: Easy graduates immediately at 4 days, Again restarts at 1 minute', () => {
  const easy = schedule(newCardState(NOW), 4, NOW)
  assert.equal(easy.state, 'review')
  assert.equal(easy.intervalDays, 4)

  const again = schedule(schedule(newCardState(NOW), 3, NOW), 1, NOW)
  assert.equal(again.state, 'learning')
  assert.equal(again.learningStep, 0)
  assert.equal(delta(again), MIN)
})

test('review card: Again / Hard / Good / Easy', () => {
  const lapsed = schedule(reviewCard(), 1, NOW)
  assert.equal(lapsed.state, 'relearning')
  assert.equal(lapsed.lapses, 1)
  assert.equal(lapsed.easeFactor, 2.3)
  assert.equal(lapsed.intervalDays, 1)
  assert.equal(delta(lapsed), 10 * MIN)

  const hard = schedule(reviewCard(), 2, NOW)
  assert.deepEqual([hard.intervalDays, hard.easeFactor], [12, 2.35])

  const good = schedule(reviewCard(), 3, NOW)
  assert.deepEqual([good.intervalDays, good.easeFactor], [25, 2.5])
  assert.equal(delta(good), 25 * DAY)

  const easy = schedule(reviewCard(), 4, NOW)
  assert.deepEqual([easy.intervalDays, easy.easeFactor], [33, 2.65])
})

test('relearning: Good restores the reduced interval and returns to review', () => {
  const lapsed = schedule(reviewCard(), 1, NOW)
  const back = schedule(lapsed, 3, NOW)
  assert.equal(back.state, 'review')
  assert.equal(back.intervalDays, 1)
})

test('ease never leaves its bounds', () => {
  const floor = schedule(reviewCard({ easeFactor: 1.3 }), 2, NOW)
  assert.equal(floor.easeFactor, 1.3)
  const ceiling = schedule(reviewCard({ easeFactor: 3.5 }), 4, NOW)
  assert.equal(ceiling.easeFactor, 3.5)
})

test('Hard < Good < Easy for every ease and interval', () => {
  for (const easeFactor of [1.3, 1.8, 2.5, 3.0, 3.5]) {
    for (const intervalDays of [1, 2, 3, 5, 10, 30, 100, 365]) {
      const card = reviewCard({ easeFactor, intervalDays })
      const [h, g, e] = ([2, 3, 4] as Rating[]).map((r) => schedule(card, r, NOW).intervalDays)
      assert.ok(h < g && g < e, `ease ${easeFactor}, interval ${intervalDays}: ${h} ${g} ${e}`)
    }
  }
})

test('interval is clamped to the maximum', () => {
  const c = schedule(reviewCard({ intervalDays: 30000 }), 3, NOW)
  assert.equal(c.intervalDays, 36500)
})

test('previewIntervals labels the four buttons', () => {
  assert.deepEqual(previewIntervals(newCardState(NOW), NOW), { 1: '1m', 2: '6m', 3: '10m', 4: '4d' })
  assert.deepEqual(previewIntervals(reviewCard(), NOW), { 1: '10m', 2: '12d', 3: '25d', 4: '1.1mo' })
})

test('formatInterval', () => {
  assert.equal(formatInterval(30_000), '<1m')
  assert.equal(formatInterval(3 * 3_600_000), '3h')
  assert.equal(formatInterval(400 * DAY), '1.1y')
})

test('row mapping round-trips', () => {
  const state = reviewCard({ dueAt: new Date('2026-02-01T00:00:00Z') })
  const row = stateToRow(state, NOW)
  assert.equal(row.due_at, '2026-02-01T00:00:00.000Z')
  assert.deepEqual(stateFromRow({ ...row, ease_factor: '2.50' }), state)
})
