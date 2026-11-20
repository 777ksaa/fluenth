import 'server-only'
import { SEED_WORDS } from '@/content/seed-words'
import { popularWords } from '@/lib/dictionary/lookup'

/**
 * Bump this date when lesson content changes. Search engines use <lastmod> only when it is
 * trustworthy, so it is a fixed value, not "now".
 */
export const CONTENT_LAST_MODIFIED = new Date('2026-11-17')

const PAGE = 1000 // PostgREST returns at most 1,000 rows per request by default
const MAX_WORDS = 45_000 // one sitemap file may hold 50,000 URLs; see docs/SEO.md for splitting

/** Seed words first, then every indexable word learners have looked up, most popular first. */
export async function sitemapWords(): Promise<string[]> {
  const words = new Set<string>(SEED_WORDS)
  for (let offset = 0; words.size < MAX_WORDS; offset += PAGE) {
    const batch = await popularWords(PAGE, offset)
    for (const w of batch) words.add(w)
    if (batch.length < PAGE) break
  }
  return [...words].slice(0, MAX_WORDS)
}
