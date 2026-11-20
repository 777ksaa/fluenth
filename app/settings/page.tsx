import { redirect } from 'next/navigation'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { SettingsForms } from '@/components/settings-forms'
import { pageMetadata } from '@/lib/seo/metadata'
import { getSessionContext } from '@/lib/supabase/server'
import type { ProfileSummary } from '@/lib/types'

export const metadata = pageMetadata({
  title: 'Settings',
  description: 'Your level, daily goal, time zone and account.',
  path: '/settings',
  noindex: true,
})

const COLUMNS = 'display_name, xp, level, streak_current, last_active_date, timezone, daily_goal_xp, cefr_level, native_lang'

const NOTICES: Record<string, string> = {
  confirm: 'Type the word delete in the box to confirm.',
  delete: 'The account could not be deleted. Try again in a moment.',
}

type Props = { searchParams: Promise<{ error?: string }> }

export default async function SettingsPage({ searchParams }: Props) {
  const { error } = await searchParams
  const { supabase, userId } = await getSessionContext()
  if (!userId) redirect('/login?next=/settings')

  const [profileRes, userRes] = await Promise.all([
    supabase.from('profiles').select(COLUMNS).eq('id', userId).maybeSingle(),
    supabase.auth.getUser(),
  ])
  const profile = profileRes.data as ProfileSummary | null
  if (!profile) redirect('/login?next=/settings')

  return (
    <div className="page py-8 md:py-12">
      <Breadcrumbs items={[{ name: 'Home', href: '/' }, { name: 'Settings' }]} />
      <h1 className="title-xl">Settings</h1>
      <div className="mt-10">
        <SettingsForms profile={profile} email={userRes.data.user?.email ?? null} notice={error ? NOTICES[error] : undefined} />
      </div>
    </div>
  )
}
