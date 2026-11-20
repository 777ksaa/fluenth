import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { DictationPlayer } from '@/components/dictation-player'
import { JsonLd } from '@/components/json-ld'
import { LevelChip } from '@/components/level-chip'
import { DICTATION_SETS, getDictationSet } from '@/content/dictation'
import { LEVEL_INFO, levelFromSlug, levelSlug } from '@/lib/core/levels'
import { breadcrumbJsonLd, learningResourceJsonLd } from '@/lib/seo/jsonld'
import { pageMetadata } from '@/lib/seo/metadata'

export const dynamicParams = false

export function generateStaticParams() {
  return DICTATION_SETS.map((s) => ({ level: levelSlug(s.level) }))
}

type Props = { params: Promise<{ level: string }> }

function load(slug: string) {
  const level = levelFromSlug(slug)
  const set = level ? getDictationSet(level) : undefined
  return level && set ? { level, set } : null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { level: slug } = await params
  const found = load(slug)
  if (!found) return {}
  return pageMetadata({
    title: `${found.level} English dictation: ${found.set.title}`,
    description: `Free ${found.level} (${LEVEL_INFO[found.level].name.toLowerCase()}) English dictation. ${found.set.intro}`.slice(0, 200),
    path: `/dictation/${levelSlug(found.level)}`,
  })
}

export default async function DictationLevelPage({ params }: Props) {
  const { level: slug } = await params
  const found = load(slug)
  if (!found) notFound()
  const { level, set } = found
  const path = `/dictation/${levelSlug(level)}`

  return (
    <div className="page py-8 md:py-12">
      <Breadcrumbs
        items={[
          { name: 'Home', href: '/' },
          { name: 'Dictation', href: '/dictation' },
          { name: `${level}: ${set.title}` },
        ]}
      />
      <header>
        <LevelChip level={level} />
        <h1 className="title-xl mt-3">{set.title}</h1>
        <p className="lead measure mt-4">{set.intro}</p>
      </header>

      <div className="measure mt-10">
        <DictationPlayer level={levelSlug(level)} lines={set.lines} />
      </div>

      <section aria-labelledby="how-heading" className="mt-16 max-w-2xl">
        <h2 id="how-heading" className="title-sm">
          How to get the most from it
        </h2>
        <ul className="reading mt-3 list-disc space-y-2 pl-6">
          <li>Listen once at normal speed, then type everything you caught, even if it is only a few words.</li>
          <li>Use the slow speed for the words you missed, then check.</li>
          <li>Read the red-pen marks. Words with a wavy underline are close; struck-through words are wrong.</li>
        </ul>
      </section>

      <JsonLd
        data={[
          learningResourceJsonLd({ name: `${level} English dictation: ${set.title}`, description: set.intro, path, level, teaches: 'English listening and spelling', type: 'Exercise' }),
          breadcrumbJsonLd([
            { name: 'Home', path: '/' },
            { name: 'Dictation', path: '/dictation' },
            { name: `${level}: ${set.title}`, path },
          ]),
        ]}
      />
    </div>
  )
}
