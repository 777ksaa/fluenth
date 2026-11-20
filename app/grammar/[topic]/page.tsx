import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { JsonLd } from '@/components/json-ld'
import { LevelChip } from '@/components/level-chip'
import { CheckIcon, PrinterIcon } from '@/components/icons'
import { Quiz } from '@/components/quiz'
import { SpeakButton } from '@/components/speak-button'
import { VideoClips } from '@/components/video-clips'
import { getDictationSet } from '@/content/dictation'
import { getTopic, GRAMMAR_TOPICS } from '@/content/grammar'
import type { GrammarTopic } from '@/content/grammar'
import { isTense, TENSES } from '@/lib/core/drills'
import { levelSlug } from '@/lib/core/levels'
import { approvedClips, youglishEnabled } from '@/lib/media'
import { breadcrumbJsonLd, learningResourceJsonLd } from '@/lib/seo/jsonld'
import { pageMetadata } from '@/lib/seo/metadata'

// Only the lessons that exist are valid URLs: anything else is a 404, never an empty page.
export const dynamicParams = false
// Hourly, so a clip approved in the database shows up without a redeploy.
export const revalidate = 3600

export function generateStaticParams() {
  return GRAMMAR_TOPICS.map((t) => ({ topic: t.slug }))
}

type Props = { params: Promise<{ topic: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { topic: slug } = await params
  const topic = getTopic(slug)
  if (!topic) return {}
  return pageMetadata({
    title: `${topic.title}: rules, examples and quiz (${topic.level})`,
    description: topic.summary,
    path: `/grammar/${topic.slug}`,
    type: 'article',
  })
}

export default async function TopicPage({ params }: Props) {
  const { topic: slug } = await params
  const topic = getTopic(slug)
  if (!topic) notFound()

  const path = `/grammar/${topic.slug}`
  const clips = await approvedClips('grammar', topic.slug)
  const related = topic.related.map((s) => getTopic(s)).filter((t): t is GrammarTopic => t !== undefined)
  const dictation = getDictationSet(topic.level)

  return (
    <div className="page py-8 md:py-12">
      <Breadcrumbs
        items={[
          { name: 'Home', href: '/' },
          { name: 'Grammar', href: '/grammar' },
          { name: topic.level, href: `/grammar#level-${levelSlug(topic.level)}` },
          { name: topic.title },
        ]}
      />

      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <article>
          <header>
            <LevelChip level={topic.level} />
            <h1 className="title-xl mt-3">{topic.title}</h1>
            <p className="lead measure mt-4">{topic.summary}</p>
            <div className="mt-6">
              <Link className="btn btn-primary" href={`${path}/cheatsheet`}>
                <PrinterIcon size={18} />
                <span>Printable cheat sheet</span>
              </Link>
            </div>
          </header>

          <section aria-labelledby="rules-heading" className="index-card mt-10">
            <h2 id="rules-heading" className="title-md">
              The rules in short
            </h2>
            <ul className="reading mt-3 list-disc space-y-2 pl-6">
              {topic.rules.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ul>
          </section>

          <div className="mt-12 space-y-12">
            {topic.sections.map((section) => (
              <section key={section.heading} aria-labelledby={`s-${section.heading}`}>
                <h2 id={`s-${section.heading}`} className="title-md">
                  {section.heading}
                </h2>
                {section.body?.map((p) => (
                  <p key={p} className="reading measure mt-3">
                    {p}
                  </p>
                ))}
                {section.table ? (
                  <div className="table-wrap mt-4">
                    <table>
                      <caption className="sr-only">{section.heading}</caption>
                      <thead>
                        <tr>
                          {section.table.head.map((h) => (
                            <th key={h} scope="col">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {section.table.rows.map((row, ri) => (
                          <tr key={ri}>
                            {row.map((cell, ci) => (
                              <td key={ci}>{cell}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}
                {section.examples ? (
                  <ul className="ruled mt-4">
                    {section.examples.map((e) => (
                      <li key={e.en} className="flex items-start justify-between gap-3">
                        <div>
                          <p className="reading">{e.en}</p>
                          {e.ru ? (
                            <p lang="ru" className="muted">
                              {e.ru}
                            </p>
                          ) : null}
                        </div>
                        <SpeakButton text={e.en} label={`Listen: ${e.en}`} />
                      </li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))}

            <section aria-labelledby="mistakes-heading">
              <h2 id="mistakes-heading" className="title-md">
                Mistakes to avoid
              </h2>
              <ul className="ruled mt-3">
                {topic.mistakes.map((m) => (
                  <li key={m.wrong}>
                    <p className="reading">
                      <span className="sr-only">Wrong: </span>
                      <s className="text-redpen decoration-2">{m.wrong}</s>
                    </p>
                    <p className="reading flex items-center gap-2 font-semibold text-ok">
                      <CheckIcon size={18} />
                      <span>
                        <span className="sr-only">Right: </span>
                        {m.right}
                      </span>
                    </p>
                    <p className="muted mt-1 text-sm">{m.why}</p>
                  </li>
                ))}
              </ul>
            </section>

            <section aria-labelledby="quiz-heading">
              <h2 id="quiz-heading" className="title-md mb-4">
                Test yourself
              </h2>
              <Quiz slug={topic.slug} questions={topic.quiz} />
            </section>
          </div>
        </article>

        <aside className="space-y-10 lg:sticky lg:top-24 lg:self-start">
          <section aria-labelledby="video-heading">
            <h2 id="video-heading" className="title-sm mb-3">
              Hear it in real speech
            </h2>
            <VideoClips query={topic.youglish} clips={clips} youglish={youglishEnabled()} />
          </section>
          <section aria-labelledby="next-heading">
            <h2 id="next-heading" className="title-sm mb-3">
              Keep practising
            </h2>
            <ul className="ruled">
              {isTense(topic.slug) ? (
                <li>
                  <Link href={`/drills/${topic.slug}`}>Drill the {TENSES[topic.slug].title.toLowerCase()}</Link>
                </li>
              ) : null}
              {dictation ? (
                <li>
                  <Link href={`/dictation/${levelSlug(topic.level)}`}>Dictation at level {topic.level}</Link>
                </li>
              ) : null}
              {related.map((t) => (
                <li key={t.slug}>
                  <Link href={`/grammar/${t.slug}`}>{t.title}</Link>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>

      <JsonLd
        data={[
          learningResourceJsonLd({ name: topic.title, description: topic.summary, path, level: topic.level, teaches: topic.title, type: 'Lesson' }),
          breadcrumbJsonLd([
            { name: 'Home', path: '/' },
            { name: 'Grammar', path: '/grammar' },
            { name: topic.title, path },
          ]),
        ]}
      />
    </div>
  )
}
