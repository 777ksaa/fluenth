import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { DeletedNotice } from '@/components/deleted-notice'
import { LevelChip } from '@/components/level-chip'
import { SearchBox } from '@/components/search-box'
import { SpeakButton } from '@/components/speak-button'
import { DIALOGUES } from '@/content/dialogues'
import { DICTATION_SETS } from '@/content/dictation'
import { GRAMMAR_TOPICS } from '@/content/grammar'
import { SEED_GROUPS } from '@/content/seed-words'
import { firstExample } from '@/lib/core/dictionary'
import { wordOfTheDay } from '@/lib/core/explore'
import { splitHighlight } from '@/lib/core/highlight'
import { LEVEL_INFO, LEVELS, levelSlug } from '@/lib/core/levels'
import { TENSE_ORDER } from '@/lib/core/drills'
import { wordToSlug } from '@/lib/core/words'
import { lookupWord } from '@/lib/dictionary/lookup'
import { SITE } from '@/lib/seo/site'

// Regenerated hourly, so the word of the day changes shortly after UTC midnight.
export const revalidate = 3600

export const metadata: Metadata = {
  title: { absolute: `${SITE.name}: ${SITE.tagline}` },
  description: SITE.description,
  alternates: { canonical: '/' },
  openGraph: { title: `${SITE.name}: ${SITE.tagline}`, description: SITE.description, url: '/', siteName: SITE.name, type: 'website' },
}

const wordHref = (w: string) => `/vocabulary/${encodeURIComponent(wordToSlug(w))}`

async function WordOfTheDay() {
  const word = wordOfTheDay(new Date(), SEED_GROUPS.words)
  const result = await lookupWord(word).catch(() => null)
  if (!result || result.status !== 'found') return null
  const { entry } = result
  const meaning = entry.meanings[0]
  const definition = meaning?.definitions[0]
  if (!definition) return null
  const example = firstExample(entry)

  return (
    <section aria-labelledby="wotd-heading" className="index-card">
      <h2 id="wotd-heading" className="title-sm">
        Word of the day
      </h2>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
        <p className="title-lg">{entry.word}</p>
        {entry.phonetic ? <span className="ipa">{entry.phonetic}</span> : null}
        <SpeakButton text={entry.word} audioUrl={entry.audio} label={`Listen to ${entry.word}`} />
      </div>
      <p className="reading mt-2">
        <span className="pos">{meaning.partOfSpeech}</span> {definition.definition}
      </p>
      {example ? (
        <p className="reading muted mt-1 italic">
          “{splitHighlight(example, word).map((part, i) => (part.match ? <mark key={i}>{part.text}</mark> : <span key={i}>{part.text}</span>))}”
        </p>
      ) : null}
      <p className="mt-4">
        <Link href={wordHref(word)}>See the full entry for {entry.word}</Link>
      </p>
    </section>
  )
}

const MODULES = [
  {
    href: '/vocabulary',
    title: 'Dictionary',
    text: 'Any word, idiom or phrasal verb, with examples, translations and real video of people saying it.',
  },
  {
    href: '/grammar',
    title: 'Grammar',
    text: `${GRAMMAR_TOPICS.length} lessons so far, each with clear rules, examples, a quiz and a printable cheat sheet.`,
  },
  {
    href: '/dictation',
    title: 'Dictation',
    text: `Listen, type what you hear and see every mistake marked in red. ${DICTATION_SETS.length} levels, A1 to C2.`,
  },
  {
    href: '/speaking',
    title: 'Speaking',
    text: `Play one side of ${DIALOGUES.length} everyday dialogues and say your lines aloud. Your pronunciation is scored.`,
  },
  {
    href: '/drills',
    title: 'Tense drills',
    text: `Quick pattern drills for ${TENSE_ORDER.length} tenses: positive, negative and question, until the form comes without thinking.`,
  },
  {
    href: '/review',
    title: 'Flashcards',
    text: 'Save words from the dictionary and review them just before you would forget them.',
  },
  {
    href: '/practice',
    title: 'Practice and tutor',
    text: 'AI-made exercises on any topic and a tutor that explains your mistakes. Needs a free account.',
  },
] as const

export default function Home() {
  return (
    <>
      <section className="page pt-10 pb-14 md:pt-20 md:pb-20">
        <Suspense fallback={null}>
          <DeletedNotice />
        </Suspense>
        <h1 className="title-xl max-w-4xl">Look up any English word and hear how people really say it</h1>
        <p className="lead measure mt-5">
          Definitions, examples and real video for every word, plus grammar from A1 to C2, dictation, speaking practice and
          flashcards that return at the right time.
        </p>
        <div className="measure mt-10">
          <SearchBox autoFocus />
          <p className="hint mt-3">
            Try{' '}
            {['break the ice', 'achieve', 'give up'].map((w, i) => (
              <span key={w}>
                {i > 0 ? ', ' : ''}
                <Link href={wordHref(w)}>{w}</Link>
              </span>
            ))}
            .
          </p>
        </div>
      </section>

      <div className="page space-y-20 pb-20">
        <WordOfTheDay />

        <section aria-labelledby="modules-heading">
          <h2 id="modules-heading" className="title-lg">
            Everything for the road from A1 to C2
          </h2>
          <ul className="ruled mt-6 grid gap-x-12 md:grid-cols-2 [&>*]:border-t-0 md:[&>*:nth-child(n+3)]:border-t [&>*:nth-child(n+2)]:max-md:border-t">
            {MODULES.map((m) => (
              <li key={m.href}>
                <Link href={m.href} className="title-sm">
                  {m.title}
                </Link>
                <p className="muted mt-1">{m.text}</p>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="levels-heading">
          <h2 id="levels-heading" className="title-lg">
            Start at your level
          </h2>
          <ul className="mt-6 grid grid-cols-2 gap-x-8 gap-y-6 md:grid-cols-3 lg:grid-cols-6">
            {LEVELS.map((level) => (
              <li key={level}>
                <Link href={`/grammar#level-${levelSlug(level)}`} className="block no-underline">
                  <LevelChip level={level} />
                  <span className="mt-2 block font-semibold text-ink">{LEVEL_INFO[level].name}</span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="hint mt-4">
            Not sure where you are? Take the A2 or B1 quiz on the <Link href="/grammar">grammar roadmap</Link> and see how it feels.
          </p>
        </section>
      </div>
    </>
  )
}
