// Structural pattern drills for verb tenses ("Polyglot"-style): the learner sees a cue
//   she / work / at a bank      Past simple · negative
// and types "She did not work at a bank." The same cue is cycled through affirmative,
// negative and question forms until the pattern becomes automatic.
//
// Everything is deterministic for a given seed, so drills are testable and shareable.

import { diffWords } from './diff.ts'
import type { DiffResult } from './diff.ts'

export type Tense =
  | 'present-simple'
  | 'past-simple'
  | 'future-simple'
  | 'present-continuous'
  | 'past-continuous'
  | 'present-perfect'
  | 'past-perfect'

export type Polarity = 'affirmative' | 'negative' | 'question'

export const POLARITIES: Polarity[] = ['affirmative', 'negative', 'question']

type Person = 'I' | 'you' | 'third' | 'plural'

export interface Subject {
  text: string
  person: Person
}

export interface VerbForms {
  base: string
  third: string
  past: string
  pastParticiple: string
  ing: string
}

interface VerbEntry {
  forms: VerbForms
  tails: string[]
  /** Stative verbs ("know", "want") are not normally used in continuous tenses. */
  noContinuous?: boolean
}

const BE: VerbForms = { base: 'be', third: 'is', past: 'was', pastParticiple: 'been', ing: 'being' }

const v = (base: string, third: string, past: string, pastParticiple: string, ing: string): VerbForms => ({
  base,
  third,
  past,
  pastParticiple,
  ing,
})

export const VERBS: VerbEntry[] = [
  { forms: BE, tails: ['a teacher', 'at home', 'happy', 'in the kitchen', 'from Spain'] },
  { forms: v('work', 'works', 'worked', 'worked', 'working'), tails: ['at a bank', 'at a hospital', 'in an office'] },
  { forms: v('live', 'lives', 'lived', 'lived', 'living'), tails: ['in London', 'near the park'] },
  { forms: v('play', 'plays', 'played', 'played', 'playing'), tails: ['tennis', 'the guitar', 'chess'] },
  { forms: v('study', 'studies', 'studied', 'studied', 'studying'), tails: ['English', 'medicine', 'at university'] },
  { forms: v('watch', 'watches', 'watched', 'watched', 'watching'), tails: ['a film', 'the news'] },
  { forms: v('cook', 'cooks', 'cooked', 'cooked', 'cooking'), tails: ['dinner', 'pasta'] },
  { forms: v('go', 'goes', 'went', 'gone', 'going'), tails: ['to school', 'to the cinema', 'home'] },
  { forms: v('have', 'has', 'had', 'had', 'having'), tails: ['breakfast', 'lunch', 'a shower'] },
  { forms: v('eat', 'eats', 'ate', 'eaten', 'eating'), tails: ['an apple', 'rice'] },
  { forms: v('drink', 'drinks', 'drank', 'drunk', 'drinking'), tails: ['tea', 'water'] },
  { forms: v('read', 'reads', 'read', 'read', 'reading'), tails: ['a book', 'the newspaper'] },
  { forms: v('write', 'writes', 'wrote', 'written', 'writing'), tails: ['a letter', 'an email'] },
  { forms: v('buy', 'buys', 'bought', 'bought', 'buying'), tails: ['a new phone', 'some bread'] },
  { forms: v('see', 'sees', 'saw', 'seen', 'seeing'), tails: ['a doctor', 'a friend'] },
  { forms: v('take', 'takes', 'took', 'taken', 'taking'), tails: ['the bus', 'a photo'] },
  { forms: v('make', 'makes', 'made', 'made', 'making'), tails: ['a cake', 'coffee'] },
  { forms: v('speak', 'speaks', 'spoke', 'spoken', 'speaking'), tails: ['French', 'Spanish'] },
  { forms: v('teach', 'teaches', 'taught', 'taught', 'teaching'), tails: ['maths', 'children'] },
  { forms: v('run', 'runs', 'ran', 'run', 'running'), tails: ['in the park', 'to the station'] },
  { forms: v('like', 'likes', 'liked', 'liked', 'liking'), tails: ['coffee', 'this song'], noContinuous: true },
  { forms: v('know', 'knows', 'knew', 'known', 'knowing'), tails: ['the answer', 'her brother'], noContinuous: true },
  { forms: v('want', 'wants', 'wanted', 'wanted', 'wanting'), tails: ['a coffee', 'to go home'], noContinuous: true },
]

export const SUBJECTS: Subject[] = [
  { text: 'I', person: 'I' },
  { text: 'you', person: 'you' },
  { text: 'he', person: 'third' },
  { text: 'she', person: 'third' },
  { text: 'we', person: 'plural' },
  { text: 'they', person: 'plural' },
  { text: 'my brother', person: 'third' },
  { text: 'the children', person: 'plural' },
  { text: 'Anna', person: 'third' },
]

export interface Frame {
  subject: Subject
  verb: VerbForms
  tail: string
}

const CONTINUOUS: Tense[] = ['present-continuous', 'past-continuous']

/** Build one sentence. Throws if asked for a combination English does not use ("is being"). */
export function conjugate(frame: Frame, tense: Tense, polarity: Polarity): string {
  const { subject, verb, tail } = frame
  const isBe = verb.base === 'be'
  if (isBe && CONTINUOUS.includes(tense)) throw new Error(`"be" is not drilled in ${tense}`)

  const p = subject.person
  const am = p === 'I' ? 'am' : p === 'third' ? 'is' : 'are'
  const was = p === 'I' || p === 'third' ? 'was' : 'were'
  const have = p === 'third' ? 'has' : 'have'
  const doAux = p === 'third' ? 'does' : 'do'
  const aff = polarity === 'affirmative'

  let aux: string | undefined
  let main: string
  switch (tense) {
    case 'present-simple':
      if (isBe) { aux = am; main = '' }
      else if (aff) { aux = undefined; main = p === 'third' ? verb.third : verb.base }
      else { aux = doAux; main = verb.base }
      break
    case 'past-simple':
      if (isBe) { aux = was; main = '' }
      else if (aff) { aux = undefined; main = verb.past }
      else { aux = 'did'; main = verb.base }
      break
    case 'future-simple':
      aux = 'will'; main = verb.base
      break
    case 'present-continuous':
      aux = am; main = verb.ing
      break
    case 'past-continuous':
      aux = was; main = verb.ing
      break
    case 'present-perfect':
      aux = have; main = verb.pastParticiple
      break
    case 'past-perfect':
      aux = 'had'; main = verb.pastParticiple
      break
  }

  const rest = [main, tail].filter(Boolean)
  let parts: string[]
  if (polarity === 'question') parts = [aux as string, subject.text, ...rest]
  else if (polarity === 'negative') parts = [subject.text, aux as string, 'not', ...rest]
  else parts = aux ? [subject.text, aux, ...rest] : [subject.text, ...rest]

  const sentence = parts.join(' ')
  return `${sentence.charAt(0).toUpperCase()}${sentence.slice(1)}${polarity === 'question' ? '?' : '.'}`
}

// ---- tense metadata (drives the /drills/[tense] pages) ---------------------------------------

export interface TenseInfo {
  slug: Tense
  title: string
  level: 'A1' | 'A2' | 'B1' | 'B2'
  use: string
  signals: string[]
  example: string
  formulas: Record<Polarity, string>
  /** Different pattern for "be" in the simple tenses. */
  beNote?: string
}

export const TENSES: Record<Tense, TenseInfo> = {
  'present-simple': {
    slug: 'present-simple',
    title: 'Present simple',
    level: 'A1',
    use: 'Habits, routines, permanent situations and facts.',
    signals: ['always', 'usually', 'often', 'every day', 'never'],
    example: 'She works at a bank.',
    formulas: { affirmative: 'S + V1 (+s/es for he, she, it)', negative: 'S + do/does + not + V1', question: 'Do/Does + S + V1 ?' },
    beNote: 'With "be": S + am/is/are; the question swaps the order (Is she a teacher?).',
  },
  'past-simple': {
    slug: 'past-simple',
    title: 'Past simple',
    level: 'A2',
    use: 'Finished actions at a definite time in the past.',
    signals: ['yesterday', 'last week', 'in 2019', 'ago'],
    example: 'She worked at a bank.',
    formulas: { affirmative: 'S + V2 (past form)', negative: 'S + did not + V1', question: 'Did + S + V1 ?' },
    beNote: 'With "be": S + was/were; the question swaps the order (Was she a teacher?).',
  },
  'future-simple': {
    slug: 'future-simple',
    title: 'Future simple',
    level: 'A2',
    use: 'Spontaneous decisions, predictions and promises about the future.',
    signals: ['tomorrow', 'next week', 'soon', 'I think'],
    example: 'She will work at a bank.',
    formulas: { affirmative: 'S + will + V1', negative: 'S + will not (won’t) + V1', question: 'Will + S + V1 ?' },
  },
  'present-continuous': {
    slug: 'present-continuous',
    title: 'Present continuous',
    level: 'A1',
    use: 'Actions happening now or around now, and temporary situations.',
    signals: ['now', 'at the moment', 'today', 'these days'],
    example: 'She is working at a bank.',
    formulas: { affirmative: 'S + am/is/are + V-ing', negative: 'S + am/is/are + not + V-ing', question: 'Am/Is/Are + S + V-ing ?' },
  },
  'past-continuous': {
    slug: 'past-continuous',
    title: 'Past continuous',
    level: 'B1',
    use: 'An action in progress at a moment in the past, often interrupted by another.',
    signals: ['while', 'when', 'at 8 o’clock yesterday', 'all evening'],
    example: 'She was working at a bank.',
    formulas: { affirmative: 'S + was/were + V-ing', negative: 'S + was/were + not + V-ing', question: 'Was/Were + S + V-ing ?' },
  },
  'present-perfect': {
    slug: 'present-perfect',
    title: 'Present perfect',
    level: 'B1',
    use: 'Past actions with a result or relevance now; experience; unfinished time periods.',
    signals: ['already', 'yet', 'ever', 'never', 'just', 'since', 'for'],
    example: 'She has worked at a bank.',
    formulas: { affirmative: 'S + have/has + V3 (past participle)', negative: 'S + have/has + not + V3', question: 'Have/Has + S + V3 ?' },
  },
  'past-perfect': {
    slug: 'past-perfect',
    title: 'Past perfect',
    level: 'B2',
    use: 'An action completed before another moment or action in the past.',
    signals: ['by the time', 'before', 'after', 'already', 'when'],
    example: 'She had worked at a bank.',
    formulas: { affirmative: 'S + had + V3', negative: 'S + had not + V3', question: 'Had + S + V3 ?' },
  },
}

export const TENSE_ORDER: Tense[] = [
  'present-simple',
  'present-continuous',
  'past-simple',
  'future-simple',
  'past-continuous',
  'present-perfect',
  'past-perfect',
]

export function isTense(value: string): value is Tense {
  return Object.hasOwn(TENSES, value)
}

// ---- drill generation --------------------------------------------------------------------------

export interface DrillItem {
  id: string
  tense: Tense
  polarity: Polarity
  /** What the learner sees: "she / work / at a bank". */
  cue: string
  /** "Past simple, negative" */
  prompt: string
  formula: string
  expected: string
}

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const pick = <T>(items: readonly T[], rng: () => number): T => items[Math.floor(rng() * items.length)]

export interface DrillOptions {
  tenses: Tense[]
  count: number
  seed: number
}

/**
 * Items cycle through affirmative, negative and question (starting at a random point), so a
 * set of 3k items has exactly k of each.
 */
export function makeDrill({ tenses, count, seed }: DrillOptions): DrillItem[] {
  if (tenses.length === 0 || count <= 0) return []
  const rng = mulberry32(seed)
  const offset = Math.floor(rng() * POLARITIES.length)
  const items: DrillItem[] = []
  let previous = ''

  for (let i = 0; i < count; i++) {
    const tense = pick(tenses, rng)
    const polarity = POLARITIES[(i + offset) % POLARITIES.length]
    const pool = CONTINUOUS.includes(tense)
      ? VERBS.filter((e) => !e.noContinuous && e.forms.base !== 'be')
      : VERBS

    let frame: Frame | undefined
    for (let attempt = 0; attempt < 6; attempt++) {
      const entry = pick(pool, rng)
      const candidate: Frame = { subject: pick(SUBJECTS, rng), verb: entry.forms, tail: pick(entry.tails, rng) }
      const key = `${candidate.subject.text}|${candidate.verb.base}`
      if (key !== previous || attempt === 5) {
        frame = candidate
        previous = key
        break
      }
    }
    const f = frame as Frame
    const info = TENSES[tense]
    items.push({
      id: `${seed}-${i}`,
      tense,
      polarity,
      cue: [f.subject.text, f.verb.base, f.tail].join(' / '),
      prompt: `${info.title}, ${polarity}`,
      formula: info.formulas[polarity],
      expected: conjugate(f, tense, polarity),
    })
  }
  return items
}

// ---- checking ------------------------------------------------------------------------------------

/** Expand contractions that depend on context ('s = is/has, 'd = had) so they can be compared. */
function expandForDrill(answer: string, sMeans: 'is' | 'has'): string {
  return answer
    .replace(/[‘’ʼ]/g, "'")
    .replace(/\b([A-Za-z]+)'s\b/g, `$1 ${sMeans}`)
    .replace(/\b([A-Za-z]+)'d\b/g, '$1 had')
    .replace(/\b([A-Za-z]+)'ll\b/g, '$1 will')
    .replace(/\b([A-Za-z]+)'ve\b/g, '$1 have')
    .replace(/\b([A-Za-z]+)'re\b/g, '$1 are')
    .replace(/\b([A-Za-z]+)'m\b/g, '$1 am')
}

export interface DrillCheck {
  correct: boolean
  diff: DiffResult
}

/** Exact forms are required (a typo is wrong), but contractions are accepted. */
export function checkDrill(item: Pick<DrillItem, 'expected'>, answer: string): DrillCheck {
  const attempts = (['is', 'has'] as const).map((sMeans) =>
    diffWords(item.expected, expandForDrill(answer, sMeans), { expandContractions: true }),
  )
  const best = attempts.reduce((a, b) => (b.accuracy > a.accuracy ? b : a))
  return { correct: best.perfect, diff: best }
}
