import { NextResponse } from 'next/server'
import { safeNextPath } from '@/lib/core/safe-redirect'
import { siteUrl } from '@/lib/seo/site'
import { createClient } from '@/lib/supabase/server'

/** OAuth (Google) and email-link sign-ins return here with a one-time ?code= to exchange for a session. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = safeNextPath(searchParams.get('next'))

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(`${siteUrl()}${next}`)
  }
  return NextResponse.redirect(`${siteUrl()}/login?error=auth`)
}
