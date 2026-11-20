'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRef, useState, useTransition } from 'react'
import { completePractice, submitQuiz } from '@/lib/actions/progress'
import { gradeQuiz, PASS_MARK } from '@/lib/core/quiz'
import type { QuizAnswer, QuizQuestion, QuizResult } from '@/lib/core/quiz'
import { CheckIcon, CloseIcon, RefreshIcon } from './icons'
import { useProfile } from './profile-context'

type Saved = { state: 'idle' } | { state: 'saving' } | { state: 'saved'; best: number | null } | { state: 'guest' } | { state: 'failed' }

interface Props {
  /** Grammar topic slug: the server re-grades the answers against this topic's quiz. Leave it out for a generated practice set. */
  slug?: string
  questions: QuizQuestion[]
}

export function Quiz({ slug, questions }: Props) {
  const pathname = usePathname()
  const { applyXp } = useProfile()
  const [answers, setAnswers] = useState<QuizAnswer[]>(() => questions.map(() => null))
  const [result, setResult] = useState<QuizResult | null>(null)
  const [saved, setSaved] = useState<Saved>({ state: 'idle' })
  const [, startTransition] = useTransition()
  const summary = useRef<HTMLDivElement>(null)

  const unanswered = answers.filter((a) => a === null || (typeof a === 'string' && a.trim() === '')).length

  function setAnswer(index: number, value: QuizAnswer) {
    setAnswers((prev) => prev.map((a, i) => (i === index ? value : a)))
  }

  function check() {
    const graded = gradeQuiz(questions, answers)
    setResult(graded)
    setSaved({ state: 'saving' })
    // Focus the summary once it has rendered.
    setTimeout(() => summary.current?.focus(), 0)
    startTransition(async () => {
      if (slug) {
        const response = await submitQuiz(slug, answers)
        if (response.ok) {
          applyXp(response.xp)
          setSaved({ state: 'saved', best: response.best })
        } else setSaved({ state: response.error === 'auth' ? 'guest' : 'failed' })
      } else {
        const response = await completePractice(graded.score)
        if (response.ok) {
          applyXp(response.xp)
          setSaved({ state: 'saved', best: null })
        } else setSaved({ state: response.error === 'auth' ? 'guest' : 'failed' })
      }
    })
  }

  function reset() {
    setAnswers(questions.map(() => null))
    setResult(null)
    setSaved({ state: 'idle' })
  }

  return (
    <div>
      <ol className="ruled list-decimal pl-6 marker:font-bold marker:text-pen">
        {questions.map((q, i) => {
          const r = result?.results[i]
          const value = answers[i]
          return (
            <li key={q.id} className="pl-2">
              <fieldset disabled={result !== null} className="min-w-0 border-0 p-0">
                {q.type === 'choice' ? (
                  <>
                    <legend className="reading">{q.prompt}</legend>
                    <div className="mt-3 grid gap-2">
                      {q.options.map((option, oi) => {
                        const chosen = value === oi
                        const tone = result
                          ? oi === q.answer
                            ? 'border-ok bg-ok-soft'
                            : chosen
                              ? 'border-redpen bg-redpen-soft'
                              : 'border-rule'
                          : 'border-rule has-[:checked]:border-pen has-[:checked]:bg-pen-soft'
                        return (
                          <label key={oi} className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 ${tone}`}>
                            <input type="radio" name={q.id} checked={chosen} onChange={() => setAnswer(i, oi)} className="accent-pen" />
                            <span>{option}</span>
                          </label>
                        )
                      })}
                    </div>
                  </>
                ) : (
                  <FillPrompt
                    prompt={q.prompt}
                    value={typeof value === 'string' ? value : ''}
                    label={`Answer for question ${i + 1}`}
                    onChange={(v) => setAnswer(i, v)}
                  />
                )}
              </fieldset>

              {r ? (
                <div className="mt-3 text-sm">
                  <p className={`flex items-center gap-2 font-semibold ${r.correct ? 'text-ok' : 'text-redpen'}`}>
                    {r.correct ? <CheckIcon size={16} /> : <CloseIcon size={16} />}
                    {r.correct ? 'Correct' : `Not quite. The answer is: ${r.expected}`}
                  </p>
                  <p className="muted mt-1">{r.explanation}</p>
                </div>
              ) : null}
            </li>
          )
        })}
      </ol>

      <div className="mt-6">
        {result === null ? (
          <div className="flex flex-wrap items-center gap-4">
            <button type="button" className="btn btn-primary" onClick={check}>
              Check my answers
            </button>
            {unanswered > 0 ? (
              <span className="hint">
                {unanswered} of {questions.length} not answered yet. Blank answers count as wrong.
              </span>
            ) : null}
          </div>
        ) : (
          <div ref={summary} tabIndex={-1} role="status" className="panel space-y-3 outline-none">
            <p className="title-md">
              {result.correct} of {result.total} correct ({result.score}%)
            </p>
            <p>
              {result.passed
                ? slug
                  ? 'You passed. This topic is marked as done.'
                  : 'You passed this set.'
                : `The pass mark is ${PASS_MARK}%. Read the rules again, then try the questions you missed.`}
            </p>
            <p className="hint">
              {saved.state === 'saving' ? 'Saving your score…' : null}
              {saved.state === 'saved' ? (saved.best !== null ? `Your best score on this topic is ${saved.best}%.` : 'Saved. Practice sets earn a little XP.') : null}
              {saved.state === 'failed' ? 'Your score could not be saved. Your answers above are still right.' : null}
              {saved.state === 'guest' ? (
                <>
                  <Link href={`/login?next=${encodeURIComponent(pathname)}`}>Sign in</Link> to save your score, keep your streak and earn XP.
                </>
              ) : null}
            </p>
            <button type="button" className="btn btn-quiet" onClick={reset}>
              <RefreshIcon size={18} />
              <span>Try again</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function FillPrompt({ prompt, value, label, onChange }: { prompt: string; value: string; label: string; onChange: (value: string) => void }) {
  const input = (
    <input
      type="text"
      value={value}
      onChange={(e: { target: { value: string } }) => onChange(e.target.value)}
      aria-label={label}
      autoComplete="off"
      autoCapitalize="none"
      spellCheck={false}
      maxLength={60}
      className="ruled-input ruled-input-compact mx-1 inline-block w-44 text-center"
    />
  )
  const parts = prompt.split('___')
  if (parts.length === 2) {
    return (
      <p className="reading">
        {parts[0]}
        {input}
        {parts[1]}
      </p>
    )
  }
  return (
    <>
      <p className="reading">{prompt}</p>
      <div className="mt-2">{input}</div>
    </>
  )
}
