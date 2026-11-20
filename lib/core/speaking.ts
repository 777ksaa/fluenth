// Speaking score from Web Speech API output.
//
// This is an INTELLIGIBILITY score: how closely the recogniser's transcript matches the
// target sentence. Recognisers lean towards likely words, so it can miss subtle phoneme
// errors. It is a motivating practice signal, not a phoneme-level assessment. For that,
// plug a pronunciation-assessment service in behind this same function signature.

import { diffWords } from './diff.ts'
import type { DiffToken } from './diff.ts'

export type SpeakingVerdict = 'excellent' | 'good' | 'keep-practising' | 'try-again'

export interface SpeakingScore {
  /** 0..100 */
  score: number
  accuracy: number
  verdict: SpeakingVerdict
  tokens: DiffToken[]
  /** Target words that were missed, replaced or nearly right: the ones to practise. */
  missed: string[]
}

export function verdictFor(score: number): SpeakingVerdict {
  if (score >= 90) return 'excellent'
  if (score >= 75) return 'good'
  if (score >= 50) return 'keep-practising'
  return 'try-again'
}

/**
 * @param confidence the recogniser's own 0..1 confidence, if available. At or above 0.9 it
 *                   costs nothing; below that it scales the score down by at most 15%.
 */
export function scoreSpeaking(target: string, transcript: string, confidence?: number): SpeakingScore {
  const diff = diffWords(target, transcript, { expandContractions: true })
  const heardNothing = diff.tokens.every((t) => t.status === 'missing')

  let factor = 1
  if (typeof confidence === 'number' && Number.isFinite(confidence)) {
    const c = Math.min(1, Math.max(0, confidence))
    factor = 0.85 + 0.15 * Math.min(1, c / 0.9)
  }

  const score = heardNothing ? 0 : Math.round(diff.accuracy * factor * 100)
  const missed = diff.tokens
    .filter((t) => t.status === 'missing' || t.status === 'wrong' || t.status === 'typo')
    .map((t) => t.expected as string)

  return { score, accuracy: diff.accuracy, verdict: verdictFor(score), tokens: diff.tokens, missed }
}
