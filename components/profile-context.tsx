'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { dateInTimeZone, titleForLevel } from '@/lib/core/gamification'
import { createClient } from '@/lib/supabase/client'
import type { ProfileSummary, XpResult } from '@/lib/types'

type Status = 'loading' | 'guest' | 'user'

interface ProfileContextValue {
  status: Status
  profile: ProfileSummary | null
  /** Feed in the XpResult a server action returned: updates the header and shows a "+15 XP" toast. */
  applyXp: (xp: XpResult | null | undefined) => void
}

const ProfileContext = createContext<ProfileContextValue>({ status: 'loading', profile: null, applyXp: () => {} })

export const useProfile = () => useContext(ProfileContext)

const COLUMNS = 'display_name, xp, level, streak_current, last_active_date, timezone, daily_goal_xp, cefr_level, native_lang'

/**
 * Loads the signed-in learner's profile in the browser, after hydration. This is deliberate:
 * reading the session on the server would make every page dynamic and uncacheable, which is
 * the opposite of what the SEO pages need. The header fills in a moment after the page paints.
 */
export function ProfileProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>('loading')
  const [profile, setProfile] = useState<ProfileSummary | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    let cancelled = false
    let supabase: ReturnType<typeof createClient>
    try {
      supabase = createClient()
    } catch {
      setStatus('guest') // Supabase is not configured: the public pages still work
      return
    }

    async function load() {
      const { data: sessionData } = await supabase.auth.getSession()
      const session = sessionData?.session
      if (!session) {
        if (!cancelled) {
          setProfile(null)
          setStatus('guest')
        }
        return
      }
      const { data } = await supabase.from('profiles').select(COLUMNS).eq('id', session.user.id).maybeSingle()
      if (!cancelled) {
        setProfile((data as ProfileSummary | null) ?? null)
        setStatus('user')
      }
    }

    void load()
    const { data: sub } = supabase.auth.onAuthStateChange((event: string) => {
      // Deferred: calling Supabase from inside this callback can deadlock the auth lock.
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') setTimeout(() => void load(), 0)
    })
    return () => {
      cancelled = true
      sub.subscription.unsubscribe()
    }
  }, [])

  const applyXp = useCallback((xp: XpResult | null | undefined) => {
    if (!xp) return
    setProfile((p) =>
      p
        ? { ...p, xp: xp.total, level: xp.level, streak_current: xp.streak, last_active_date: dateInTimeZone(p.timezone) }
        : p,
    )
    const parts: string[] = []
    if (xp.awarded > 0) parts.push(`+${xp.awarded} XP`)
    if (xp.leveledUp) parts.push(`Level ${xp.level}: ${titleForLevel(xp.level)}`)
    if (parts.length === 0) return
    setToast(parts.join('   '))
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setToast(null), 2600)
  }, [])

  const value = useMemo(() => ({ status, profile, applyXp }), [status, profile, applyXp])

  return (
    <ProfileContext.Provider value={value}>
      {children}
      <div role="status" aria-live="polite" className="toast" data-show={toast ? 'true' : 'false'}>
        {toast}
      </div>
    </ProfileContext.Provider>
  )
}
