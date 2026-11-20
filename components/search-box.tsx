'use client'

import { useRouter } from 'next/navigation'
import { useId, useState } from 'react'
import type { FormEvent } from 'react'
import { normalizeWord, wordToSlug } from '@/lib/core/words'
import { SearchIcon } from './icons'

interface Props {
  /** "hero" is the big ruled line on the home and vocabulary pages; "compact" sits in the header. */
  size?: 'hero' | 'compact'
  autoFocus?: boolean
  defaultValue?: string
}

export function SearchBox({ size = 'hero', autoFocus = false, defaultValue = '' }: Props) {
  const router = useRouter()
  const id = useId()
  const [value, setValue] = useState(defaultValue)
  const [error, setError] = useState('')
  const compact = size === 'compact'

  function submit(event: FormEvent) {
    event.preventDefault()
    const word = normalizeWord(value)
    if (!word) {
      setError('Type an English word or phrase, using letters only.')
      return
    }
    setError('')
    router.push(`/vocabulary/${encodeURIComponent(wordToSlug(word))}`)
  }

  return (
    <form role="search" onSubmit={submit} className="w-full">
      <label htmlFor={id} className="sr-only">
        Look up any English word or phrase
      </label>
      <div className="flex items-end gap-3">
        <input
          id={id}
          type="search"
          value={value}
          onChange={(e: { target: { value: string } }) => {
            setValue(e.target.value)
            if (error) setError('')
          }}
          placeholder={compact ? 'Look up a word' : 'Look up any word or idiom'}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          autoFocus={autoFocus}
          maxLength={80}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`ruled-input ${compact ? 'ruled-input-compact' : ''}`}
        />
        <button type="submit" className={`btn btn-primary ${compact ? 'btn-icon' : ''}`} aria-label="Look up this word">
          <SearchIcon size={compact ? 18 : 20} />
          {compact ? null : <span>Look up</span>}
        </button>
      </div>
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-2 text-sm text-redpen">
          {error}
        </p>
      ) : null}
    </form>
  )
}
