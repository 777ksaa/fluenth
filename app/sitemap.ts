import type { MetadataRoute } from 'next'
import { DIALOGUES } from '@/content/dialogues'
import { DICTATION_SETS } from '@/content/dictation'
import { GRAMMAR_TOPICS } from '@/content/grammar'
import { TENSE_ORDER } from '@/lib/core/drills'
import { levelSlug } from '@/lib/core/levels'
import { wordToSlug } from '@/lib/core/words'
import { absoluteUrl } from '@/lib/seo/site'
import { CONTENT_LAST_MODIFIED, sitemapWords } from '@/lib/seo/sitemap'

// Regenerated hourly so newly looked-up words enter the sitemap without a redeploy.
export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = CONTENT_LAST_MODIFIED
  const page = (path: string, priority: number, changeFrequency: 'weekly' | 'monthly' | 'yearly' = 'monthly') => ({
    url: absoluteUrl(path),
    lastModified,
    changeFrequency,
    priority,
  })

  const staticPages = [
    page('/', 1, 'weekly'),
    page('/vocabulary', 0.9, 'weekly'),
    page('/grammar', 0.9, 'weekly'),
    page('/dictation', 0.8),
    page('/speaking', 0.8),
    page('/drills', 0.8),
    page('/about', 0.3, 'yearly'),
    page('/privacy', 0.2, 'yearly'),
  ]
  const grammar = GRAMMAR_TOPICS.flatMap((t) => [page(`/grammar/${t.slug}`, 0.8), page(`/grammar/${t.slug}/cheatsheet`, 0.5)])
  const dictation = DICTATION_SETS.map((s) => page(`/dictation/${levelSlug(s.level)}`, 0.7))
  const speaking = DIALOGUES.map((d) => page(`/speaking/${d.slug}`, 0.7))
  const drills = TENSE_ORDER.map((t) => page(`/drills/${t}`, 0.7))

  // Vocabulary URLs carry no lastModified: the content comes from a live source and a made-up
  // date would be worse than none.
  const words = (await sitemapWords()).map((w) => ({
    url: absoluteUrl(`/vocabulary/${wordToSlug(w)}`),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))

  return [...staticPages, ...grammar, ...dictation, ...speaking, ...drills, ...words]
}
