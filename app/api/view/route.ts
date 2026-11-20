import { normalizeWord } from '@/lib/core/words'
import { createAdminClient } from '@/lib/supabase/admin'

/** Counts a dictionary page view so the sitemap and the vocabulary index can rank popular words. */
export async function POST(request: Request) {
  let word: unknown
  try {
    word = ((await request.json()) as { word?: unknown }).word
  } catch {
    return new Response(null, { status: 400 })
  }
  const key = normalizeWord(word)
  if (!key) return new Response(null, { status: 400 })

  const admin = createAdminClient()
  if (admin) await admin.rpc('bump_lookup', { p_key: key })
  return new Response(null, { status: 204 })
}
