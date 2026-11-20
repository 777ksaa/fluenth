import { createBrowserClient } from '@supabase/ssr'
import { supabaseEnv } from './env'

/** Browser client. Use only for display-level reads in client components; authorisation is RLS. */
export function createClient() {
  const { url, key } = supabaseEnv()
  return createBrowserClient(url, key)
}
