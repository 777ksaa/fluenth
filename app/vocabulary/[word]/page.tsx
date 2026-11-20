import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, permanentRedirect } from 'next/navigation'
import { cache } from 'react'
import { SEED_WORDS } from '@/content/seed-words'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { JsonLd } from '@/components/json-ld'
import { SaveWordButton } from '@/components/save-word-button'
import { SpeakButton } from '@/components/speak-button'
import { TranslatePanel } from '@/components/translate-panel'
import { VideoClips } from '@/components/video-clips'
import { ViewBeacon } from '@/components/view-beacon'
import { allAntonyms, allSynonyms, entrySummary, firstExample } from '@/lib/core/dictionary'
import { exploreWords } from '@/lib/core/explore'
import { splitHighlight } from '@/lib/core/highlight'
import { normalizeWord, slugToCandidates, wordToSlug } from '@/lib/core/words'
import { lookupWord } from '@/lib/dictionary/lookup'
import { approvedClips, youglishEnabled } from '@/lib/media'
import { breadcrumbJsonLd, definedTermJsonLd } from '@/lib/seo/jsonld'
import { pageMetadata } from '@/lib/seo/metadata'

// Incremental static regeneration: each word is rendered on its first request, then served from
// the cache for a day. Nothing on this page reads cookies, so it stays cacheable; the learner's
// own state (save button, translations) is filled in by client components.
export const revalidate = 86400
export function generateStaticParams() {
  return []
}

type Props = { params: Promise<{ word: string }> }

const resolve = cache(async (slug: string) => {
  let unavailable = false
  for (const key of slugToCandidates(slug)) {
    const result = await lookupWord(key)
    if (result.status === 'found') return { kind: 'found' as const, key, result }
    if (result.status === 'unavailable') unavailable = true
  }
  return unavailable ? { kind: 'unavailable' as const } : { kind: 'missing' as const }
})

const decode = (value: string): string => {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { word: slug } = await params
  const found = await resolve(slug)
  if (found.kind !== 'found') return { title: found.kind === 'missing' ? 'Word not found' : 'Dictionary unavailable', robots: { index: false } }
  return pageMetadata({
    title: `${found.key}: definition, pronunciation and examples`,
    description: entrySummary(found.result.entry),
    path: `/vocabulary/${wordToSlug(found.key)}`,
    noindex: !found.result.indexable,
  })
}

const MAX_SPOKEN_EXAMPLES = 4

function Highlighted({ text, word }: { text: string; word: string }) {
  return (
    <>
      {splitHighlight(text, word).map((part, i) => (part.match ? <mark key={i}>{part.text}</mark> : <span key={i}>{part.text}</span>))}
    </>
  )
}

function WordLinks({ words }: { words: string[] }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {words.map((w) => {
        const key = normalizeWord(w)
        return (
          <li key={w}>
            {key ? (
              <Link className="chip chip-link" href={`/vocabulary/${encodeURIComponent(wordToSlug(key))}`}>
                {w}
              </Link>
            ) : (
              <span className="chip">{w}</span>
            )}
          </li>
        )
      })}
    </ul>
  )
}

export default async function WordPage({ params }: Props) {
  const { word: slug } = await params
  const found = await resolve(slug)
  if (found.kind === 'unavailable') throw new Error('The dictionary service did not respond') // errors are never cached by ISR
  if (found.kind === 'missing') notFound()

  const { key, result } = found
  const { entry, enrichment } = result
  const canonical = wordToSlug(key)
  if (decode(slug) !== canonical) permanentRedirect(`/vocabulary/${encodeURIComponent(canonical)}`)

  const path = `/vocabulary/${canonical}`
  const synonyms = allSynonyms(entry)
  const antonyms = allAntonyms(entry)
  const firstMeaning = entry.meanings[0]
  const firstDefinition = firstMeaning?.definitions[0]
  const clips = await approvedClips('word', key)
  const more = exploreWords(key, SEED_WORDS)
  let spoken = 0

  return (
    <div className="page py-8 md:py-12">
      <Breadcrumbs
        items={[
          { name: 'Home', href: '/' },
          { name: 'Dictionary', href: '/vocabulary' },
          { name: entry.word },
        ]}
      />

      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <article>
          <header>
            <h1 className="headword">{entry.word}</h1>
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
              {entry.phonetic ? <span className="ipa">{entry.phonetic}</span> : null}
              <SpeakButton text={entry.word} audioUrl={entry.audio} label={`Listen to ${entry.word}`} />
              {firstDefinition ? (
                <SaveWordButton
                  card={{
                    word: key,
                    partOfSpeech: firstMeaning.partOfSpeech,
                    definition: firstDefinition.definition,
                    example: firstExample(entry),
                    audioUrl: entry.audio,
                  }}
                />
              ) : null}
            </div>
          </header>

          <div className="mt-10 space-y-10">
            {entry.meanings.map((meaning, mi) => (
              <section key={`${meaning.partOfSpeech}-${mi}`} aria-label={`${entry.word} as a ${meaning.partOfSpeech}`}>
                <h2 className="pos">{meaning.partOfSpeech}</h2>
                <ol className="ruled mt-1 list-decimal pl-6 marker:font-bold marker:text-pen">
                  {meaning.definitions.map((d, di) => (
                    <li key={di} className="pl-2">
                      <p className="reading">{d.definition}</p>
                      {d.example ? (
                        <p className="reading muted mt-1 flex items-start gap-2 italic">
                          <span>
                            “<Highlighted text={d.example} word={key} />”
                          </span>
                          {spoken++ < MAX_SPOKEN_EXAMPLES ? <SpeakButton text={d.example} label="Listen to this example" /> : null}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ol>
              </section>
            ))}

            {synonyms.length > 0 ? (
              <section aria-labelledby="synonyms-heading">
                <h2 id="synonyms-heading" className="title-sm mb-3">
                  Words with a similar meaning
                </h2>
                <WordLinks words={synonyms} />
              </section>
            ) : null}

            {antonyms.length > 0 ? (
              <section aria-labelledby="antonyms-heading">
                <h2 id="antonyms-heading" className="title-sm mb-3">
                  Opposites
                </h2>
                <WordLinks words={antonyms} />
              </section>
            ) : null}

            {entry.origin ? (
              <section aria-labelledby="origin-heading">
                <h2 id="origin-heading" className="title-sm mb-2">
                  Where the word comes from
                </h2>
                <p className="reading measure">{entry.origin}</p>
              </section>
            ) : null}
          </div>

          <footer className="hint mt-12 max-w-2xl border-t border-rule pt-4">
            Definitions from{' '}
            <a href={entry.sourceUrls[0] ?? 'https://en.wiktionary.org'} rel="noopener noreferrer">
              Wiktionary
            </a>
            {entry.license ? (
              <>
                , available under{' '}
                <a href={entry.license.url} rel="noopener noreferrer">
                  {entry.license.name}
                </a>
              </>
            ) : null}
            .{entry.related ? ' Related words from Datamuse.' : ''}{' '}
            <Link href="/about">How this dictionary is built</Link>
          </footer>
        </article>

        <aside className="space-y-10 lg:sticky lg:top-24 lg:self-start">
          <section aria-labelledby="translate-heading">
            <h2 id="translate-heading" className="title-sm mb-3">
              In your language
            </h2>
            <TranslatePanel word={key} initial={enrichment} />
          </section>
          <section aria-labelledby="video-heading">
            <h2 id="video-heading" className="title-sm mb-3">
              Hear it in real speech
            </h2>
            <VideoClips query={key} clips={clips} youglish={youglishEnabled()} />
          </section>
        </aside>
      </div>

      <section aria-labelledby="more-heading" className="mt-16">
        <h2 id="more-heading" className="title-sm mb-3">
          More words to look up
        </h2>
        <WordLinks words={more} />
      </section>

      <ViewBeacon word={key} />
      <JsonLd
        data={[
          definedTermJsonLd({ word: entry.word, description: entrySummary(entry), path }),
          breadcrumbJsonLd([
            { name: 'Home', path: '/' },
            { name: 'Dictionary', path: '/vocabulary' },
            { name: entry.word, path },
          ]),
        ]}
      />
    </div>
  )
}
