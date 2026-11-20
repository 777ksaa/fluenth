'use client'

import Link from 'next/link'
import { useEffect } from 'react'

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Send to your error tracker here (Sentry, Logtail, ...). error.digest matches the server log entry.
    console.error(error)
  }, [error])

  return (
    <div className="page py-16 md:py-24">
      <h1 className="title-lg">This page didn&apos;t load</h1>
      <p className="lead measure mt-3">
        Something failed while loading it. Try again. If it keeps failing, come back in a few minutes.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <button type="button" className="btn btn-primary" onClick={() => reset()}>
          Try again
        </button>
        <Link className="btn btn-quiet" href="/">
          Go to the home page
        </Link>
      </div>
    </div>
  )
}
