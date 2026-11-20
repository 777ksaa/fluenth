import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { DrillSession } from '@/components/drill-session'
import { JsonLd } from '@/components/json-ld'
import { LevelChip } from '@/components/level-chip'
import { getTopic } from '@/content/grammar'
import { isTense, POLARITIES, TENSE_ORDER, TENSES } from '@/lib/core/drills'
import { breadcrumbJsonLd, learningResourceJsonLd } from '@/lib/seo/jsonld'
import { pageMetadata } from '@/lib/seo/metadata'

export const dynamicParams = false

export function generateStaticParams() {
  return TENSE_ORDER.map((tense) => ({ tense }))
}

type Props = { params: Promise<{ tense: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tense } = await params
  if (!isTense(tense)) return {}
  const info = TENSES[tense]
  return pageMetadata({
    title: `${info.title} drill: practise the form until it is automatic`,
    description: `${info.use} Practise the ${info.title.toLowerCase()} in statements, negatives and questions with a fresh set of sentences every time.`.slice(0, 200),
    path: `/drills/${tense}`,
  })
}

export default async function TenseDrillPage({ params }: Props) {
  const { tense } = await params
  if (!isTense(tense)) notFound()
  const info = TENSES[tense]
  const lesson = getTopic(tense)
  const path = `/drills/${tense}`

  return (
    <div className="page py-8 md:py-12">
      <Breadcrumbs
        items={[
          { name: 'Home', href: '/' },
          { name: 'Tense drills', href: '/drills' },
          { name: info.title },
        ]}
      />
      <header>
        <LevelChip level={info.level} />
        <h1 className="title-xl mt-3">{info.title} drill</h1>
        <p className="lead measure mt-4">{info.use}</p>
      </header>

      <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="measure">
          <DrillSession tense={tense} />
        </div>

        <aside className="space-y-8 lg:sticky lg:top-24 lg:self-start">
          <section aria-labelledby="structure-heading">
            <h2 id="structure-heading" className="title-sm mb-3">
              The structure
            </h2>
            <div className="table-wrap">
              <table>
                <caption className="sr-only">{info.title} structures</caption>
                <tbody>
                  {POLARITIES.map((p) => (
                    <tr key={p}>
                      <th scope="row" className="capitalize">
                        {p}
                      </th>
                      <td>{info.formulas[p]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {info.beNote ? <p className="hint mt-2">{info.beNote}</p> : null}
            <p className="reading mt-4">{info.example}</p>
          </section>

          <section aria-labelledby="signals-heading">
            <h2 id="signals-heading" className="title-sm mb-3">
              Words that go with it
            </h2>
            <ul className="flex flex-wrap gap-2">
              {info.signals.map((s) => (
                <li key={s} className="chip">
                  {s}
                </li>
              ))}
            </ul>
          </section>

          {lesson ? (
            <p>
              <Link href={`/grammar/${lesson.slug}`}>Read the full {info.title.toLowerCase()} lesson</Link>
            </p>
          ) : null}
        </aside>
      </div>

      <JsonLd
        data={[
          learningResourceJsonLd({ name: `${info.title} drill`, description: info.use, path, level: info.level, teaches: info.title, type: 'Exercise' }),
          breadcrumbJsonLd([
            { name: 'Home', path: '/' },
            { name: 'Tense drills', path: '/drills' },
            { name: info.title, path },
          ]),
        ]}
      />
    </div>
  )
}
