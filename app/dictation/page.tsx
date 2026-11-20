import Link from 'next/link'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { JsonLd } from '@/components/json-ld'
import { LevelChip } from '@/components/level-chip'
import { DICTATION_SETS } from '@/content/dictation'
import { levelSlug } from '@/lib/core/levels'
import { breadcrumbJsonLd } from '@/lib/seo/jsonld'
import { pageMetadata } from '@/lib/seo/metadata'

export const metadata = pageMetadata({
  title: 'English dictation practice, A1 to C2',
  description:
    'Free English dictation exercises for every CEFR level. Listen to a sentence, type what you hear and see every mistake marked in red, with a slow-speed option.',
  path: '/dictation',
})

export default function DictationIndex() {
  return (
    <div className="page py-8 md:py-12">
      <Breadcrumbs items={[{ name: 'Home', href: '/' }, { name: 'Dictation' }]} />
      <h1 className="title-xl">English dictation</h1>
      <p className="lead measure mt-4">
        Listen to a sentence, type what you hear, and get your answer back with every mistake marked in red. Dictation trains your ears
        and your spelling at the same time.
      </p>

      <ul className="ruled mt-12 max-w-3xl">
        {DICTATION_SETS.map((set) => (
          <li key={set.level} className="flex items-start gap-4">
            <LevelChip level={set.level} />
            <div>
              <Link href={`/dictation/${levelSlug(set.level)}`} className="title-sm">
                {set.title}
              </Link>
              <p className="muted mt-1">{set.intro}</p>
              <p className="hint mt-1">{set.lines.length} sentences</p>
            </div>
          </li>
        ))}
      </ul>

      <JsonLd data={breadcrumbJsonLd([{ name: 'Home', path: '/' }, { name: 'Dictation', path: '/dictation' }])} />
    </div>
  )
}
