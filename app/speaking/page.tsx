import Link from 'next/link'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { JsonLd } from '@/components/json-ld'
import { LevelChip } from '@/components/level-chip'
import { DIALOGUES } from '@/content/dialogues'
import { breadcrumbJsonLd } from '@/lib/seo/jsonld'
import { pageMetadata } from '@/lib/seo/metadata'

export const metadata = pageMetadata({
  title: 'English speaking practice with dialogues',
  description:
    'Practise real English conversations. Choose a role, hear the other speaker, say your lines aloud and get a pronunciation score for every line.',
  path: '/speaking',
})

export default function SpeakingIndex() {
  return (
    <div className="page py-8 md:py-12">
      <Breadcrumbs items={[{ name: 'Home', href: '/' }, { name: 'Speaking' }]} />
      <h1 className="title-xl">English speaking practice</h1>
      <p className="lead measure mt-4">
        Pick an everyday situation, choose a role and talk. You hear the other speaker, say your lines out loud, and see which words
        came through clearly.
      </p>
      <ul className="ruled mt-12 max-w-3xl">
        {DIALOGUES.map((d) => (
          <li key={d.slug} className="flex items-start gap-4">
            <LevelChip level={d.level} />
            <div>
              <Link href={`/speaking/${d.slug}`} className="title-sm">
                {d.title}
              </Link>
              <p className="muted mt-1">{d.summary}</p>
            </div>
          </li>
        ))}
      </ul>
      <JsonLd data={breadcrumbJsonLd([{ name: 'Home', path: '/' }, { name: 'Speaking', path: '/speaking' }])} />
    </div>
  )
}
