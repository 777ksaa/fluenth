'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { reviewCard } from '@/lib/actions/cards'
import { splitHighlight } from '@/lib/core/highlight'
import { previewIntervals, schedule, stateFromRow } from '@/lib/core/sm2'
import type { Rating, SrsState } from '@/lib/core/sm2'
import type { CardRow } from '@/lib/types'
import { useProfile } from './profile-context'
import { SpeakButton } from './speak-button'

interface Entry {
  card: CardRow
  state: SrsState
}

const SESSION_WINDOW_MS = 20 * 60_000 // a card due again within this long is shown again in the same session
const IMMEDIATE_MS = 60_000

const RATINGS: { rating: Rating; label: string; className: string }[] = [
  { rating: 1, label: 'Again', className: 'btn btn-danger' },
  { rating: 2, label: 'Hard', className: 'btn btn-quiet' },
  { rating: 3, label: 'Good', className: 'btn btn-primary' },
  { rating: 4, label: 'Easy', className: 'btn btn-quiet' },
]

export function ReviewSession({ cards }: { cards: CardRow[] }) {
  const { applyXp } = useProfile()
  const [queue, setQueue] = useState<Entry[]>(() => cards.map((card) => ({ card, state: stateFromRow(card) })))
  const [revealed, setRevealed] = useState(false)
  const [tally, setTally] = useState({ reviewed: 0, remembered: 0 })
  const [saveFailed, setSaveFailed] = useState(false)
  // Ratings are saved one after another: the server schedules from the stored state, so order matters.
  const saving = useRef<Promise<unknown>>(Promise.resolve())

  const current = queue[0]
  const labels = useMemo(() => (current ? previewIntervals(current.state, new Date()) : null), [current])

  function rate(rating: Rating) {
    if (!current) return
    const now = new Date()
    const next = schedule(current.state, rating, now)
    const dueIn = next.dueAt.getTime() - now.getTime()
    const cardId = current.card.id

    saving.current = saving.current.then(async () => {
      const result = await reviewCard(cardId, rating)
      if (result.ok) applyXp(result.xp)
      else setSaveFailed(true)
    })
    setTally((t) => ({ reviewed: t.reviewed + 1, remembered: t.remembered + (rating >= 3 ? 1 : 0) }))
    setQueue((q) => {
      const [head, ...rest] = q
      const again = dueIn <= SESSION_WINDOW_MS && (rest.length > 0 || dueIn <= IMMEDIATE_MS)
      return again ? [...rest, { card: head.card, state: next }] : rest
    })
    setRevealed(false)
  }

  // Keyboard: space or Enter reveals, 1 to 4 rates.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable)) return
      if (event.metaKey || event.ctrlKey || event.altKey) return
      if (!revealed && (event.key === ' ' || event.key === 'Enter') && current) {
        event.preventDefault()
        setRevealed(true)
      } else if (revealed && ['1', '2', '3', '4'].includes(event.key)) {
        event.preventDefault()
        rate(Number(event.key) as Rating)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (!current) {
    const percent = tally.reviewed > 0 ? Math.round((tally.remembered / tally.reviewed) * 100) : 0
    return (
      <div role="status" className="panel space-y-3">
        <p className="title-md">Session complete</p>
        <p>
          You reviewed {tally.reviewed} {tally.reviewed === 1 ? 'card' : 'cards'} and remembered {percent}% of them.
        </p>
        {saveFailed ? <p className="text-sm text-redpen">Some answers could not be saved, so those cards keep their old schedule.</p> : null}
        <div className="flex flex-wrap gap-3">
          <a className="btn btn-primary" href="/review">
            Check for more cards
          </a>
          <Link className="btn btn-quiet" href="/deck">
            Back to my deck
          </Link>
        </div>
      </div>
    )
  }

  const { card } = current
  return (
    <div className="space-y-6">
      <p className="text-sm font-semibold" aria-live="polite">
        {queue.length} {queue.length === 1 ? 'card' : 'cards'} left
      </p>

      <div className="index-card min-h-[16rem]">
        <div className="flex flex-wrap items-center gap-3">
          <p className="title-xl">{card.word}</p>
          <SpeakButton text={card.word} audioUrl={card.audio_url ?? undefined} label={`Listen to ${card.word}`} />
        </div>
        {card.part_of_speech ? <p className="pos mt-1">{card.part_of_speech}</p> : null}

        {revealed ? (
          <div className="mt-6 space-y-3 border-t border-rule pt-4">
            <p className="reading">{card.definition}</p>
            {card.example ? (
              <p className="reading muted italic">
                “{splitHighlight(card.example, card.word).map((part, i) => (part.match ? <mark key={i}>{part.text}</mark> : <span key={i}>{part.text}</span>))}”
              </p>
            ) : null}
            {card.translation ? <p className="font-semibold">{card.translation}</p> : null}
          </div>
        ) : null}
      </div>

      {revealed && labels ? (
        <div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4" role="group" aria-label="How well did you remember it?">
            {RATINGS.map(({ rating, label, className }) => (
              <button key={rating} type="button" className={`${className} h-auto flex-col py-2`} onClick={() => rate(rating)}>
                <span>{label}</span>
                <span className="text-xs font-normal opacity-80">{labels[rating]}</span>
              </button>
            ))}
          </div>
          <p className="hint mt-2">Keys: 1 Again, 2 Hard, 3 Good, 4 Easy.</p>
        </div>
      ) : (
        <div>
          <button type="button" className="btn btn-primary" onClick={() => setRevealed(true)}>
            Show the answer
          </button>
          <p className="hint mt-2">Say the meaning in your head first. Space also shows the answer.</p>
        </div>
      )}
    </div>
  )
}
