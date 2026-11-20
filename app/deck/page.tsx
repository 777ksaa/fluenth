import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { DeleteCardButton } from '@/components/delete-card-button'
import { formatInterval } from '@/lib/core/sm2'
import { wordToSlug } from '@/lib/core/words'
import { pageMetadata } from '@/lib/seo/metadata'
import { getSessionContext } from '@/lib/supabase/server'
import type { CardRow } from '@/lib/types'

export const metadata = pageMetadata({
  title: 'My words',
  description: 'The words you have saved and when they are due for review.',
  path: '/deck',
  noindex: true,
})

const COLUMNS = 'id, word, part_of_speech, definition, example, translation, audio_url, state, learning_step, ease_factor, interval_days, repetitions, lapses, due_at'
const SHOWN = 100

function status(card: CardRow, now: number): string {
  if (card.state === 'new') return 'New'
  const dueIn = new Date(card.due_at).getTime() - now
  if (dueIn <= 0) return 'Due now'
  return `Due in ${formatInterval(dueIn)}`
}

export default async function DeckPage() {
  const { supabase, userId } = await getSessionContext()
  if (!userId) redirect('/login?next=/deck')

  const nowIso = new Date().toISOString()
  const [list, dueCount] = await Promise.all([
    supabase.from('cards').select(COLUMNS, { count: 'exact' }).order('created_at', { ascending: false }).limit(SHOWN),
    supabase.from('cards').select('id', { count: 'exact', head: true }).lte('due_at', nowIso),
  ])
  const cards = (list.data ?? []) as CardRow[]
  const total = list.count ?? cards.length
  const due = dueCount.count ?? 0
  const now = Date.now()

  return (
    <div className="page py-8 md:py-12">
      <Breadcrumbs items={[{ name: 'Home', href: '/' }, { name: 'My words' }]} />
      <h1 className="title-xl">My words</h1>
      <p className="lead measure mt-4">
        {total} {total === 1 ? 'word' : 'words'} saved, {due} due for review.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        {due > 0 ? (
          <Link className="btn btn-primary" href="/review">
            Review {due} {due === 1 ? 'card' : 'cards'}
          </Link>
        ) : null}
        <Link className="btn btn-quiet" href="/vocabulary">
          Add words
        </Link>
        {total > 0 ? (
          <a className="btn btn-quiet" href="/deck/export" download>
            Export for Anki
          </a>
        ) : null}
      </div>
      {total > 0 ? (
        <p className="hint mt-2">In Anki, choose File, Import, pick the file and tick “Allow HTML in fields”.</p>
      ) : null}

      {cards.length === 0 ? (
        <p className="reading measure mt-12">
          Nothing here yet. Open any word in the <Link href="/vocabulary">dictionary</Link> and press “Save to my deck”.
        </p>
      ) : (
        <ul className="ruled mt-10 max-w-3xl">
          {cards.map((card) => (
            <li key={card.id} className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p>
                  <Link href={`/vocabulary/${encodeURIComponent(wordToSlug(card.word))}`} className="title-sm">
                    {card.word}
                  </Link>{' '}
                  {card.part_of_speech ? <span className="pos">{card.part_of_speech}</span> : null}
                </p>
                <p className="muted mt-1 line-clamp-2">{card.definition}</p>
                <p className="hint mt-1">{status(card, now)}</p>
              </div>
              <DeleteCardButton id={card.id} word={card.word} />
            </li>
          ))}
        </ul>
      )}
      {total > SHOWN ? <p className="hint mt-4">Showing the {SHOWN} newest words. Export to get all {total}.</p> : null}
    </div>
  )
}
