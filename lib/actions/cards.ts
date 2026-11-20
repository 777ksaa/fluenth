'use server'

import { revalidatePath } from 'next/cache'
import { safeHttpsUrl } from '@/lib/core/dictionary'
import { schedule, stateFromRow, stateToRow } from '@/lib/core/sm2'
import type { CardSrsRow, Rating } from '@/lib/core/sm2'
import { normalizeWord } from '@/lib/core/words'
import { getSessionContext } from '@/lib/supabase/server'
import type { ActionResult, XpResult } from '@/lib/types'
import { awardXp } from './xp'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const clip = (value: unknown, max: number): string | null => {
  if (typeof value !== 'string') return null
  const s = value.replace(/\s+/g, ' ').trim()
  return s.length > 0 ? s.slice(0, max) : null
}

export interface SaveCardInput {
  word: string
  partOfSpeech?: string
  definition: string
  example?: string
  translation?: string
  audioUrl?: string
}

/** Adds a word to the learner's default deck. Saving the same word and part of speech twice is a no-op. */
export async function saveCard(input: SaveCardInput): Promise<ActionResult<{ duplicate: boolean; xp: XpResult | null }>> {
  const word = normalizeWord(input.word)
  const definition = clip(input.definition, 600)
  if (!word || !definition) return { ok: false, error: 'invalid' }

  const { supabase, userId } = await getSessionContext()
  if (!userId) return { ok: false, error: 'auth' }

  const { data: deck } = await supabase.from('decks').select('id').eq('is_default', true).maybeSingle()
  if (!deck) return { ok: false, error: 'failed' }

  const { error } = await supabase.from('cards').insert({
    user_id: userId,
    deck_id: deck.id,
    word,
    part_of_speech: clip(input.partOfSpeech, 40),
    definition,
    example: clip(input.example, 400),
    translation: clip(input.translation, 200),
    audio_url: safeHttpsUrl(input.audioUrl) ?? null,
    source: 'lookup',
  })

  if (error?.code === '23505') return { ok: true, duplicate: true, xp: null }
  if (error) return { ok: false, error: 'failed' }

  const xp = await awardXp(supabase, 'lookup', word, null)
  revalidatePath('/deck')
  return { ok: true, duplicate: false, xp }
}

/** Applies a rating. The schedule is computed here, so a tampered client cannot forge one. */
export async function reviewCard(
  cardId: string,
  rating: number,
): Promise<ActionResult<{ dueAt: string; intervalDays: number; xp: XpResult | null }>> {
  if (!UUID.test(cardId) || ![1, 2, 3, 4].includes(rating)) return { ok: false, error: 'invalid' }

  const { supabase, userId } = await getSessionContext()
  if (!userId) return { ok: false, error: 'auth' }

  const { data: row } = await supabase
    .from('cards')
    .select('state, learning_step, ease_factor, interval_days, repetitions, lapses, due_at')
    .eq('id', cardId)
    .maybeSingle()
  if (!row) return { ok: false, error: 'invalid' }

  const before = stateFromRow(row as CardSrsRow)
  const now = new Date()
  const after = schedule(before, rating as Rating, now)

  const [update, , xp] = await Promise.all([
    supabase.from('cards').update(stateToRow(after, now)).eq('id', cardId),
    supabase.from('review_logs').insert({
      user_id: userId,
      card_id: cardId,
      rating,
      state_before: before.state,
      interval_before: before.intervalDays,
      interval_after: after.intervalDays,
      ease_after: after.easeFactor,
    }),
    awardXp(supabase, 'review', null, null),
  ])
  if (update.error) return { ok: false, error: 'failed' }

  return { ok: true, dueAt: after.dueAt.toISOString(), intervalDays: after.intervalDays, xp }
}

export async function deleteCard(cardId: string): Promise<ActionResult> {
  if (!UUID.test(cardId)) return { ok: false, error: 'invalid' }
  const { supabase, userId } = await getSessionContext()
  if (!userId) return { ok: false, error: 'auth' }
  const { error } = await supabase.from('cards').delete().eq('id', cardId)
  if (error) return { ok: false, error: 'failed' }
  revalidatePath('/deck')
  return { ok: true }
}
