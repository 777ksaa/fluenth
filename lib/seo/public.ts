import { createClient } from '@supabase/supabase-js'
import { supabaseEnv } from './env'

/**
 * Anonymous, cookie-free client for reading public tables (dictionary_cache, media_clips)
 * from statically rendered pages. It never carries a user session.
 */
export function createPublicClient() {
  const { url, key } = supabaseEnv()
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
}
