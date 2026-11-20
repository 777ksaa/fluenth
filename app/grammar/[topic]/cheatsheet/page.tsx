import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { JsonLd } from '@/components/json-ld'
import { LevelChip } from '@/components/level-chip'
import { PrintButton } from '@/components/print-button'
import { getTopic, GRAMMAR_TOPICS } from '@/content/grammar'
import { breadcrumbJsonLd } from '@/lib/seo/jsonld'
import { pageMetadata } from '@/lib/seo/metadata'
import { absoluteUrl, SITE } from '@/lib/seo/site'

export const dynamicParams = false

export function generateStaticParams() {
  return GRAMMAR_TOPICS.map((t) => ({ topic: t.slug }))
}

type Props = { params: Promise<{ topic: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { topic: slug } = await params
  const topic = getTopic(slug)
  if (!topic) return {}
  return pageMetadata({
    title: `${topic.title} cheat sheet (printable, ${topic.level})`,
    description: `One-page ${topic.title.toLowerCase()} cheat sheet: the rules, tables and common mistakes. Print it or save it as a PDF.`,
    path: `/grammar/${topic.slug}/cheatsheet`,
  })
}

export default async function CheatSheet({ params }: Props) {
  const { topic: slug } = await params
  const topic = getTopic(slug)
  if (!topic) notFound()

  const path = `/grammar/${topic.slug}`
  const tables = topic.sections.filter((s) => s.table)
  const examples = topic.sections.flatMap((s) => s.examples ?? []).slice(0, 5)

  return (
    <div className="page sheet py-8 md:py-12">
      <div className="no-print mb-8 flex flex-wrap items-center gap-4">
        <PrintButton />
        <Link href={path}>Back to the lesson and quiz</Link>
      </div>

      <header className="border-b-2 border-ink pb-4">
        <div className="flex flex-wrap items-center gap-3">
          <LevelChip level={topic.level} />
          <span className="font-semibold">{SITE.name} cheat sheet</span>
        </div>
        <h1 className="title-lg mt-2">{topic.title}</h1>
      </header>

      <section aria-labelledby="rules-heading" className="mt-6">
        <h2 id="rules-heading" className="title-sm">
          Rules
        </h2>
        <ul className="mt-2 list-disc space-y-1.5 pl-6">
          {topic.rules.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
      </section>

      {tables.map((s) =>
        s.table ? (
          <section key={s.heading} className="mt-6 break-inside-avoid" aria-label={s.heading}>
            <h2 className="title-sm mb-2">{s.heading}</h2>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    {s.table.head.map((h) => (
                      <th key={h} scope="col">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {s.table.rows.map((row, ri) => (
                    <tr key={ri}>
                      {row.map((cell, ci) => (
                        <td key={ci}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null,
      )}

      {examples.length > 0 ? (
        <section aria-labelledby="examples-heading" className="mt-6 break-inside-avoid">
          <h2 id="examples-heading" className="title-sm">
            Examples
          </h2>
          <ul className="mt-2 space-y-1">
            {examples.map((e) => (
              <li key={e.en}>
                {e.en}
                {e.ru ? (
                  <span lang="ru" className="muted">
                    {' '}
                    {e.ru}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="mistakes-heading" className="mt-6 break-inside-avoid">
        <h2 id="mistakes-heading" className="title-sm mb-2">
          Common mistakes
        </h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col">Not this</th>
                <th scope="col">Say this</th>
                <th scope="col">Why</th>
              </tr>
            </thead>
            <tbody>
              {topic.mistakes.map((m) => (
                <tr key={m.wrong}>
                  <td>
                    <s>{m.wrong}</s>
                  </td>
                  <td className="font-semibold">{m.right}</td>
                  <td>{m.why}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <p className="hint mt-8 border-t border-rule pt-3">Free lesson and quiz: {absoluteUrl(path)}</p>

      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: 'Grammar', path: '/grammar' },
          { name: topic.title, path },
          { name: 'Cheat sheet', path: `${path}/cheatsheet` },
        ])}
      />
    </div>
  )
}
