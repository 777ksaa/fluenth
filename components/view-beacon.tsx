'use client'

import { useEffect } from 'react'

/**
 * Counts one view per word per browser session. It is a separate request so the dictionary page
 * itself can stay fully cached; the count only feeds "popular words" and the sitemap order.
 */
export function ViewBeacon({ word }: { word: string }) {
  useEffect(() => {
    const key = `viewed:${word}`
    try {
      if (sessionStorage.getItem(key)) return
      sessionStorage.setItem(key, '1')
    } catch {
      // storage blocked: count the view anyway
    }
    fetch('/api/view', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ word }),
      keepalive: true,
    }).catch(() => {})
  }, [word])
  return null
}
