'use client'

import Link from 'next/link'
import { dateInTimeZone, streakView } from '@/lib/core/gamification'
import { FlameIcon } from './icons'
import { useProfile } from './profile-context'

export function UserChip() {
  const { status, profile } = useProfile()

  // Reserve the space so the header does not jump when the profile arrives.
  if (status === 'loading') return <span className="inline-block h-9 w-24" aria-hidden="true" />

  if (status === 'guest' || !profile) {
    return (
      <Link href="/login" className="btn btn-quiet btn-sm">
        Sign in
      </Link>
    )
  }

  const streak = streakView(profile.last_active_date, profile.streak_current, dateInTimeZone(profile.timezone))
  const hint =
    streak.state === 'at-risk' ? 'Practise today to keep your streak.' : streak.state === 'done-today' ? 'Streak safe for today.' : ''

  return (
    <Link
      href="/dashboard"
      className="userchip"
      title={hint}
      aria-label={`Dashboard. ${streak.count}-day streak, level ${profile.level}.`}
    >
      <span data-state={streak.state} className="inline-flex items-center gap-1">
        <FlameIcon size={16} />
        {streak.count}
      </span>
      <span>Lv {profile.level}</span>
    </Link>
  )
}
