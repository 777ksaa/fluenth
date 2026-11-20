'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import type { XpResult } from '@/lib/types'
import { useProfile } from './profile-context'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const STARTERS = [
  'Correct this sentence: She don’t like coffee.',
  'What is the difference between make and do?',
  'Give me three questions to practise the past simple.',
]

const ERRORS: Record<string, string> = {
  limit: 'You have used today’s free AI messages. They reset tomorrow, and everything else on the site still works.',
  unavailable: 'The tutor is not available right now. Try again in a few minutes.',
  invalid: 'That message could not be sent. Keep it under 1,000 characters.',
  failed: 'The tutor could not answer. Try again.',
}

export function TutorChat() {
  const pathname = usePathname()
  const { applyXp } = useProfile()
  const [messages, setMessages] = useState<Message[]>([])
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [needsSignIn, setNeedsSignIn] = useState(false)
  const end = useRef<HTMLDivElement>(null)

  useEffect(() => {
    end.current?.scrollIntoView({ block: 'end' })
  }, [messages, busy])

  async function send(text: string) {
    const content = text.trim()
    if (!content || busy) return
    const history: Message[] = [...messages, { role: 'user', content }]
    setMessages(history)
    setDraft('')
    setError(null)
    setBusy(true)
    try {
      const res = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      })
      const data = (await res.json().catch(() => ({}))) as { reply?: string; xp?: XpResult | null; error?: string }
      if (res.ok && data.reply) {
        setMessages([...history, { role: 'assistant', content: data.reply }])
        applyXp(data.xp)
      } else if (res.status === 401) {
        setNeedsSignIn(true)
      } else {
        setError(ERRORS[data.error ?? 'failed'] ?? ERRORS.failed)
      }
    } catch {
      setError('The connection failed. Check your internet and try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="min-h-[14rem] space-y-4" aria-live="polite">
        {messages.length === 0 ? (
          <div>
            <p className="muted">Ask about grammar, vocabulary or a sentence you are unsure of. Try one of these:</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {STARTERS.map((s) => (
                <li key={s}>
                  <button type="button" className="chip chip-link cursor-pointer" onClick={() => void send(s)}>
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <ol className="space-y-4">
            {messages.map((m, i) => (
              <li key={i} className={m.role === 'user' ? 'ml-auto max-w-[85%] rounded-xl bg-pen-soft px-4 py-3' : 'max-w-[92%] rounded-xl border border-rule bg-surface px-4 py-3'}>
                <p className="mb-1 text-xs font-semibold text-muted">{m.role === 'user' ? 'You' : 'Tutor'}</p>
                <p className="whitespace-pre-wrap">{m.content}</p>
              </li>
            ))}
          </ol>
        )}
        {busy ? <p className="muted" role="status">The tutor is writing…</p> : null}
        <div ref={end} />
      </div>

      {needsSignIn ? (
        <p role="alert" className="panel">
          <Link href={`/login?next=${encodeURIComponent(pathname)}`}>Sign in</Link> to talk to the tutor. It is free.
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm text-redpen">
          {error}
        </p>
      ) : null}

      <form
        onSubmit={(e: { preventDefault: () => void }) => {
          e.preventDefault()
          void send(draft)
        }}
      >
        <label htmlFor="tutor-draft" className="label">
          Your message
        </label>
        <textarea
          id="tutor-draft"
          rows={3}
          value={draft}
          onChange={(e: { target: { value: string } }) => setDraft(e.target.value)}
          onKeyDown={(e: { key: string; shiftKey: boolean; preventDefault: () => void }) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              void send(draft)
            }
          }}
          maxLength={1000}
          className="field w-full"
        />
        <div className="mt-3 flex flex-wrap items-center gap-4">
          <button type="submit" className="btn btn-primary" disabled={busy || draft.trim() === ''}>
            Send
          </button>
          <span className="hint">Enter sends, Shift+Enter adds a line. Answers are written by AI and can contain mistakes.</span>
        </div>
      </form>
    </div>
  )
}
