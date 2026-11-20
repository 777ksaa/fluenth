import { LEVELS } from '@/lib/core/levels'
import type { Level } from '@/lib/core/levels'
import { A_TOPICS } from './a'
import { B_TOPICS } from './b'
import { C_TOPICS } from './c'
import type { GrammarTopic } from './types'

export type { GrammarTopic } from './types'

export const GRAMMAR_TOPICS: GrammarTopic[] = [...A_TOPICS, ...B_TOPICS, ...C_TOPICS]

const bySlug = new Map(GRAMMAR_TOPICS.map((t) => [t.slug, t]))

export const getTopic = (slug: string): GrammarTopic | undefined => bySlug.get(slug)

export function topicsForLevel(level: Level): GrammarTopic[] {
  return GRAMMAR_TOPICS.filter((t) => t.level === level)
}

/**
 * Roadmap entries without a lesson page yet. They are listed on /grammar so learners can see
 * the full A1-C2 path, but they are not linked and not in the sitemap, which avoids publishing
 * empty pages. To publish one, write its GrammarTopic and remove it from this list.
 */
export const PLANNED_TOPICS: Record<Level, string[]> = {
  A1: ['Articles: a, an, the', 'Plural nouns', 'There is and there are', 'Can and can’t', 'Possessive adjectives'],
  A2: ['Present continuous', 'Going to and will', 'Countable and uncountable nouns', 'Have to and must', 'Adverbs of frequency'],
  B1: ['Past continuous', 'Used to', 'Relative clauses', 'Gerunds and infinitives', 'Modals of probability'],
  B2: ['Past perfect', 'Future perfect and continuous', 'Wish and if only', 'Causative have and get', 'Participle clauses'],
  C1: ['Ellipsis and substitution', 'Nominalisation', 'Hedging language', 'Advanced linking devices', 'Emphatic structures'],
  C2: ['Discourse markers in speech', 'Register and style shifts', 'Idiomatic and figurative language', 'Fronting and focus', 'Archaic and literary forms'],
}

export function groupedByLevel(): { level: Level; topics: GrammarTopic[]; planned: string[] }[] {
  return LEVELS.map((level) => ({ level, topics: topicsForLevel(level), planned: PLANNED_TOPICS[level] }))
}
