// Quiz questions and grading. Questions (with answers) are shipped to the browser so the UI
// can give instant feedback; the server action re-grades with the same function before it
// records progress or XP, so a tampered client cannot invent a score.

export type QuizQuestion = ChoiceQuestion | FillQuestion

export interface ChoiceQuestion {
  id: string
  type: 'choice'
  prompt: string
  options: string[]
  /** index into options */
  answer: number
  explanation: string
}

export interface FillQuestion {
  id: string
  type: 'fill'
  /** Use ___ for the gap. */
  prompt: string
  /** Every accepted answer, e.g. ["has been", "'s been"]. */
  answers: string[]
  explanation: string
}

export type QuizAnswer = number | string | null

export interface QuestionResult {
  id: string
  correct: boolean
  explanation: string
  /** Human-readable correct answer. */
  expected: string
}

export interface QuizResult {
  /** 0..100, rounded */
  score: number
  correct: number
  total: number
  passed: boolean
  results: QuestionResult[]
}

export const PASS_MARK = 80

export function normalizeAnswer(s: string): string {
  return s
    .normalize('NFKC')
    .replace(/[‘’ʼ]/g, "'")
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[.!?,;:]+$/g, '')
    .trim()
}

export function gradeQuestion(q: QuizQuestion, answer: QuizAnswer): QuestionResult {
  if (q.type === 'choice') {
    return {
      id: q.id,
      correct: typeof answer === 'number' && answer === q.answer,
      explanation: q.explanation,
      expected: q.options[q.answer],
    }
  }
  const given = typeof answer === 'string' ? normalizeAnswer(answer) : ''
  return {
    id: q.id,
    correct: given.length > 0 && q.answers.some((a) => normalizeAnswer(a) === given),
    explanation: q.explanation,
    expected: q.answers[0],
  }
}

/** `answers` is positional and may be shorter than `questions`; missing answers count as wrong. */
export function gradeQuiz(questions: QuizQuestion[], answers: QuizAnswer[]): QuizResult {
  const results = questions.map((q, i) => gradeQuestion(q, answers[i] ?? null))
  const correct = results.filter((r) => r.correct).length
  const total = questions.length
  const score = total === 0 ? 0 : Math.round((correct / total) * 100)
  return { score, correct, total, passed: score >= PASS_MARK, results }
}

/** Fisher-Yates with an injectable RNG (tests pass a seeded one). */
export function shuffled<T>(items: readonly T[], rng: () => number = Math.random): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}
