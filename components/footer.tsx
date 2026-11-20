import Link from 'next/link'
import { LEVELS, levelSlug } from '@/lib/core/levels'
import { SITE } from '@/lib/seo/site'

const LEARN = [
  { href: '/vocabulary', label: 'English dictionary' },
  { href: '/grammar', label: 'Grammar A1 to C2' },
  { href: '/dictation', label: 'Dictation' },
  { href: '/speaking', label: 'Speaking dialogues' },
  { href: '/drills', label: 'Tense drills' },
  { href: '/tutor', label: 'AI tutor' },
]

export function Footer() {
  return (
    <footer className="no-print mt-20 border-t border-rule pb-28 pt-10 md:pb-10">
      <div className="page grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="title-sm">{SITE.name}</p>
          <p className="muted mt-2 max-w-sm text-sm">{SITE.description}</p>
        </div>
        <nav aria-label="Learn">
          <p className="mb-2 font-semibold">Learn</p>
          <ul className="space-y-1 text-sm">
            {LEARN.map((l) => (
              <li key={l.href}>
                <Link href={l.href}>{l.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Levels and about">
          <p className="mb-2 font-semibold">Grammar by level</p>
          <ul className="flex flex-wrap gap-2 text-sm">
            {LEVELS.map((level) => (
              <li key={level}>
                <Link href={`/grammar#level-${levelSlug(level)}`} className="lv no-underline" data-level={level}>
                  {level}
                </Link>
              </li>
            ))}
          </ul>
          <ul className="mt-4 space-y-1 text-sm">
            <li><Link href="/about">About and data sources</Link></li>
            <li><Link href="/privacy">Privacy</Link></li>
          </ul>
        </nav>
      </div>
      <p className="page muted mt-8 text-xs">
        Definitions come from Wiktionary (CC BY-SA 3.0) through the Free Dictionary API. Related words by Datamuse. Real-speech clips
        are provided by YouGlish and YouTube.
      </p>
    </footer>
  )
}
