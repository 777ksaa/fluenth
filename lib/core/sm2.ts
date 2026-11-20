// Spaced-repetition scheduler: SM-2 with Anki-style learning steps.
//
// Ratings: 1 Again, 2 Hard, 3 Good, 4 Easy.
// Intervals are rolling (now + N days), not snapped to a day boundary.
// Pure functions only: the server action runs schedule() so a client cannot forge a schedule,
// and the review screen calls previewIntervals() to label the four buttons.

export type Rating = 1 | 2 | 3 | 4
export type Phase = 'new' | 'learning' | 'review' | 'relearning'

export interface SrsState {
  state: Phase
  learningStep: number
  easeFactor: number
  intervalDays: number
  repetitions: number
  lapses: number
  dueAt: Date
}

export interface SrsConfig {
  learningStepsMin: number[]
  relearningStepsMin: number[]
  graduatingIntervalDays: number
  easyIntervalDays: number
  startingEase: number
  minEase: number
  maxEase: number
  hardMultiplier: number
  easyBonus: number
  /** New interval after a lapse = old interval * factor (0 = back to the minimum interval). */
  lapseIntervalFactor: number
  minIntervalDays: number
  maxIntervalDays: number
}

export const DEFAULT_SRS_CONFIG: SrsConfig = {
  learningStepsMin: [1, 10],
  relearningStepsMin: [10],
  graduatingIntervalDays: 1,
  easyIntervalDays: 4,
  startingEase: 2.5,
  minEase: 1.3,
  maxEase: 3.5,
  hardMultiplier: 1.2,
  easyBonus: 1.3,
  lapseIntervalFactor: 0,
  minIntervalDays: 1,
  maxIntervalDays: 36500,
}

const MINUTE = 60_000
const DAY = 86_400_000

const round2 = (n: number) => Math.round(n * 100) / 100
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))
const at = (now: Date, ms: number) => new Date(now.getTime() + ms)

export function newCardState(now: Date = new Date(), cfg: SrsConfig = DEFAULT_SRS_CONFIG): SrsState {
  return {
    state: 'new',
    learningStep: 0,
    easeFactor: cfg.startingEase,
    intervalDays: 0,
    repetitions: 0,
    lapses: 0,
    dueAt: now,
  }
}

export function isDue(card: SrsState, now: Date = new Date()): boolean {
  return card.dueAt.getTime() <= now.getTime()
}

function scheduleLearning(
  card: SrsState,
  rating: Rating,
  now: Date,
  stepsIn: number[],
  cfg: SrsConfig,
  relearning: boolean,
): SrsState {
  const steps = stepsIn.length > 0 ? stepsIn : [1]
  const step = card.state === 'new' ? 0 : Math.min(card.learningStep, steps.length - 1)

  const stay = (index: number, delayMin: number): SrsState => ({
    ...card,
    state: relearning ? 'relearning' : 'learning',
    learningStep: index,
    dueAt: at(now, delayMin * MINUTE),
  })

  const graduate = (intervalDays: number): SrsState => {
    const interval = clamp(Math.round(intervalDays), cfg.minIntervalDays, cfg.maxIntervalDays)
    return {
      ...card,
      state: 'review',
      learningStep: 0,
      intervalDays: interval,
      repetitions: card.repetitions + 1,
      dueAt: at(now, interval * DAY),
    }
  }

  // After a lapse the (already reduced) interval is restored on graduation.
  const restored = Math.max(card.intervalDays, cfg.minIntervalDays)

  switch (rating) {
    case 1:
      return stay(0, steps[0])
    case 2: {
      const delay = step === 0 && steps.length > 1 ? (steps[0] + steps[1]) / 2 : steps[step]
      return stay(step, delay)
    }
    case 3: {
      const next = step + 1
      if (next >= steps.length) return graduate(relearning ? restored : cfg.graduatingIntervalDays)
      return stay(next, steps[next])
    }
    case 4:
      return graduate(relearning ? restored : cfg.easyIntervalDays)
  }
}

function scheduleReview(card: SrsState, rating: Rating, now: Date, cfg: SrsConfig): SrsState {
  const current = Math.max(card.intervalDays, 1)
  const ease = card.easeFactor
  const toInterval = (n: number) => clamp(Math.round(n), cfg.minIntervalDays, cfg.maxIntervalDays)

  if (rating === 1) {
    const lapseInterval = toInterval(current * cfg.lapseIntervalFactor)
    const lapsed: SrsState = {
      ...card,
      easeFactor: round2(clamp(ease - 0.2, cfg.minEase, cfg.maxEase)),
      lapses: card.lapses + 1,
      intervalDays: lapseInterval,
      learningStep: 0,
      state: 'relearning',
      dueAt: at(now, (cfg.relearningStepsMin[0] ?? 10) * MINUTE),
    }
    if (cfg.relearningStepsMin.length === 0) {
      return { ...lapsed, state: 'review', dueAt: at(now, lapseInterval * DAY) }
    }
    return lapsed
  }

  const hard = Math.max(current + 1, Math.round(current * cfg.hardMultiplier))
  const good = Math.max(hard + 1, Math.round(current * ease))
  const easy = Math.max(good + 1, Math.round(current * ease * cfg.easyBonus))

  let interval = good
  let nextEase = ease
  if (rating === 2) {
    interval = hard
    nextEase = ease - 0.15
  } else if (rating === 4) {
    interval = easy
    nextEase = ease + 0.15
  }

  const intervalDays = toInterval(interval)
  return {
    ...card,
    state: 'review',
    learningStep: 0,
    easeFactor: round2(clamp(nextEase, cfg.minEase, cfg.maxEase)),
    intervalDays,
    repetitions: card.repetitions + 1,
    dueAt: at(now, intervalDays * DAY),
  }
}

export function schedule(
  card: SrsState,
  rating: Rating,
  now: Date = new Date(),
  cfg: SrsConfig = DEFAULT_SRS_CONFIG,
): SrsState {
  switch (card.state) {
    case 'new':
    case 'learning':
      return scheduleLearning(card, rating, now, cfg.learningStepsMin, cfg, false)
    case 'relearning':
      return scheduleLearning(card, rating, now, cfg.relearningStepsMin, cfg, true)
    case 'review':
      return scheduleReview(card, rating, now, cfg)
  }
}

const trimOne = (n: number) => String(Math.round(n * 10) / 10)

/** "1m", "10m", "3h", "4d", "2.5mo", "1.2y" */
export function formatInterval(ms: number): string {
  const minutes = ms / MINUTE
  if (minutes < 1) return '<1m'
  if (minutes < 60) return `${Math.round(minutes)}m`
  const hours = minutes / 60
  if (hours < 24) return `${Math.round(hours)}h`
  const days = hours / 24
  if (days < 30) return `${Math.round(days)}d`
  if (days < 365) return `${trimOne(days / 30)}mo`
  return `${trimOne(days / 365)}y`
}

/** Labels for the four answer buttons, e.g. { 1: '1m', 2: '6m', 3: '10m', 4: '4d' }. */
export function previewIntervals(
  card: SrsState,
  now: Date = new Date(),
  cfg: SrsConfig = DEFAULT_SRS_CONFIG,
): Record<Rating, string> {
  const label = (rating: Rating) =>
    formatInterval(schedule(card, rating, now, cfg).dueAt.getTime() - now.getTime())
  return { 1: label(1), 2: label(2), 3: label(3), 4: label(4) }
}

// ---- database row mapping (snake_case columns on public.cards) ----

export interface CardSrsRow {
  state: Phase
  learning_step: number
  ease_factor: number | string
  interval_days: number
  repetitions: number
  lapses: number
  due_at: string
}

export function stateFromRow(row: CardSrsRow): SrsState {
  return {
    state: row.state,
    learningStep: row.learning_step,
    easeFactor: Number(row.ease_factor),
    intervalDays: row.interval_days,
    repetitions: row.repetitions,
    lapses: row.lapses,
    dueAt: new Date(row.due_at),
  }
}

export function stateToRow(state: SrsState, now: Date = new Date()) {
  return {
    state: state.state,
    learning_step: state.learningStep,
    ease_factor: state.easeFactor,
    interval_days: state.intervalDays,
    repetitions: state.repetitions,
    lapses: state.lapses,
    due_at: state.dueAt.toISOString(),
    last_reviewed_at: now.toISOString(),
  }
}
