import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { supabaseEnv } from './env'

/**
 * Per-request client that acts as the signed-in user (RLS applies).
 * Reading cookies makes a route dynamic, so never call this from public SEO pages:
 * use createPublicClient() there so the HTML stays cacheable and one visitor's session
 * can never be served to another.
 */
export async function createClient() {
  const cookieStore = await cookies()
  const { url, key } = supabaseEnv()

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) cookieStore.set(name, value, options)
        } catch {
          // Called from a Server Component, where cookies are read-only.
          // proxy.ts refreshes the session for the routes that need it.
        }
      },
    },
  })
}

/**
 * A request-scoped client plus the signed-in user's id, verified from the JWT signature
 * (null when signed out). Server actions use this so one client serves auth and queries.
 */
export async function getSessionContext() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  return { supabase, userId: data?.claims?.sub ?? null }
}
