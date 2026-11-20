'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { deleteCard } from '@/lib/actions/cards'

/** Two steps, so a stray tap does not remove a word you have been learning for weeks. */
export function DeleteCardButton({ id, word }: { id: string; word: string }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [failed, setFailed] = useState(false)
  const [pending, startTransition] = useTransition()

  function remove() {
    startTransition(async () => {
      const result = await deleteCard(id)
      if (result.ok) router.refresh()
      else {
        setFailed(true)
        setConfirming(false)
      }
    })
  }

  if (!confirming) {
    return (
      <div>
        <button type="button" className="btn btn-quiet btn-sm" onClick={() => setConfirming(true)} aria-label={`Delete ${word}`}>
          Delete
        </button>
        {failed ? (
          <p role="alert" className="mt-1 text-xs text-redpen">
            Not deleted. Try again.
          </p>
        ) : null}
      </div>
    )
  }
  return (
    <div className="flex gap-2">
      <button type="button" className="btn btn-danger btn-sm" onClick={remove} disabled={pending}>
        {pending ? 'Deleting…' : `Delete ${word}`}
      </button>
      <button type="button" className="btn btn-quiet btn-sm" onClick={() => setConfirming(false)} disabled={pending}>
        Cancel
      </button>
    </div>
  )
}
