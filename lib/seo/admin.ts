import 'server-only'
import { createClient } from '@supabase/supabase-js'

/**
 * Service-role client: bypasses RLS. Server only, and only for shared data no user owns
 * (the dictionary cache). Returns null when SUPABASE_SECRET_KEY is not configured so callers
 * can degrade (skip caching) instead of failing the page.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const secret = process.env.SUPABASE_SECRET_KEY
  if (!url || !secret) return null
  return createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } })
}
