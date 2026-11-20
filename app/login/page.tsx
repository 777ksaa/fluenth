import Link from 'next/link'
import { redirect } from 'next/navigation'
import { LoginForm } from '@/components/login-form'
import { safeNextPath } from '@/lib/core/safe-redirect'
import { pageMetadata } from '@/lib/seo/metadata'
import { getSessionContext } from '@/lib/supabase/server'

export const metadata = pageMetadata({
  title: 'Sign in or create an account',
  description: 'Sign in to keep your saved words, streak and progress in sync across your devices.',
  path: '/login',
  noindex: true,
})

const NOTICES: Record<string, string> = {
  auth: 'That sign-in link did not work or has expired. Sign in again, or request a new link.',
  oauth: 'Google sign-in could not start. Try again, or use your email instead.',
}

type Props = { searchParams: Promise<{ next?: string; error?: string }> }

export default async function LoginPage({ searchParams }: Props) {
  const { next, error } = await searchParams
  const target = safeNextPath(next)

  const { userId } = await getSessionContext()
  if (userId) redirect(target)

  return (
    <div className="page py-12 md:py-20">
      <div className="mx-auto max-w-md">
        <h1 className="title-xl">Sign in</h1>
        <p className="lead mt-3">Your saved words, streak and progress follow you to every device. It is free.</p>
        <div className="mt-8">
          <LoginForm next={target} notice={error ? NOTICES[error] : undefined} />
        </div>
        <p className="hint mt-8">
          By creating an account you agree to the <Link href="/privacy">privacy policy</Link>. You can look up words and use the
          grammar lessons without an account.
        </p>
      </div>
    </div>
  )
}
