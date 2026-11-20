'use client'

import Link from 'next/link'
import { useEffect } from 'react'

export default function WordError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="page py-16 md:py-24">
      <h1 className="title-lg">The dictionary did not answer</h1>
      <p className="lead measure mt-3">
        The word could not be loaded just now. This is usually brief. Try again in a moment.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <button type="button" className="btn btn-primary" onClick={() => reset()}>
          Try again
        </button>
        <Link className="btn btn-quiet" href="/vocabulary">
          Back to the dictionary
        </Link>
      </div>
    </div>
  )
}
