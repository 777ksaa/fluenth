import type { NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/proxy'

// Next.js 16 renamed middleware.ts to proxy.ts.
export async function proxy(request: NextRequest) {
  return updateSession(request)
}

// Run only where a session matters. Public SEO pages (vocabulary, grammar, dictation, ...)
// are deliberately excluded so they stay statically cached and fast.
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/review/:path*',
    '/deck/:path*',
    '/settings/:path*',
    '/tutor/:path*',
    '/login',
    '/api/tutor',
    '/api/practice',
  ],
}
