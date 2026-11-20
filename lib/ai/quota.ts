import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Atomically counts one AI call against the signed-in user's daily allowance
 * (public.consume_ai_quota). Returns false once AI_DAILY_LIMIT is used up.
 * Call it BEFORE the model request so a burst of parallel requests cannot overspend.
 */
export async function consumeAiQuota(supabase: SupabaseClient): Promise<boolean> {
  const limit = Math.max(1, Number.parseInt(process.env.AI_DAILY_LIMIT ?? '30', 10) || 30)
  const { data, error } = await supabase.rpc('consume_ai_quota', { p_limit: limit })
  return !error && data === true
}
