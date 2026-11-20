'use client'

import { useSearchParams } from 'next/navigation'

/** Shown after an account is deleted (the action redirects to /?deleted=1). Read on the client so the home page stays static. */
export function DeletedNotice() {
  const params = useSearchParams()
  if (params.get('deleted') !== '1') return null
  return (
    <p role="status" className="panel mb-8 max-w-xl">
      Your account and everything saved in it have been deleted.
    </p>
  )
}
