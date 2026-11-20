import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { ActivityKind } from '@/lib/core/gamification'
import type { XpResult } from '@/lib/types'

/**
 * Calls public.award_xp, the only path that changes XP, level and streak. The database
 * applies the amounts and the daily caps; the caller just reports what the learner did.
 * Returns null if the call fails, so practice never breaks because scoring did.
 */
export async function awardXp(
  supabase: SupabaseClient,
  kind: ActivityKind,
  ref: string | null,
  score: number | null,
  meta: Record<string, unknown> = {},
): Promise<XpResult | null> {
  const { data, error } = await supabase.rpc('award_xp', { p_kind: kind, p_ref: ref, p_score: score, p_meta: meta })
  if (error || !Array.isArray(data) || data.length === 0) return null
  const row = data[0] as {
    r_xp_awarded: number
    r_xp_total: number
    r_level: number
    r_streak: number
    r_leveled_up: boolean
  }
  return { awarded: row.r_xp_awarded, total: row.r_xp_total, level: row.r_level, streak: row.r_streak, leveledUp: row.r_leveled_up }
}
