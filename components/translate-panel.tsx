'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState, useTransition } from 'react'
import { translateEntry } from '@/lib/actions/translate'
import { isSupportedLang, LANG_NAMES } from '@/lib/core/languages'
import { useProfile } from './profile-context'

type Found = { translation: string; example?: string }

interface Props {
  word: string
  /** Translations already cached for this word, keyed by language code. */
  initial: Record<string, { translation?: string; example?: string }>
}

const MESSAGES = {
  limit: 'You have used today’s AI translations. Cached translations still work; try again tomorrow.',
  failed: 'The translation could not be made right now. Try again in a moment.',
  invalid: 'This word cannot be translated.',
} as const

export function TranslatePanel({ word, initial }: Props) {
  const pathname = usePathname()
  const { profile } = useProfile()
  const [lang, setLang] = useState('ru')
  const [found, setFound] = useState<Record<string, Found>>(() => {
    const seed: Record<string, Found> = {}
    for (const [code, value] of Object.entries(initial)) if (value.translation) seed[code] = { translation: value.translation, example: value.example }
    return seed
  })
  const [error, setError] = useState<keyof typeof MESSAGES | 'auth' | null>(null)
  const [pending, startTransition] = useTransition()
  const touched = useRef(false)

  // Follow the learner's saved native language until they pick one themselves.
  const native = profile?.native_lang
  useEffect(() => {
    if (!touched.current && native && isSupportedLang(native)) setLang(native)
  }, [native])

  const current = found[lang]

  function translate() {
    setError(null)
    startTransition(async () => {
      const result = await translateEntry(word, lang)
      if (result.ok) setFound((prev) => ({ ...prev, [lang]: { translation: result.translation, example: result.example } }))
      else setError(result.error === 'auth' ? 'auth' : result.error === 'limit' ? 'limit' : result.error === 'invalid' ? 'invalid' : 'failed')
    })
  }

  return (
    <div className="panel space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[12rem] flex-1">
          <label htmlFor="translate-lang" className="label">
            Translate into
          </label>
          <select
            id="translate-lang"
            className="field"
            value={lang}
            onChange={(e: { target: { value: string } }) => {
              touched.current = true
              setLang(e.target.value)
              setError(null)
            }}
          >
            {Object.entries(LANG_NAMES).map(([code, name]) => (
              <option key={code} value={code}>
                {name}
              </option>
            ))}
          </select>
        </div>
        {current ? null : (
          <button type="button" className="btn btn-primary" onClick={translate} disabled={pending}>
            {pending ? 'Translating…' : `Translate to ${LANG_NAMES[lang]}`}
          </button>
        )}
      </div>

      {current ? (
        <div lang={lang}>
          <p className="title-sm">{current.translation}</p>
          {current.example ? <p className="reading muted mt-1">{current.example}</p> : null}
        </div>
      ) : null}

      {error === 'auth' ? (
        <p className="text-sm">
          <Link href={`/login?next=${encodeURIComponent(pathname)}`}>Sign in</Link> to translate words into your language.
        </p>
      ) : error ? (
        <p role="alert" className="text-sm text-redpen">
          {MESSAGES[error]}
        </p>
      ) : null}
    </div>
  )
}
