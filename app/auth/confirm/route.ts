import type { EmailOtpType } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { safeNextPath } from '@/lib/core/safe-redirect'
import { siteUrl } from '@/lib/seo/site'
import { createClient } from '@/lib/supabase/server'

const TYPES: EmailOtpType[] = ['signup', 'invite', 'magiclink', 'recovery', 'email_change', 'email']

/**
 * Target of the confirmation and recovery emails. Point the Supabase email templates at
 *   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/dashboard
 * so the link works even when it is opened in a different browser from the one that signed up.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = safeNextPath(searchParams.get('next'))

  if (tokenHash && type && TYPES.includes(type)) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
    if (!error) return NextResponse.redirect(`${siteUrl()}${next}`)
  }
  return NextResponse.redirect(`${siteUrl()}/login?error=auth`)
}
