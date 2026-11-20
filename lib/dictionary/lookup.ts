import 'server-only'
import { cache } from 'react'
import { allAntonyms, allSynonyms, isIndexable, normalizeApiResponse } from '@/lib/core/dictionary'
import type { DictionaryEntry } from '@/lib/core/dictionary'
import { createAdminClient } from '@/lib/supabase/admin'
import { createPublicClient } from '@/lib/supabase/public'
import { fetchRelatedWords } from './datamuse'

const UPSTREAM = 'https://api.dictionaryapi.dev/api/v2/entries/en/'
const FOUND_TTL_MS = 30 * 24 * 3_600_000
const MISSING_TTL_MS = 24 * 3_600_000

/** { ru: { translation: "...", example: "..." } } filled lazily by the translate action. */
export type Enrichment = Record<string, { translation?: string; example?: string }>

export type Lookup =
  | { status: 'found'; word: string; entry: DictionaryEntry; indexable: boolean; enrichment: Enrichment }
  | { status: 'not-found' }
  | { status: 'unavailable' }

interface CacheRow {
  found: boolean
  entry: DictionaryEntry | null
  indexable: boolean
  enrichment: Enrichment | null
  fetched_at: string
}

async function readCache(key: string): Promise<CacheRow | null> {
  try {
    const { data } = await createPublicClient()
      .from('dictionary_cache')
      .select('found, entry, indexable, enrichment, fetched_at')
      .eq('word_key', key)
      .maybeSingle()
    return (data as CacheRow | null) ?? null
  } catch {
    return null // Supabase not configured or unreachable: fall through to the upstream.
  }
}

async function writeCache(key: string, found: boolean, entry: DictionaryEntry | null, indexable: boolean) {
  const admin = createAdminClient()
  if (!admin) return
  try {
    await admin.from('dictionary_cache').upsert(
      { word_key: key, found, entry, indexable, fetched_at: new Date().toISOString() },
      { onConflict: 'word_key' },
    )
  } catch {
    // A failed cache write must never fail the page.
  }
}

type Upstream = { kind: 'found'; entry: DictionaryEntry } | { kind: 'missing' } | { kind: 'error' }

async function fetchUpstream(key: string): Promise<Upstream> {
  try {
    const res = await fetch(`${UPSTREAM}${encodeURIComponent(key)}`, {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(6000),
      cache: 'no-store',
    })
    if (res.status === 404) return { kind: 'missing' }
    if (!res.ok) return { kind: 'error' }
    const entry = normalizeApiResponse(await res.json(), key)
    return entry ? { kind: 'found', entry } : { kind: 'missing' }
  } catch {
    return { kind: 'error' }
  }
}

const fromRow = (key: string, row: CacheRow): Lookup =>
  row.found && row.entry
    ? { status: 'found', word: key, entry: row.entry, indexable: row.indexable, enrichment: row.enrichment ?? {} }
    : { status: 'not-found' }

/**
 * Cache-first lookup: Postgres, then dictionaryapi.dev. Deduplicated per request with
 * React.cache, so generateMetadata and the page share one lookup.
 *
 * `key` must already be normalised with normalizeWord().
 */
export const lookupWord = cache(async (key: string): Promise<Lookup> => {
  const cached = await readCache(key)
  const age = cached ? Date.now() - new Date(cached.fetched_at).getTime() : Infinity
  if (cached && age < (cached.found ? FOUND_TTL_MS : MISSING_TTL_MS)) return fromRow(key, cached)

  const upstream = await fetchUpstream(key)

  if (upstream.kind === 'error') {
    // Serve stale data rather than an error page if we have any.
    return cached ? fromRow(key, cached) : { status: 'unavailable' }
  }

  if (upstream.kind === 'missing') {
    await writeCache(key, false, null, false)
    return { status: 'not-found' }
  }

  const entry = upstream.entry
  if (allSynonyms(entry, 1).length === 0 || allAntonyms(entry, 1).length === 0) {
    const related = await fetchRelatedWords(key)
    if (related.synonyms.length > 0 || related.antonyms.length > 0) entry.related = related
  }
  const indexable = isIndexable(entry)
  await writeCache(key, true, entry, indexable)
  return { status: 'found', word: key, entry, indexable, enrichment: cached?.enrichment ?? {} }
})

/** Most-looked-up indexable words, for the sitemap and the vocabulary index. */
export async function popularWords(limit: number, offset = 0): Promise<string[]> {
  try {
    const { data } = await createPublicClient()
      .from('dictionary_cache')
      .select('word_key')
      .eq('found', true)
      .eq('indexable', true)
      .order('lookup_count', { ascending: false })
      .order('word_key', { ascending: true })
      .range(offset, offset + limit - 1)
    return ((data ?? []) as { word_key: string }[]).map((r) => r.word_key)
  } catch {
    return []
  }
}

export async function countIndexableWords(): Promise<number> {
  try {
    const { count } = await createPublicClient()
      .from('dictionary_cache')
      .select('word_key', { count: 'exact', head: true })
      .eq('found', true)
      .eq('indexable', true)
    return count ?? 0
  } catch {
    return 0
  }
}
