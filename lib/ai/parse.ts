// Turns model output into validated data. Model text is untrusted: it is parsed defensively,
// length-capped and re-checked, and anything malformed is dropped rather than shown.

import type { QuizQuestion } from '@/lib/core/quiz'

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

function clean(v: unknown, max: number): string | undefined {
  if (typeof v !== 'string') return undefined
  const s = v.replace(/\s+/g, ' ').trim()
  return s.length > 0 && s.length <= max ? s : undefined
}

/** Pulls the first JSON array or object out of text that may include code fences or chatter. */
export function extractJson(text: string, open: '[' | '{'): unknown {
  const close = open === '[' ? ']' : '}'
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const body = fenced ? fenced[1] : text
  const start = body.indexOf(open)
  const end = body.lastIndexOf(close)
  if (start < 0 || end <= start) return undefined
  try {
    return JSON.parse(body.slice(start, end + 1))
  } catch {
    return undefined
  }
}

/** Valid questions only, renumbered with `idPrefix`. Returns [] if the output is unusable. */
export function parseGeneratedQuiz(text: string, idPrefix: string, max = 8): QuizQuestion[] {
  const raw = extractJson(text, '[')
  if (!Array.isArray(raw)) return []
  const out: QuizQuestion[] = []

  for (const item of raw) {
    if (out.length >= max) break
    if (!isRecord(item)) continue
    const prompt = clean(item.prompt, 240)
    const explanation = clean(item.explanation, 300)
    if (!prompt || !explanation) continue
    const id = `${idPrefix}-${out.length + 1}`

    if (item.type === 'choice' && Array.isArray(item.options)) {
      const options = item.options.map((o) => clean(o, 120))
      if (options.length < 2 || options.length > 4 || options.some((o) => !o)) continue
      if (new Set(options).size !== options.length) continue
      const answer = item.answer
      if (typeof answer !== 'number' || !Number.isInteger(answer) || answer < 0 || answer >= options.length) continue
      out.push({ id, type: 'choice', prompt, options: options as string[], answer, explanation })
    } else if (item.type === 'fill' && Array.isArray(item.answers)) {
      const answers = item.answers.map((a) => clean(a, 80)).filter((a): a is string => Boolean(a))
      if (answers.length === 0 || answers.length > 5 || !prompt.includes('___')) continue
      out.push({ id, type: 'fill', prompt, answers, explanation })
    }
  }
  return out
}

export interface ParsedTranslation {
  translation: string
  example?: string
}

export function parseTranslation(text: string): ParsedTranslation | null {
  const raw = extractJson(text, '{')
  if (!isRecord(raw)) return null
  const translation = clean(raw.translation, 120)
  if (!translation) return null
  const example = clean(raw.example, 240)
  return { translation, ...(example ? { example } : {}) }
}
