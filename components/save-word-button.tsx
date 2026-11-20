'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useTransition } from 'react'
import { saveCard } from '@/lib/actions/cards'
import type { SaveCardInput } from '@/lib/actions/cards'
import { BookmarkIcon, CheckIcon } from './icons'
import { useProfile } from './profile-context'

type Phase = 'idle' | 'saved' | 'duplicate' | 'auth' | 'failed'

/** Adds the word to the learner's spaced-repetition deck. Signed-out visitors are sent to sign in. */
export function SaveWordButton({ card }: { card: SaveCardInput }) {
  const pathname = usePathname()
  const { status, applyXp } = useProfile()
  const [phase, setPhase] = useState<Phase>('idle')
  const [pending, startTransition] = useTransition()

  const signIn = (
    <Link className="btn btn-quiet" href={`/login?next=${encodeURIComponent(pathname)}`}>
      Sign in to save this word
    </Link>
  )

  if (status === 'guest' || phase === 'auth') return signIn

  if (phase === 'saved' || phase === 'duplicate') {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <span className="chip chip-ok">
          <CheckIcon size={14} />
          {phase === 'saved' ? 'Saved to My words' : 'Already in My words'}
        </span>
        <Link href="/deck">Open my deck</Link>
      </div>
    )
  }

  function save() {
    startTransition(async () => {
      const result = await saveCard(card)
      if (result.ok) {
        applyXp(result.xp)
        setPhase(result.duplicate ? 'duplicate' : 'saved')
      } else setPhase(result.error === 'auth' ? 'auth' : 'failed')
    })
  }

  return (
    <div className="space-y-2">
      <button type="button" className="btn btn-primary" onClick={save} disabled={pending}>
        <BookmarkIcon size={18} />
        <span>{pending ? 'Saving…' : 'Save to my deck'}</span>
      </button>
      {phase === 'failed' ? (
        <p role="alert" className="text-sm text-redpen">
          The word was not saved. Try again.
        </p>
      ) : null}
    </div>
  )
}
