'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState, useTransition } from 'react'
import type { DictationLine } from '@/content/dictation'
import { submitDictation } from '@/lib/actions/progress'
import { speak, speechSupport, stopSpeaking } from '@/lib/client/speech'
import { diffWords } from '@/lib/core/diff'
import type { DiffResult } from '@/lib/core/diff'
import { Correction } from './correction'
import { HeadphonesIcon, RefreshIcon } from './icons'
import { useProfile } from './profile-context'

interface Props {
  /** Level slug such as "b1"; the server checks it against its own copy of the lines. */
  level: string
  lines: DictationLine[]
}

type Speed = 'normal' | 'slow'

export function DictationPlayer({ level, lines }: Props) {
  const pathname = usePathname()
  const { applyXp } = useProfile()
  const [index, setIndex] = useState(0)
  const [answer, setAnswer] = useState('')
  const [result, setResult] = useState<DiffResult | null>(null)
  const [scores, setScores] = useState<number[]>([])
  const [playing, setPlaying] = useState<Speed | null>(null)
  const [cannotPlay, setCannotPlay] = useState(false)
  const [empty, setEmpty] = useState(false)
  const [guest, setGuest] = useState(false)
  const [, startTransition] = useTransition()
  const audio = useRef<HTMLAudioElement | null>(null)
  const box = useRef<HTMLTextAreaElement>(null)
  const next = useRef<HTMLButtonElement>(null)

  const line = lines[index]
  const finished = index >= lines.length

  useEffect(() => {
    setCannotPlay(!speechSupport().synthesis && !lines.some((l) => l.audio))
  }, [lines])

  useEffect(
    () => () => {
      audio.current?.pause()
      stopSpeaking()
    },
    [],
  )

  // A new line: clear the box and put the cursor in it.
  useEffect(() => {
    if (!finished) box.current?.focus()
  }, [index, finished])

  function halt() {
    audio.current?.pause()
    audio.current = null
    stopSpeaking()
    setPlaying(null)
  }

  async function play(speed: Speed) {
    if (playing === speed) {
      halt()
      return
    }
    halt()
    setPlaying(speed)
    const rate = speed === 'slow' ? 0.7 : 1
    if (line.audio) {
      try {
        const player = new Audio(line.audio)
        player.playbackRate = rate
        audio.current = player
        player.onended = () => setPlaying(null)
        await player.play()
        return
      } catch {
        audio.current = null // fall back to the browser voice
      }
    }
    await speak(line.text, { rate })
    setPlaying(null)
  }

  function check() {
    if (answer.trim() === '') {
      setEmpty(true)
      return
    }
    halt()
    const diff = diffWords(line.text, answer)
    setResult(diff)
    setScores((prev) => [...prev, diff.accuracy])
    setTimeout(() => next.current?.focus(), 0)
    startTransition(async () => {
      const response = await submitDictation(level, line.id, answer)
      if (response.ok) applyXp(response.xp)
      else if (response.error === 'auth') setGuest(true)
    })
  }

  function advance() {
    setIndex((i) => i + 1)
    setAnswer('')
    setResult(null)
    setEmpty(false)
  }

  function restart() {
    setIndex(0)
    setAnswer('')
    setResult(null)
    setScores([])
    setEmpty(false)
  }

  if (finished) {
    const average = Math.round((scores.reduce((a, b) => a + b, 0) / Math.max(1, scores.length)) * 100)
    const perfect = scores.filter((s) => s === 1).length
    return (
      <div role="status" className="panel space-y-3">
        <p className="title-md">
          {average}% correct on average
        </p>
        <p>
          {perfect} of {lines.length} lines were perfect.
          {average >= 90 ? ' Very accurate listening.' : average >= 70 ? ' Good. Listen again to the lines marked in red.' : ' Try the set again and use the slow speed.'}
        </p>
        {guest ? (
          <p className="hint">
            <Link href={`/login?next=${encodeURIComponent(pathname)}`}>Sign in</Link> to save your progress and earn XP for dictation.
          </p>
        ) : null}
        <button type="button" className="btn btn-primary" onClick={restart}>
          <RefreshIcon size={18} />
          <span>Start this set again</span>
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold">
            Line {index + 1} of {lines.length}
          </span>
        </div>
        <div className="bar mt-2" aria-hidden="true">
          <span style={{ width: `${(index / lines.length) * 100}%` }} />
        </div>
      </div>

      {cannotPlay ? (
        <p role="alert" className="panel text-sm">
          This browser cannot read text aloud, and this set has no recordings. Open the page in Chrome, Edge or Safari to
          practise dictation.
        </p>
      ) : (
        <div className="flex flex-wrap gap-3">
          <button type="button" className="btn btn-primary" onClick={() => void play('normal')} aria-pressed={playing === 'normal'}>
            <HeadphonesIcon size={18} />
            <span>{playing === 'normal' ? 'Stop' : 'Listen'}</span>
          </button>
          <button type="button" className="btn btn-quiet" onClick={() => void play('slow')} aria-pressed={playing === 'slow'}>
            <span>{playing === 'slow' ? 'Stop' : 'Listen slowly'}</span>
          </button>
        </div>
      )}

      <div>
        <label htmlFor="dictation-answer" className="label">
          Type what you hear
        </label>
        <textarea
          id="dictation-answer"
          ref={box}
          rows={3}
          value={answer}
          disabled={result !== null}
          onChange={(e: { target: { value: string } }) => {
            setAnswer(e.target.value)
            if (empty) setEmpty(false)
          }}
          onKeyDown={(e: { key: string; shiftKey: boolean; preventDefault: () => void }) => {
            if (e.key === 'Enter' && !e.shiftKey && result === null) {
              e.preventDefault()
              check()
            }
          }}
          autoComplete="off"
          autoCapitalize="sentences"
          spellCheck={false}
          maxLength={400}
          className="field reading w-full"
          aria-describedby={empty ? 'dictation-empty' : undefined}
        />
        {empty ? (
          <p id="dictation-empty" role="alert" className="mt-2 text-sm text-redpen">
            Type what you heard first, even if you only caught a few words.
          </p>
        ) : null}
      </div>

      {result === null ? (
        <div className="flex flex-wrap items-center gap-4">
          <button type="button" className="btn btn-primary" onClick={check}>
            Check
          </button>
          <span className="hint">Press Enter to check, Shift+Enter for a new line.</span>
        </div>
      ) : (
        <div className="panel space-y-4">
          <p className="title-sm" role="status">
            {result.perfect ? 'Perfect.' : `${Math.round(result.accuracy * 100)}% correct.`}
          </p>
          <Correction tokens={result.tokens} />
          {!result.perfect ? (
            <p className="hint">Red words are yours, struck through, with the correct word written above. A gap shows a word you missed.</p>
          ) : null}
          <div className="flex flex-wrap gap-3">
            <button type="button" className="btn btn-quiet" onClick={() => void play('normal')}>
              <HeadphonesIcon size={18} />
              <span>Listen again</span>
            </button>
            <button ref={next} type="button" className="btn btn-primary" onClick={advance}>
              {index + 1 < lines.length ? 'Next line' : 'See my result'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
