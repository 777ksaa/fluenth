// Turns the activity log into what the dashboard shows. Pure functions, so day boundaries in
// the learner's own time zone are covered by tests.

import { dateInTimeZone } from './gamification'
import type { ActivityKind } from './gamification'

export interface ActivityRow {
  kind: ActivityKind
  xp_awarded: number
  created_at: string
}

export const ACTIVITY_LABELS: Record<ActivityKind, string> = {
  review: 'Flashcard review',
  quiz: 'Grammar quiz',
  dictation: 'Dictation',
  speaking: 'Speaking',
  drill: 'Tense drill',
  dialogue: 'Dialogue',
  lookup: 'Saved a word',
  tutor: 'Tutor and practice',
}

/** "2026-11-30" plus 1 is "2026-12-01". Works on calendar dates, so daylight saving cannot shift it. */
export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

/** XP per calendar day (in `timeZone`) for the `days` days ending today, oldest first. Empty days are 0. */
export function xpByDay(rows: ActivityRow[], timeZone: string, today: string, days: number): { date: string; xp: number }[] {
  const totals = new Map<string, number>()
  for (const row of rows) {
    const date = dateInTimeZone(timeZone, new Date(row.created_at))
    totals.set(date, (totals.get(date) ?? 0) + row.xp_awarded)
  }
  return Array.from({ length: days }, (_, i) => {
    const date = addDays(today, i - (days - 1))
    return { date, xp: totals.get(date) ?? 0 }
  })
}
