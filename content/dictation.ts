import { LEVELS } from '@/lib/core/levels'
import type { Level } from '@/lib/core/levels'

export interface DictationLine {
  id: string
  text: string
  /**
   * Optional recording (https URL, e.g. Supabase Storage). When absent the player uses the
   * browser's text-to-speech voice, so every line works with no audio files at all.
   */
  audio?: string
}

export interface DictationSet {
  level: Level
  title: string
  intro: string
  lines: DictationLine[]
}

const lines = (level: Level, texts: string[]): DictationLine[] =>
  texts.map((text, i) => ({ id: `${level.toLowerCase()}-${i + 1}`, text }))

export const DICTATION_SETS: DictationSet[] = [
  {
    level: 'A1',
    title: 'Everyday basics',
    intro: 'Short, slow sentences about yourself, food and places. Listen as many times as you need.',
    lines: lines('A1', [
      'My name is Anna and I live in Almaty.',
      'I have a small brother and a big dog.',
      'We eat breakfast at eight o’clock.',
      'Can I have a cup of tea, please?',
      'The shop is next to the bank.',
    ]),
  },
  {
    level: 'A2',
    title: 'Plans and past events',
    intro: 'Past simple, going to, comparisons and polite requests at natural speed.',
    lines: lines('A2', [
      'Yesterday I visited my grandmother and we cooked dinner together.',
      'Could you tell me how to get to the station?',
      'It was raining, so we stayed at home and watched a film.',
      'I’m going to start a new English course next month.',
      'She is taller than her sister, but her brother is the tallest.',
    ]),
  },
  {
    level: 'B1',
    title: 'Opinions and experiences',
    intro: 'Present perfect, conditionals and linking words in longer sentences.',
    lines: lines('B1', [
      'I’ve been learning English for three years, and I still enjoy every lesson.',
      'If the weather is good tomorrow, we’ll have a picnic in the park.',
      'He asked me whether I had finished the report before the meeting.',
      'Although the train was late, we managed to arrive on time for the concert.',
      'You should drink more water instead of buying so many sweet drinks.',
    ]),
  },
  {
    level: 'B2',
    title: 'Work and society',
    intro: 'Relative clauses, passive voice and reported speech at conversational speed.',
    lines: lines('B2', [
      'The new library, which was designed by a local architect, opens next week.',
      'Had I known about the delay, I would have taken an earlier flight.',
      'Many people now prefer working from home because it saves time and money.',
      'She said she would call me as soon as she had spoken to the manager.',
      'Despite having studied for weeks, he found the final exam extremely difficult.',
    ]),
  },
  {
    level: 'C1',
    title: 'Formal and emphatic style',
    intro: 'Inversion, the subjunctive and cleft structures, with the rhythm of formal speech.',
    lines: lines('C1', [
      'Rarely do we pause to consider how much of our daily routine is simply habit.',
      'Not only did the company exceed its targets, but it also reduced its emissions.',
      'The committee insisted that the proposal be revised before it was submitted.',
      'It was only after the results were published that anyone questioned the methodology.',
      'Were it not for the volunteers, the festival would never have taken place.',
    ]),
  },
  {
    level: 'C2',
    title: 'Nuance and precision',
    intro: 'Long, rhythmically complex sentences with literary and abstract vocabulary.',
    lines: lines('C2', [
      'Little did she suspect that the casual remark would reshape the entire negotiation.',
      'What distinguishes a fluent speaker is not vocabulary alone but an intuitive sense of rhythm.',
      'Notwithstanding the considerable obstacles, the team pressed on with remarkable composure.',
      'Having long since abandoned any hope of a quick resolution, they settled in for a protracted dispute.',
      'The more one reflects on the matter, the less certain the conventional explanation appears.',
    ]),
  },
]

export const getDictationSet = (level: Level): DictationSet | undefined => DICTATION_SETS.find((s) => s.level === level)

export const dictationLevels = (): Level[] => LEVELS.filter((l) => getDictationSet(l))
