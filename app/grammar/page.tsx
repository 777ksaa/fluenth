import { Breadcrumbs } from '@/components/breadcrumbs'
import { JsonLd } from '@/components/json-ld'
import { LevelChip } from '@/components/level-chip'
import { TopicList } from '@/components/topic-list'
import { groupedByLevel } from '@/content/grammar'
import { LEVEL_INFO, levelSlug } from '@/lib/core/levels'
import { breadcrumbJsonLd } from '@/lib/seo/jsonld'
import { pageMetadata } from '@/lib/seo/metadata'

export const metadata = pageMetadata({
  title: 'English grammar from A1 to C2: lessons, quizzes and cheat sheets',
  description:
    'Free English grammar lessons organised by CEFR level, from A1 to C2. Clear rules, examples with translations, common mistakes, a quiz and a printable cheat sheet for every topic.',
  path: '/grammar',
})

export default function GrammarIndex() {
  const groups = groupedByLevel()
  return (
    <div className="page py-8 md:py-12">
      <Breadcrumbs items={[{ name: 'Home', href: '/' }, { name: 'Grammar' }]} />
      <h1 className="title-xl">English grammar, A1 to C2</h1>
      <p className="lead measure mt-4">
        Every lesson puts the rules on one screen, then gives examples with translations, the mistakes learners make most, a
        quiz and a cheat sheet you can print.
      </p>

      <div className="mt-14 space-y-16">
        {groups.map(({ level, topics, planned }) => (
          <section key={level} id={`level-${levelSlug(level)}`} aria-labelledby={`heading-${levelSlug(level)}`} className="scroll-mt-24">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <LevelChip level={level} />
              <h2 id={`heading-${levelSlug(level)}`} className="title-md">
                {LEVEL_INFO[level].name}
              </h2>
            </div>
            <p className="muted measure mt-2">{LEVEL_INFO[level].canDo}</p>
            {topics.length > 0 ? (
              <TopicList topics={topics.map((t) => ({ slug: t.slug, title: t.title, summary: t.summary }))} />
            ) : null}
            {planned.length > 0 ? <p className="hint mt-4 max-w-2xl">Lessons planned next: {planned.join(', ')}.</p> : null}
          </section>
        ))}
      </div>

      <JsonLd data={breadcrumbJsonLd([{ name: 'Home', path: '/' }, { name: 'Grammar', path: '/grammar' }])} />
    </div>
  )
}
