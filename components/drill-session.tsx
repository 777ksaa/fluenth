'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState, useTransition } from 'react'
import { submitDrill } from '@/lib/actions/progress'
import { checkDrill, makeDrill } from '@/lib/core/drills'
import type { DrillCheck, DrillItem, Tense } from '@/lib/core/drills'
import { Correction } from './correction'
import { CheckIcon, RefreshIcon } from './icons'
import { useProfile } from './profile-context'
import { SpeakButton } from './speak-button'

const COUNT = 12 // four of each: affirmative, negative, question

interface Props {
  tense: Tense
}

/**
 * Pattern drill in the style of a phrase-book course: a cue, the structure to use, and you
 * produce the sentence. The set is generated in the browser when you press start, so it is
 * different every time and the page itself stays static.
 */
export function DrillSession({ tense }: Props) {
  const pathname = usePathname()
  const { applyXp } = useProfile()
  const [items, setItems] = useState<DrillItem[] | null>(null)
  const [index, setIndex] = useState(0)
  const [answer, setAnswer] = useState('')
  const [check, setCheck] = useState<DrillCheck | null>(null)
  const [correct, setCorrect] = useState(0)
  const [showFormula, setShowFormula] = useState(false)
  const [guest, setGuest] = useState(false)
  const sent = useRef(false) // a ref, not state: React's dev double-run of effects must not record the set twice
  const [, startTransition] = useTransition()
  const input = useRef<HTMLInputElement>(null)
  const next = useRef<HTMLButtonElement>(null)

  const finished = items !== null && index >= items.length

  useEffect(() => {
    if (items && !finished) input.current?.focus()
  }, [items, index, finished])

  // Record the result once, when the set is finished.
  useEffect(() => {
    if (!finished || sent.current || !items) return
    sent.current = true
    startTransition(async () => {
      const response = await submitDrill(tense, correct, items.length)
      if (response.ok) applyXp(response.xp)
      else if (response.error === 'auth') setGuest(true)
    })
  }, [finished, items, tense, correct, applyXp])

  function start() {
    const seed = Math.floor(Math.random() * 2 ** 31)
    setItems(makeDrill({ tenses: [tense], count: COUNT, seed }))
    setIndex(0)
    setAnswer('')
    setCheck(null)
    setCorrect(0)
    sent.current = false
    setGuest(false)
    setShowFormula(false)
  }

  if (items === null) {
    return (
      <div className="panel space-y-3">
        <p>
          {COUNT} sentences: four statements, four negatives and four questions. Each one gives you the words; you write the
          sentence in the right form.
        </p>
        <button type="button" className="btn btn-primary" onClick={start}>
          Start a {COUNT}-sentence drill
        </button>
      </div>
    )
  }

  if (finished) {
    const percent = Math.round((correct / items.length) * 100)
    return (
      <div role="status" className="panel space-y-3">
        <p className="title-md">
          {correct} of {items.length} correct ({percent}%)
        </p>
        <p>{percent >= 90 ? 'Excellent. The pattern is automatic.' : percent >= 70 ? 'Good. Run it again to make it automatic.' : 'Check the structure above, then run another set.'}</p>
        {guest ? (
          <p className="hint">
            <Link href={`/login?next=${encodeURIComponent(pathname)}`}>Sign in</Link> to save your drills and earn XP.
          </p>
        ) : null}
        <button type="button" className="btn btn-primary" onClick={start}>
          <RefreshIcon size={18} />
          <span>Another set</span>
        </button>
      </div>
    )
  }

  const item = items[index]

  function submit() {
    if (answer.trim() === '' || check) return
    const result = checkDrill(item, answer)
    setCheck(result)
    if (result.correct) setCorrect((c) => c + 1)
    setTimeout(() => next.current?.focus(), 0)
  }

  function advance() {
    setIndex((i) => i + 1)
    setAnswer('')
    setCheck(null)
    setShowFormula(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold">
          Sentence {index + 1} of {items.length}
        </p>
        <div className="bar mt-2" aria-hidden="true">
          <span style={{ width: `${(index / items.length) * 100}%` }} />
        </div>
      </div>

      <div className="index-card">
        <p className="hint">{item.prompt}</p>
        <p className="title-lg mt-1">{item.cue}</p>
        {showFormula ? (
          <p className="mt-3 font-semibold text-pen">{item.formula}</p>
        ) : (
          <button type="button" className="btn btn-quiet btn-sm mt-3" onClick={() => setShowFormula(true)}>
            Show the structure
          </button>
        )}
      </div>

      <div>
        <label htmlFor="drill-answer" className="label">
          Write the full sentence
        </label>
        <div className="flex flex-wrap gap-3">
          <input
            id="drill-answer"
            ref={input}
            type="text"
            value={answer}
            disabled={check !== null}
            onChange={(e: { target: { value: string } }) => setAnswer(e.target.value)}
            onKeyDown={(e: { key: string }) => {
              if (e.key === 'Enter') submit()
            }}
            autoComplete="off"
            autoCapitalize="sentences"
            spellCheck={false}
            maxLength={200}
            className="field reading min-w-[16rem] flex-1"
          />
          {check === null ? (
            <button type="button" className="btn btn-primary" onClick={submit} disabled={answer.trim() === ''}>
              Check
            </button>
          ) : null}
        </div>
      </div>

      {check ? (
        <div className="panel space-y-3">
          {check.correct ? (
            <p role="status" className="flex items-center gap-2 title-sm text-ok">
              <CheckIcon size={20} />
              Correct
            </p>
          ) : (
            <>
              <p role="status" className="title-sm">
                Not quite
              </p>
              <Correction tokens={check.diff.tokens} />
            </>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <SpeakButton text={item.expected} label="Hear the correct sentence">
              Hear it
            </SpeakButton>
            <button ref={next} type="button" className="btn btn-primary" onClick={advance}>
              {index + 1 < items.length ? 'Next sentence' : 'See my result'}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
