import type { Level } from '@/lib/core/levels'
import type { ChoiceQuestion, FillQuestion, QuizQuestion } from '@/lib/core/quiz'

export interface Example {
  en: string
  /** Russian translation. Add more languages as optional fields (kk, uk, es ...). */
  ru?: string
}

export interface Table {
  head: string[]
  rows: string[][]
}

export interface Section {
  heading: string
  body?: string[]
  table?: Table
  examples?: Example[]
}

export interface Mistake {
  wrong: string
  right: string
  why: string
}

export interface GrammarTopic {
  slug: string
  level: Level
  title: string
  /** 120-160 characters. Used as the meta description and the lead paragraph. */
  summary: string
  /** Phrase to search in real speech (YouGlish). */
  youglish: string
  /** The cheat sheet: short, memorable rules. */
  rules: string[]
  sections: Section[]
  mistakes: Mistake[]
  quiz: QuizQuestion[]
  related: string[]
}

export const ex = (en: string, ru?: string): Example => ({ en, ...(ru ? { ru } : {}) })

export const choice = (id: string, prompt: string, options: string[], answer: number, explanation: string): ChoiceQuestion => ({
  id,
  type: 'choice',
  prompt,
  options,
  answer,
  explanation,
})

export const fill = (id: string, prompt: string, answers: string[], explanation: string): FillQuestion => ({
  id,
  type: 'fill',
  prompt,
  answers,
  explanation,
})
