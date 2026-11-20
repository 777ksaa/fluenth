import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { supabaseEnv } from './env'

/** Pages that need a signed-in user. Everything else stays public and cacheable. */
const PROTECTED = ['/dashboard', '/review', '/deck', '/settings', '/tutor']

const isProtected = (pathname: string) => PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`))

/**
 * Refreshes the auth cookies for the routes this proxy runs on and redirects signed-out
 * visitors away from protected pages.
 *
 * Supabase's setAll receives cache headers alongside the cookies. They must be copied onto
 * the response, otherwise a CDN could cache a response that carries Set-Cookie.
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  const { url, key } = supabaseEnv()
  let response = NextResponse.next({ request })

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet, headers?: Record<string, string>) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value)
        response = NextResponse.next({ request })
        for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options)
        for (const [header, value] of Object.entries(headers ?? {})) response.headers.set(header, value)
      },
    },
  })

  // getClaims() verifies the JWT signature; never trust an unverified getSession() on the server.
  const { data } = await supabase.auth.getClaims()
  const signedIn = Boolean(data?.claims)
  const { pathname, search } = request.nextUrl

  if (!signedIn && isProtected(pathname)) {
    const login = request.nextUrl.clone()
    login.pathname = '/login'
    login.search = ''
    login.searchParams.set('next', `${pathname}${search}`)
    const redirect = NextResponse.redirect(login)
    // Carry over any cookies and cache headers set while refreshing.
    for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie)
    for (const name of ['cache-control', 'expires', 'pragma']) {
      const value = response.headers.get(name)
      if (value) redirect.headers.set(name, value)
    }
    return redirect
  }

  return response
}
