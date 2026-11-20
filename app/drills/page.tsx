import Link from 'next/link'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { JsonLd } from '@/components/json-ld'
import { LevelChip } from '@/components/level-chip'
import { TENSE_ORDER, TENSES } from '@/lib/core/drills'
import { breadcrumbJsonLd } from '@/lib/seo/jsonld'
import { pageMetadata } from '@/lib/seo/metadata'

export const metadata = pageMetadata({
  title: 'English tense drills: practise every tense until it is automatic',
  description:
    'Pattern drills for the English tenses. Get a cue, build the sentence in the right form, and repeat in affirmative, negative and question forms until it comes without thinking.',
  path: '/drills',
})

export default function DrillsIndex() {
  return (
    <div className="page py-8 md:py-12">
      <Breadcrumbs items={[{ name: 'Home', href: '/' }, { name: 'Tense drills' }]} />
      <h1 className="title-xl">English tense drills</h1>
      <p className="lead measure mt-4">
        Knowing a rule is not the same as using it at speed. These drills give you a cue and ask for the whole sentence, again and
        again, in statements, negatives and questions, until the form comes without thinking.
      </p>
      <ul className="ruled mt-12 max-w-3xl">
        {TENSE_ORDER.map((slug) => {
          const t = TENSES[slug]
          return (
            <li key={slug} className="flex items-start gap-4">
              <LevelChip level={t.level} />
              <div>
                <Link href={`/drills/${slug}`} className="title-sm">
                  {t.title}
                </Link>
                <p className="muted mt-1">{t.use}</p>
                <p className="hint mt-1">Example: {t.example}</p>
              </div>
            </li>
          )
        })}
      </ul>
      <JsonLd data={breadcrumbJsonLd([{ name: 'Home', path: '/' }, { name: 'Tense drills', path: '/drills' }])} />
    </div>
  )
}
