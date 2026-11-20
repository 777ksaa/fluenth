import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { FlameIcon } from '@/components/icons'
import { LevelChip } from '@/components/level-chip'
import { GRAMMAR_TOPICS } from '@/content/grammar'
import { ACTIVITY_LABELS, xpByDay } from '@/lib/core/activity'
import type { ActivityRow } from '@/lib/core/activity'
import { dailyGoalProgress, dateInTimeZone, levelProgress, streakView, titleForLevel } from '@/lib/core/gamification'
import { isLevel, levelSlug } from '@/lib/core/levels'
import { pageMetadata } from '@/lib/seo/metadata'
import { getSessionContext } from '@/lib/supabase/server'
import type { ProfileSummary } from '@/lib/types'

export const metadata = pageMetadata({
  title: 'Your dashboard',
  description: 'Your XP, streak and recent practice.',
  path: '/dashboard',
  noindex: true,
})

const DAYS = 14
const COLUMNS = 'display_name, xp, level, streak_current, last_active_date, timezone, daily_goal_xp, cefr_level, native_lang'

const shortDate = (date: string) =>
  new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`))

export default async function Dashboard() {
  const { supabase, userId } = await getSessionContext()
  if (!userId) redirect('/login?next=/dashboard')

  const nowIso = new Date().toISOString()
  const since = new Date(Date.now() - (DAYS + 1) * 86_400_000).toISOString()
  const [profileRes, activityRes, dueRes, totalRes, grammarRes] = await Promise.all([
    supabase.from('profiles').select(COLUMNS).eq('id', userId).maybeSingle(),
    supabase.from('activities').select('kind, xp_awarded, created_at').gte('created_at', since).order('created_at', { ascending: false }).limit(1000),
    supabase.from('cards').select('id', { count: 'exact', head: true }).lte('due_at', nowIso),
    supabase.from('cards').select('id', { count: 'exact', head: true }),
    supabase.from('grammar_progress').select('topic_slug, completed'),
  ])

  const profile = profileRes.data as ProfileSummary | null
  if (!profile) redirect('/login?next=/dashboard')

  const rows = (activityRes.data ?? []) as ActivityRow[]
  const today = dateInTimeZone(profile.timezone)
  const series = xpByDay(rows, profile.timezone, today, DAYS)
  const todayXp = series[series.length - 1].xp
  const goal = dailyGoalProgress(todayXp, profile.daily_goal_xp)
  const progress = levelProgress(profile.xp)
  const streak = streakView(profile.last_active_date, profile.streak_current, today)
  const due = dueRes.count ?? 0
  const savedCards = totalRes.count ?? 0
  const done = new Set(((grammarRes.data ?? []) as { topic_slug: string; completed: boolean }[]).filter((g) => g.completed).map((g) => g.topic_slug))
  const level = isLevel(profile.cefr_level) ? profile.cefr_level : 'A2'
  const nextTopic = GRAMMAR_TOPICS.find((t) => t.level === level && !done.has(t.slug))
  const peak = Math.max(1, ...series.map((d) => d.xp))
  const weekXp = series.slice(-7).reduce((sum, d) => sum + d.xp, 0)
  const timeFormat = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: profile.timezone })

  return (
    <div className="page py-8 md:py-12">
      <Breadcrumbs items={[{ name: 'Home', href: '/' }, { name: 'Dashboard' }]} />
      <h1 className="title-xl">{profile.display_name ? `Welcome back, ${profile.display_name}` : 'Welcome back'}</h1>
      <p className="lead measure mt-3">
        Level {profile.level}, {titleForLevel(profile.level)}.{' '}
        {streak.state === 'done-today'
          ? `You have practised today. ${streak.count}-day streak.`
          : streak.state === 'at-risk'
            ? `Practise today to keep your ${streak.count}-day streak.`
            : 'Practise today to start a streak.'}
      </p>

      <div className="mt-10 grid gap-10 md:grid-cols-3">
        <section aria-labelledby="streak-heading">
          <h2 id="streak-heading" className="title-sm">
            Streak
          </h2>
          <p className="mt-2 flex items-center gap-2 title-lg">
            <span className={streak.count > 0 ? 'text-redpen' : 'text-muted'}>
              <FlameIcon size={32} />
            </span>
            {streak.count} {streak.count === 1 ? 'day' : 'days'}
          </p>
        </section>

        <section aria-labelledby="goal-heading">
          <h2 id="goal-heading" className="title-sm">
            Today’s goal
          </h2>
          <p className="mt-2 title-lg">
            {todayXp} <span className="muted text-base font-normal">of {profile.daily_goal_xp} XP</span>
          </p>
          <div className="bar mt-3" role="progressbar" aria-label="Daily goal" aria-valuemin={0} aria-valuemax={profile.daily_goal_xp} aria-valuenow={Math.min(todayXp, profile.daily_goal_xp)}>
            <span style={{ width: `${Math.round(goal.fraction * 100)}%` }} />
          </div>
          {goal.reached ? <p className="hint mt-2">Goal reached. Everything else today is a bonus.</p> : null}
        </section>

        <section aria-labelledby="level-heading">
          <h2 id="level-heading" className="title-sm">
            Level {progress.level}
          </h2>
          <p className="mt-2 title-lg">
            {profile.xp.toLocaleString('en')} <span className="muted text-base font-normal">XP</span>
          </p>
          <div className="bar mt-3" role="progressbar" aria-label="Progress to the next level" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress.fraction * 100)}>
            <span style={{ width: `${Math.round(progress.fraction * 100)}%` }} />
          </div>
          <p className="hint mt-2">
            {progress.xpForNextLevel - progress.xpIntoLevel} XP to level {progress.level + 1}
          </p>
        </section>
      </div>

      <section aria-labelledby="next-heading" className="mt-16">
        <h2 id="next-heading" className="title-md">
          What to do next
        </h2>
        <ul className="ruled mt-3 max-w-3xl">
          {due > 0 ? (
            <li>
              <Link href="/review" className="title-sm">
                Review {due} {due === 1 ? 'card' : 'cards'}
              </Link>
              <p className="muted">They are due now, and the best time to review is just before you forget.</p>
            </li>
          ) : null}
          {nextTopic ? (
            <li className="flex items-start gap-3">
              <LevelChip level={nextTopic.level} />
              <div>
                <Link href={`/grammar/${nextTopic.slug}`} className="title-sm">
                  {nextTopic.title}
                </Link>
                <p className="muted">The next {level} grammar lesson you have not passed yet.</p>
              </div>
            </li>
          ) : null}
          <li>
            <Link href={`/dictation/${levelSlug(level)}`} className="title-sm">
              Dictation at level {level}
            </Link>
            <p className="muted">Five sentences to listen to and type.</p>
          </li>
          {savedCards === 0 ? (
            <li>
              <Link href="/vocabulary" className="title-sm">
                Save your first word
              </Link>
              <p className="muted">Look up a word and press “Save to my deck” to start your flashcards.</p>
            </li>
          ) : null}
        </ul>
      </section>

      <section aria-labelledby="chart-heading" className="mt-16">
        <h2 id="chart-heading" className="title-md">
          Last {DAYS} days
        </h2>
        <p className="muted mt-1">{weekXp} XP in the last 7 days.</p>
        <div role="img" aria-label={`XP per day for the last ${DAYS} days. Most in one day: ${peak} XP.`} className="mt-4 max-w-3xl">
          <ol className="flex h-32 items-end gap-1.5">
            {series.map((d, i) => (
              <li key={d.date} className="flex h-full flex-1 items-end" title={`${shortDate(d.date)}: ${d.xp} XP`}>
                <span
                  className={`block w-full rounded-t ${i === series.length - 1 ? 'bg-pen' : 'bg-pen/40'}`}
                  style={{ height: d.xp === 0 ? '2px' : `${Math.max(6, (d.xp / peak) * 100)}%` }}
                />
              </li>
            ))}
          </ol>
          <div className="mt-2 flex justify-between text-xs text-muted">
            <span>{shortDate(series[0].date)}</span>
            <span>Today</span>
          </div>
        </div>
      </section>

      <section aria-labelledby="recent-heading" className="mt-16">
        <h2 id="recent-heading" className="title-md">
          Recent practice
        </h2>
        {rows.length === 0 ? (
          <p className="muted mt-3">Nothing yet. Try a <Link href="/dictation">dictation</Link> or a <Link href="/grammar">grammar quiz</Link>.</p>
        ) : (
          <ul className="ruled mt-3 max-w-3xl">
            {rows.slice(0, 8).map((row, i) => (
              <li key={`${row.created_at}-${i}`} className="flex items-baseline justify-between gap-4">
                <span>{ACTIVITY_LABELS[row.kind]}</span>
                <span className="muted text-sm">
                  {row.xp_awarded > 0 ? `+${row.xp_awarded} XP, ` : ''}
                  {timeFormat.format(new Date(row.created_at))}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="hint mt-12">
        Grammar topics passed: {done.size} of {GRAMMAR_TOPICS.length}. Words saved: {savedCards}. <Link href="/settings">Change your goal or level</Link>
      </p>
    </div>
  )
}
