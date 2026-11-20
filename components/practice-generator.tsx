'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { LEVEL_INFO, LEVELS, isLevel } from '@/lib/core/levels'
import type { QuizQuestion } from '@/lib/core/quiz'
import { useProfile } from './profile-context'
import { Quiz } from './quiz'

const TOPIC = /^[\p{L}\p{N} ,.'\-()/]{3,80}$/u

const ERRORS: Record<string, string> = {
  limit: 'You have used today’s free AI exercises. They reset tomorrow.',
  unavailable: 'Exercise generation is not available right now. Try again in a few minutes.',
  invalid: 'Use 3 to 80 letters, numbers and basic punctuation for the topic.',
  failed: 'The exercises could not be made this time. Try again, or reword the topic.',
}

export function PracticeGenerator() {
  const pathname = usePathname()
  const { profile } = useProfile()
  const [topic, setTopic] = useState('')
  const [level, setLevel] = useState('B1')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [needsSignIn, setNeedsSignIn] = useState(false)
  const [set, setSet] = useState<{ id: number; questions: QuizQuestion[] } | null>(null)
  const touched = useRef(false)

  const profileLevel = profile?.cefr_level
  useEffect(() => {
    if (!touched.current && profileLevel && isLevel(profileLevel)) setLevel(profileLevel)
  }, [profileLevel])

  async function generate() {
    const clean = topic.replace(/\s+/g, ' ').trim()
    if (!TOPIC.test(clean)) {
      setError(ERRORS.invalid)
      return
    }
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/practice', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ topic: clean, level }),
      })
      const data = (await res.json().catch(() => ({}))) as { questions?: QuizQuestion[]; error?: string }
      if (res.ok && data.questions?.length) setSet({ id: Date.now(), questions: data.questions })
      else if (res.status === 401) setNeedsSignIn(true)
      else setError(ERRORS[data.error ?? 'failed'] ?? ERRORS.failed)
    } catch {
      setError('The connection failed. Check your internet and try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-10">
      <form
        className="panel space-y-4"
        onSubmit={(e: { preventDefault: () => void }) => {
          e.preventDefault()
          void generate()
        }}
      >
        <div>
          <label htmlFor="practice-topic" className="label">
            What do you want to practise?
          </label>
          <input
            id="practice-topic"
            type="text"
            value={topic}
            onChange={(e: { target: { value: string } }) => setTopic(e.target.value)}
            placeholder="For example: phrasal verbs with get, or articles"
            maxLength={80}
            autoComplete="off"
            className="field w-full"
          />
        </div>
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label htmlFor="practice-level" className="label">
              Level
            </label>
            <select
              id="practice-level"
              value={level}
              onChange={(e: { target: { value: string } }) => {
                touched.current = true
                setLevel(e.target.value)
              }}
              className="field"
            >
              {LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l}, {LEVEL_INFO[l].name}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn btn-primary" disabled={busy || topic.trim().length < 3}>
            {busy ? 'Making your exercises…' : set ? 'Make another set' : 'Make exercises'}
          </button>
        </div>
        {error ? (
          <p role="alert" className="text-sm text-redpen">
            {error}
          </p>
        ) : null}
        {needsSignIn ? (
          <p role="alert" className="text-sm">
            <Link href={`/login?next=${encodeURIComponent(pathname)}`}>Sign in</Link> to make exercises. It is free.
          </p>
        ) : null}
      </form>

      {set ? (
        <section aria-labelledby="set-heading">
          <h2 id="set-heading" className="title-md mb-4">
            Your exercises
          </h2>
          <Quiz key={set.id} questions={set.questions} />
          <p className="hint mt-6">Written by AI and checked by a program, but an answer can still be debatable. Ask the tutor if you are unsure.</p>
        </section>
      ) : null}
    </div>
  )
}
