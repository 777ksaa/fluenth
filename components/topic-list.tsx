'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CheckIcon } from './icons'
import { useProfile } from './profile-context'

export interface TopicListItem {
  slug: string
  title: string
  summary: string
}

type Progress = Record<string, { best: number; completed: boolean }>

/**
 * The lessons of one level. The links are in the server-rendered HTML for crawlers; a signed-in
 * learner's progress (best score, done mark) is added afterwards from their synced account.
 */
export function TopicList({ topics }: { topics: TopicListItem[] }) {
  const { status } = useProfile()
  const [progress, setProgress] = useState<Progress>({})

  useEffect(() => {
    if (status !== 'user') return
    let cancelled = false
    void (async () => {
      try {
        const { data } = await createClient().from('grammar_progress').select('topic_slug, best_score, completed')
        if (cancelled || !data) return
        const next: Progress = {}
        for (const row of data as { topic_slug: string; best_score: number | string; completed: boolean }[]) {
          next[row.topic_slug] = { best: Math.round(Number(row.best_score)), completed: row.completed }
        }
        setProgress(next)
      } catch {
        // Progress marks are optional; the list works without them.
      }
    })()
    return () => {
      cancelled = true
    }
  }, [status])

  return (
    <ul className="ruled mt-4">
      {topics.map((t) => {
        const p = progress[t.slug]
        return (
          <li key={t.slug} className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <Link href={`/grammar/${t.slug}`} className="title-sm">
                {t.title}
              </Link>
              <p className="muted mt-1 max-w-2xl text-sm">{t.summary}</p>
            </div>
            {p ? (
              <span className={`chip shrink-0 ${p.completed ? 'chip-ok' : ''}`}>
                {p.completed ? <CheckIcon size={14} /> : null}
                {p.completed ? 'Done' : `Best ${p.best}%`}
              </span>
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}
