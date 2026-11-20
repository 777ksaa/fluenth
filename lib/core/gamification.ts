// XP, levels and streaks. The database function public.award_xp() is the source of truth
// for what is awarded; this file mirrors the level formula for display and holds the
// day-boundary helpers. Keep the two in sync (see level_for_xp in 0001_init.sql).

export const XP_AWARDS = {
  review: { perAction: 2, dailyCap: 200 },
  quiz: { perAction: 20, dailyCap: 300 },
  dictation: { perAction: 15, dailyCap: 300 },
  speaking: { perAction: 10, dailyCap: 200 },
  drill: { perAction: 15, dailyCap: 300 },
  dialogue: { perAction: 15, dailyCap: 200 },
  lookup: { perAction: 1, dailyCap: 20 },
  tutor: { perAction: 2, dailyCap: 40 },
} as const

export type ActivityKind = keyof typeof XP_AWARDS

export const ACTIVITY_KINDS = Object.keys(XP_AWARDS) as ActivityKind[]

const LEVEL_UNIT = 50

/** Level n begins at 50 * (n - 1)^2 XP. */
export function xpForLevel(level: number): number {
  const n = Math.max(1, Math.floor(level))
  return LEVEL_UNIT * (n - 1) * (n - 1)
}

export function levelForXp(xp: number): number {
  return Math.floor(Math.sqrt(Math.max(0, xp) / LEVEL_UNIT)) + 1
}

export interface LevelProgress {
  level: number
  xpIntoLevel: number
  xpForNextLevel: number
  /** 0..1 */
  fraction: number
}

export function levelProgress(xp: number): LevelProgress {
  const total = Math.max(0, Math.floor(xp))
  const level = levelForXp(total)
  const start = xpForLevel(level)
  const span = xpForLevel(level + 1) - start
  const into = total - start
  return { level, xpIntoLevel: into, xpForNextLevel: span, fraction: span === 0 ? 0 : into / span }
}

// ---- days and streaks ----------------------------------------------------

/** Calendar date (YYYY-MM-DD) of `now` in an IANA time zone. Falls back to UTC for unknown zones. */
export function dateInTimeZone(timeZone: string, now: Date = new Date()): string {
  const make = (tz: string) => new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' })
  try {
    return make(timeZone).format(now)
  } catch {
    return make('UTC').format(now)
  }
}

export function daysBetween(fromDate: string, toDate: string): number {
  const ms = (d: string) => {
    const [y, m, day] = d.split('-').map(Number)
    return Date.UTC(y, m - 1, day)
  }
  return Math.round((ms(toDate) - ms(fromDate)) / 86_400_000)
}

export type StreakState = 'none' | 'done-today' | 'at-risk' | 'lost'

export interface StreakView {
  state: StreakState
  /** The number to display: 0 once the streak is lost. */
  count: number
}

/**
 * done-today: practised today.  at-risk: practised yesterday, nothing yet today (still alive).
 * lost: the last practice was two or more days ago, so the stored count is stale.
 */
export function streakView(lastActiveDate: string | null, storedStreak: number, today: string): StreakView {
  if (!lastActiveDate || storedStreak <= 0) return { state: 'none', count: 0 }
  const gap = daysBetween(lastActiveDate, today)
  if (gap <= 0) return { state: 'done-today', count: storedStreak }
  if (gap === 1) return { state: 'at-risk', count: storedStreak }
  return { state: 'lost', count: 0 }
}

export function dailyGoalProgress(xpToday: number, goal: number): { fraction: number; reached: boolean } {
  const safeGoal = Math.max(1, goal)
  return { fraction: Math.min(1, Math.max(0, xpToday) / safeGoal), reached: xpToday >= safeGoal }
}

export const LEVEL_TITLES = [
  'Newcomer',
  'Explorer',
  'Learner',
  'Speaker',
  'Conversationalist',
  'Storyteller',
  'Debater',
  'Wordsmith',
  'Polyglot',
  'Master',
] as const

export function titleForLevel(level: number): string {
  const index = Math.min(LEVEL_TITLES.length - 1, Math.max(0, Math.floor((level - 1) / 3)))
  return LEVEL_TITLES[index]
}
