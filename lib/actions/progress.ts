'use server'

import { getDialogue } from '@/content/dialogues'
import { getDictationSet } from '@/content/dictation'
import { getTopic } from '@/content/grammar'
import { diffWords } from '@/lib/core/diff'
import { isTense } from '@/lib/core/drills'
import { levelFromSlug } from '@/lib/core/levels'
import { gradeQuiz } from '@/lib/core/quiz'
import type { QuizAnswer } from '@/lib/core/quiz'
import { scoreSpeaking } from '@/lib/core/speaking'
import type { SpeakingVerdict } from '@/lib/core/speaking'
import { getSessionContext } from '@/lib/supabase/server'
import type { ActionResult, XpResult } from '@/lib/types'
import { awardXp } from './xp'

// Each action recomputes the score on the server from content it owns, then records it.
// The browser also scores locally so feedback is instant and works for signed-out visitors;
// these actions are what make the saved progress and XP trustworthy.

export async function submitQuiz(
  slug: string,
  answers: QuizAnswer[],
): Promise<ActionResult<{ score: number; passed: boolean; best: number; xp: XpResult | null }>> {
  const topic = getTopic(slug)
  if (!topic || !Array.isArray(answers) || answers.length > 20) return { ok: false, error: 'invalid' }
  const cleaned = answers.map((a) => (typeof a === 'number' || a === null ? a : typeof a === 'string' ? a.slice(0, 100) : null))

  const { supabase, userId } = await getSessionContext()
  if (!userId) return { ok: false, error: 'auth' }

  const result = gradeQuiz(topic.quiz, cleaned)
  const { data: existing } = await supabase
    .from('grammar_progress')
    .select('best_score, attempts')
    .eq('topic_slug', slug)
    .maybeSingle()

  const best = Math.max(Number(existing?.best_score ?? 0), result.score)
  const { error } = await supabase.from('grammar_progress').upsert(
    {
      user_id: userId,
      topic_slug: slug,
      best_score: best,
      attempts: (existing?.attempts ?? 0) + 1,
      completed: best >= 80,
      last_attempt_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,topic_slug' },
  )
  if (error) return { ok: false, error: 'failed' }

  const xp = await awardXp(supabase, 'quiz', slug, result.score)
  return { ok: true, score: result.score, passed: result.passed, best, xp }
}

export async function submitDictation(
  levelSlug: string,
  lineId: string,
  answer: string,
): Promise<ActionResult<{ score: number; xp: XpResult | null }>> {
  const level = levelFromSlug(levelSlug)
  const line = level ? getDictationSet(level)?.lines.find((l) => l.id === lineId) : undefined
  if (!line || typeof answer !== 'string' || answer.length > 400) return { ok: false, error: 'invalid' }

  const { supabase, userId } = await getSessionContext()
  if (!userId) return { ok: false, error: 'auth' }

  const score = Math.round(diffWords(line.text, answer).accuracy * 100)
  const xp = await awardXp(supabase, 'dictation', lineId, score)
  return { ok: true, score, xp }
}

export async function submitSpeaking(
  slug: string,
  lineIndex: number,
  transcript: string,
  confidence?: number,
): Promise<ActionResult<{ score: number; verdict: SpeakingVerdict; xp: XpResult | null }>> {
  const line = getDialogue(slug)?.lines[lineIndex]
  if (!line || typeof transcript !== 'string' || transcript.length > 400) return { ok: false, error: 'invalid' }

  const { supabase, userId } = await getSessionContext()
  if (!userId) return { ok: false, error: 'auth' }

  const result = scoreSpeaking(line.text, transcript, typeof confidence === 'number' ? confidence : undefined)
  const xp = await awardXp(supabase, 'speaking', `${slug}#${lineIndex}`, result.score)
  return { ok: true, score: result.score, verdict: result.verdict, xp }
}

export async function completeDialogue(slug: string): Promise<ActionResult<{ xp: XpResult | null }>> {
  if (!getDialogue(slug)) return { ok: false, error: 'invalid' }
  const { supabase, userId } = await getSessionContext()
  if (!userId) return { ok: false, error: 'auth' }
  return { ok: true, xp: await awardXp(supabase, 'dialogue', slug, null) }
}

/** Called when a learner finishes an AI-generated practice set. The score is self-reported, so XP is small and capped. */
export async function completePractice(score: number): Promise<ActionResult<{ xp: XpResult | null }>> {
  if (!Number.isFinite(score) || score < 0 || score > 100) return { ok: false, error: 'invalid' }
  const { supabase, userId } = await getSessionContext()
  if (!userId) return { ok: false, error: 'auth' }
  return { ok: true, xp: await awardXp(supabase, 'tutor', 'practice', Math.round(score)) }
}

export async function submitDrill(
  tense: string,
  correct: number,
  total: number,
): Promise<ActionResult<{ score: number; xp: XpResult | null }>> {
  if (!isTense(tense) || !Number.isInteger(correct) || !Number.isInteger(total) || total < 1 || total > 30 || correct < 0 || correct > total) {
    return { ok: false, error: 'invalid' }
  }
  const { supabase, userId } = await getSessionContext()
  if (!userId) return { ok: false, error: 'auth' }
  const score = Math.round((correct / total) * 100)
  return { ok: true, score, xp: await awardXp(supabase, 'drill', tense, score, { correct, total }) }
}
