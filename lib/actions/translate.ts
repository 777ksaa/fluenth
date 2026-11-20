'use server'

import { complete, models, AiUnavailableError } from '@/lib/ai/anthropic'
import { parseTranslation } from '@/lib/ai/parse'
import { translateSystem } from '@/lib/ai/prompts'
import { consumeAiQuota } from '@/lib/ai/quota'
import { isSupportedLang } from '@/lib/core/languages'
import { normalizeWord } from '@/lib/core/words'
import { lookupWord } from '@/lib/dictionary/lookup'
import type { Enrichment } from '@/lib/dictionary/lookup'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSessionContext } from '@/lib/supabase/server'
import type { ActionResult } from '@/lib/types'

/**
 * Translates a dictionary entry into the learner's language. Results are cached in Postgres and
 * shared, so each word is translated once per language no matter how many learners ask.
 * Only cache misses need a signed-in user, and they count against the daily AI allowance.
 */
export async function translateEntry(
  rawWord: string,
  lang: string,
): Promise<ActionResult<{ translation: string; example?: string; cached: boolean }>> {
  const word = normalizeWord(rawWord)
  if (!word || !isSupportedLang(lang)) return { ok: false, error: 'invalid' }

  const found = await lookupWord(word)
  if (found.status !== 'found') return { ok: false, error: 'invalid' }

  const hit = found.enrichment[lang]
  if (hit?.translation) return { ok: true, translation: hit.translation, example: hit.example, cached: true }

  const { supabase, userId } = await getSessionContext()
  if (!userId) return { ok: false, error: 'auth' }
  if (!(await consumeAiQuota(supabase))) return { ok: false, error: 'limit' }

  const first = found.entry.meanings[0]
  const definition = first?.definitions[0]
  if (!first || !definition) return { ok: false, error: 'invalid' }

  let parsed
  try {
    const text = await complete({
      model: models.fast(),
      system: translateSystem(lang),
      maxTokens: 300,
      messages: [
        {
          role: 'user',
          content: JSON.stringify({
            word,
            partOfSpeech: first.partOfSpeech,
            definition: definition.definition,
            ...(definition.example ? { example: definition.example } : {}),
          }),
        },
      ],
    })
    parsed = parseTranslation(text)
  } catch (error) {
    return { ok: false, error: 'failed', message: error instanceof AiUnavailableError ? error.message : undefined }
  }
  if (!parsed) return { ok: false, error: 'failed' }

  const admin = createAdminClient()
  if (admin) {
    const merged: Enrichment = { ...found.enrichment, [lang]: parsed }
    await admin.from('dictionary_cache').update({ enrichment: merged }).eq('word_key', word)
  }
  return { ok: true, translation: parsed.translation, example: parsed.example, cached: false }
}
