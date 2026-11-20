import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { DialoguePlayer } from '@/components/dialogue-player'
import { JsonLd } from '@/components/json-ld'
import { LevelChip } from '@/components/level-chip'
import { SpeakButton } from '@/components/speak-button'
import { DIALOGUES, getDialogue } from '@/content/dialogues'
import { breadcrumbJsonLd, learningResourceJsonLd } from '@/lib/seo/jsonld'
import { pageMetadata } from '@/lib/seo/metadata'

export const dynamicParams = false

export function generateStaticParams() {
  return DIALOGUES.map((d) => ({ slug: d.slug }))
}

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const dialogue = getDialogue(slug)
  if (!dialogue) return {}
  return pageMetadata({
    title: `${dialogue.title}: ${dialogue.level} English dialogue`,
    description: dialogue.summary,
    path: `/speaking/${dialogue.slug}`,
  })
}

export default async function DialoguePage({ params }: Props) {
  const { slug } = await params
  const dialogue = getDialogue(slug)
  if (!dialogue) notFound()
  const path = `/speaking/${dialogue.slug}`

  return (
    <div className="page py-8 md:py-12">
      <Breadcrumbs
        items={[
          { name: 'Home', href: '/' },
          { name: 'Speaking', href: '/speaking' },
          { name: dialogue.title },
        ]}
      />
      <header>
        <LevelChip level={dialogue.level} />
        <h1 className="title-xl mt-3">{dialogue.title}</h1>
        <p className="lead measure mt-4">{dialogue.summary}</p>
      </header>

      <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <DialoguePlayer dialogue={dialogue} />

        <aside aria-labelledby="phrases-heading" className="lg:sticky lg:top-24 lg:self-start">
          <h2 id="phrases-heading" className="title-sm mb-3">
            Useful phrases
          </h2>
          <ul className="ruled">
            {dialogue.phrases.map((p) => (
              <li key={p.phrase} className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{p.phrase}</p>
                  <p className="muted text-sm">{p.meaning}</p>
                </div>
                <SpeakButton text={p.phrase.replace(/\.\.\./g, '')} label={`Listen: ${p.phrase}`} />
              </li>
            ))}
          </ul>
        </aside>
      </div>

      <JsonLd
        data={[
          learningResourceJsonLd({ name: dialogue.title, description: dialogue.summary, path, level: dialogue.level, teaches: 'English conversation', type: 'Dialogue' }),
          breadcrumbJsonLd([
            { name: 'Home', path: '/' },
            { name: 'Speaking', path: '/speaking' },
            { name: dialogue.title, path },
          ]),
        ]}
      />
    </div>
  )
}
