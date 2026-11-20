import Link from 'next/link'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { JsonLd } from '@/components/json-ld'
import { SearchBox } from '@/components/search-box'
import { SEED_GROUPS } from '@/content/seed-words'
import { wordToSlug } from '@/lib/core/words'
import { popularWords } from '@/lib/dictionary/lookup'
import { breadcrumbJsonLd } from '@/lib/seo/jsonld'
import { pageMetadata } from '@/lib/seo/metadata'

export const revalidate = 3600

export const metadata = pageMetadata({
  title: 'English dictionary with examples, pronunciation and video',
  description:
    'Look up any English word, idiom or phrasal verb. See definitions, example sentences, synonyms, translations and real video clips of people saying it.',
  path: '/vocabulary',
})

const href = (word: string) => `/vocabulary/${encodeURIComponent(wordToSlug(word))}`

function WordList({ words }: { words: readonly string[] }) {
  return (
    <ul className="grid gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
      {words.map((w) => (
        <li key={w} className="border-b border-rule py-2">
          <Link href={href(w)}>{w}</Link>
        </li>
      ))}
    </ul>
  )
}

export default async function VocabularyIndex() {
  let popular: string[] = []
  try {
    popular = await popularWords(30)
  } catch {
    // The list is a bonus: without the database the page still has the seed words.
  }

  return (
    <div className="page py-8 md:py-12">
      <Breadcrumbs items={[{ name: 'Home', href: '/' }, { name: 'Dictionary' }]} />
      <h1 className="title-xl">English dictionary</h1>
      <p className="lead measure mt-4">
        Type any word, idiom or phrasal verb. Every entry has examples, a pronunciation and, when you ask for it, real
        people saying it in videos.
      </p>
      <div className="measure mt-8">
        <SearchBox autoFocus />
      </div>

      <div className="mt-16 space-y-14">
        {popular.length > 0 ? (
          <section aria-labelledby="popular-heading">
            <h2 id="popular-heading" className="title-md mb-4">
              Looked up most often
            </h2>
            <WordList words={popular} />
          </section>
        ) : null}
        <section aria-labelledby="words-heading">
          <h2 id="words-heading" className="title-md mb-4">
            Useful words for learners
          </h2>
          <WordList words={SEED_GROUPS.words} />
        </section>
        <section aria-labelledby="idioms-heading">
          <h2 id="idioms-heading" className="title-md mb-4">
            Idioms
          </h2>
          <WordList words={SEED_GROUPS.idioms} />
        </section>
        <section aria-labelledby="phrasal-heading">
          <h2 id="phrasal-heading" className="title-md mb-4">
            Phrasal verbs
          </h2>
          <WordList words={SEED_GROUPS.phrasalVerbs} />
        </section>
      </div>

      <JsonLd data={breadcrumbJsonLd([{ name: 'Home', path: '/' }, { name: 'Dictionary', path: '/vocabulary' }])} />
    </div>
  )
}
