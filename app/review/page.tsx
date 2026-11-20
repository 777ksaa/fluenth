import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { ReviewSession } from '@/components/review-session'
import { formatInterval } from '@/lib/core/sm2'
import { pageMetadata } from '@/lib/seo/metadata'
import { getSessionContext } from '@/lib/supabase/server'
import type { CardRow } from '@/lib/types'

export const metadata = pageMetadata({
  title: 'Review your words',
  description: 'Review the words you saved with spaced repetition.',
  path: '/review',
  noindex: true,
})

const COLUMNS = 'id, word, part_of_speech, definition, example, translation, audio_url, state, learning_step, ease_factor, interval_days, repetitions, lapses, due_at'
const SESSION_SIZE = 30

export default async function ReviewPage() {
  const { supabase, userId } = await getSessionContext()
  if (!userId) redirect('/login?next=/review')

  const nowIso = new Date().toISOString()
  const [due, total, dueCount] = await Promise.all([
    supabase.from('cards').select(COLUMNS).lte('due_at', nowIso).order('due_at', { ascending: true }).limit(SESSION_SIZE),
    supabase.from('cards').select('id', { count: 'exact', head: true }),
    supabase.from('cards').select('id', { count: 'exact', head: true }).lte('due_at', nowIso),
  ])
  const cards = (due.data ?? []) as CardRow[]

  let nextDue: string | null = null
  if (cards.length === 0 && (total.count ?? 0) > 0) {
    const { data } = await supabase.from('cards').select('due_at').order('due_at', { ascending: true }).limit(1).maybeSingle()
    if (data?.due_at) nextDue = formatInterval(new Date(data.due_at).getTime() - Date.now())
  }

  return (
    <div className="page py-8 md:py-12">
      <Breadcrumbs items={[{ name: 'Home', href: '/' }, { name: 'My deck', href: '/deck' }, { name: 'Review' }]} />
      <h1 className="title-xl">Review</h1>

      {cards.length > 0 ? (
        <>
          <p className="lead measure mt-4">
            {dueCount.count ?? cards.length} {(dueCount.count ?? cards.length) === 1 ? 'card is' : 'cards are'} due. Each one comes back just
            before you would forget it.
          </p>
          <div className="measure mt-10">
            <ReviewSession cards={cards} />
          </div>
        </>
      ) : (total.count ?? 0) === 0 ? (
        <div className="mt-6 space-y-4">
          <p className="lead measure">Your deck is empty. Look up a word and press “Save to my deck” to start.</p>
          <Link className="btn btn-primary" href="/vocabulary">
            Open the dictionary
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          <p className="lead measure">Nothing is due right now.{nextDue ? ` The next card is due in ${nextDue}.` : ''}</p>
          <div className="flex flex-wrap gap-3">
            <Link className="btn btn-primary" href="/vocabulary">
              Look up more words
            </Link>
            <Link className="btn btn-quiet" href="/deck">
              See my deck
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
