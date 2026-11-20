'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState, useTransition } from 'react'
import type { Dialogue, Role } from '@/content/dialogues'
import { completeDialogue, submitSpeaking } from '@/lib/actions/progress'
import { LISTEN_MESSAGES, listen, speak, speechSupport, stopSpeaking } from '@/lib/client/speech'
import type { Listener } from '@/lib/client/speech'
import { scoreSpeaking } from '@/lib/core/speaking'
import type { SpeakingScore } from '@/lib/core/speaking'
import { Correction } from './correction'
import { HeadphonesIcon, MicIcon, RefreshIcon } from './icons'
import { useProfile } from './profile-context'

type Mode = Role | 'listen'
type Turn = 'partner' | 'yours' | 'listening' | 'scored'

const VERDICT_TEXT = {
  excellent: 'Excellent. That was clear and accurate.',
  good: 'Good. Nearly all of it came through.',
  'keep-practising': 'Keep practising. Say it again a little more slowly.',
  'try-again': 'That was not clear enough yet. Listen to the line, then try again.',
} as const

export function DialoguePlayer({ dialogue }: { dialogue: Dialogue }) {
  const { slug, lines, roles } = dialogue
  const pathname = usePathname()
  const { applyXp } = useProfile()
  const [phase, setPhase] = useState<'choose' | 'play' | 'done'>('choose')
  const [mode, setMode] = useState<Mode>('listen')
  const [cursor, setCursor] = useState(0)
  const [turn, setTurn] = useState<Turn>('partner')
  const [score, setScore] = useState<SpeakingScore | null>(null)
  const [heard, setHeard] = useState('')
  const [typed, setTyped] = useState('')
  const [scores, setScores] = useState<Record<number, number>>({})
  const [message, setMessage] = useState('')
  const [guest, setGuest] = useState(false)
  const [support, setSupport] = useState({ synthesis: true, recognition: true })
  const [, startTransition] = useTransition()
  const runId = useRef(0)
  const listener = useRef<Listener | null>(null)

  useEffect(() => {
    setSupport(speechSupport())
    return () => {
      runId.current++
      stopSpeaking()
      listener.current?.stop()
    }
  }, [])

  function stopAll() {
    runId.current++
    stopSpeaking()
    listener.current?.stop()
    listener.current = null
  }

  function finish(playedAs: Mode) {
    setPhase('done')
    if (playedAs === 'listen') return
    startTransition(async () => {
      const response = await completeDialogue(slug)
      if (response.ok) applyXp(response.xp)
      else if (response.error === 'auth') setGuest(true)
    })
  }

  // Plays the partner's lines aloud and pauses at each of the learner's turns.
  async function run(from: number, id: number, playedAs: Mode) {
    for (let i = from; i < lines.length; i++) {
      if (runId.current !== id) return
      setCursor(i)
      if (playedAs !== 'listen' && lines[i].speaker === playedAs) {
        setTurn('yours')
        return
      }
      setTurn('partner')
      await speak(lines[i].text, { lang: 'en-US', rate: 0.95 })
    }
    if (runId.current === id) finish(playedAs)
  }

  function begin(playedAs: Mode) {
    stopAll()
    setMode(playedAs)
    setScores({})
    setGuest(false)
    resetLine()
    setPhase('play')
    void run(0, runId.current, playedAs)
  }

  function resetLine() {
    setScore(null)
    setHeard('')
    setTyped('')
    setMessage('')
  }

  function nextLine() {
    resetLine()
    runId.current++
    void run(cursor + 1, runId.current, mode)
  }

  function retry() {
    resetLine()
    setTurn('yours')
  }

  function record(transcript: string, confidence?: number) {
    const result = scoreSpeaking(lines[cursor].text, transcript, confidence)
    setHeard(transcript)
    setScore(result)
    setTurn('scored')
    const line = cursor
    setScores((prev) => ({ ...prev, [line]: Math.max(prev[line] ?? 0, result.score) }))
    startTransition(async () => {
      const response = await submitSpeaking(slug, line, transcript, confidence)
      if (response.ok) applyXp(response.xp)
      else if (response.error === 'auth') setGuest(true)
    })
  }

  async function speakLine() {
    stopSpeaking()
    setMessage('')
    setTurn('listening')
    const target = lines[cursor].text
    const session = listen({ lang: 'en-US', maxAlternatives: 4 })
    listener.current = session
    const outcome = await session.result
    listener.current = null
    if (!outcome.ok) {
      setMessage(LISTEN_MESSAGES[outcome.error])
      setTurn('yours')
      return
    }
    // Recognisers return several guesses; judge the one closest to the line the learner meant.
    let best = outcome.heard.alternatives[0]
    let bestScore = -1
    for (const alt of outcome.heard.alternatives) {
      const s = scoreSpeaking(target, alt.transcript, alt.confidence).score
      if (s > bestScore) {
        best = alt
        bestScore = s
      }
    }
    record(best.transcript, best.confidence)
  }

  const current = lines[cursor]
  const mine = mode !== 'listen' && current.speaker === mode
  const yourLines = mode === 'listen' ? [] : lines.map((l, i) => (l.speaker === mode ? i : -1)).filter((i) => i >= 0)
  const scored = Object.values(scores)
  const average = scored.length > 0 ? Math.round(scored.reduce((a, b) => a + b, 0) / scored.length) : null

  return (
    <div className="space-y-8">
      {phase === 'choose' ? (
        <div className="panel space-y-4">
          <p className="title-sm">Choose how to practise</p>
          <div className="flex flex-wrap gap-3">
            {(['A', 'B'] as const).map((r) => (
              <button key={r} type="button" className="btn btn-primary" onClick={() => begin(r)}>
                <MicIcon size={18} />
                <span>Play the {roles[r].toLowerCase()}</span>
              </button>
            ))}
            <button type="button" className="btn btn-quiet" onClick={() => begin('listen')}>
              <HeadphonesIcon size={18} />
              <span>Just listen</span>
            </button>
          </div>
          <p className="hint">
            In a role you hear the other speaker, then say your own lines aloud and get a score for each.
            {!support.recognition ? ' This browser cannot record speech, so you will type your lines instead. Chrome, Edge and Safari can record.' : ' Chrome sends your recording to Google to turn it into text.'}
          </p>
          {!support.synthesis ? <p role="alert" className="hint">This browser cannot read lines aloud, so the other speaker’s lines will be text only.</p> : null}
        </div>
      ) : null}

      <ol className="ruled reading" aria-label="Dialogue">
        {lines.map((line, i) => {
          const active = phase === 'play' && i === cursor
          const yours = mode !== 'listen' && phase !== 'choose' && line.speaker === mode
          return (
            <li key={i} aria-current={active ? 'step' : undefined} className={active ? 'rounded-lg bg-marker px-3 text-on-marker' : 'px-3'}>
              <span className={yours ? 'font-bold' : 'font-semibold text-muted'}>{roles[line.speaker]}: </span>
              <span>{line.text}</span>
              {yours && scores[i] !== undefined ? <span className="chip ml-3">{scores[i]}%</span> : null}
            </li>
          )
        })}
      </ol>

      {phase === 'play' ? (
        <div className="panel space-y-4" aria-live="polite">
          {!mine ? (
            <div className="flex flex-wrap items-center gap-4">
              <p>
                {turn === 'partner' ? `${roles[current.speaker]} is speaking…` : ''}
              </p>
              <button type="button" className="btn btn-quiet btn-sm" onClick={() => { stopAll(); setPhase('choose') }}>
                Stop
              </button>
            </div>
          ) : (
            <>
              <p className="title-sm">Your line</p>
              <p className="reading">{current.text}</p>

              {turn === 'yours' || turn === 'listening' ? (
                <div className="flex flex-wrap items-center gap-3">
                  <button type="button" className="btn btn-quiet" onClick={() => void speak(current.text, { lang: 'en-US', rate: 0.9 })} disabled={turn === 'listening'}>
                    <HeadphonesIcon size={18} />
                    <span>Hear it first</span>
                  </button>
                  {support.recognition ? (
                    <button type="button" className="btn btn-primary" onClick={() => (turn === 'listening' ? listener.current?.stop() : void speakLine())}>
                      <MicIcon size={18} />
                      <span>{turn === 'listening' ? 'Stop recording' : 'Speak this line'}</span>
                    </button>
                  ) : null}
                  <button type="button" className="btn btn-quiet" onClick={nextLine} disabled={turn === 'listening'}>
                    Skip this line
                  </button>
                </div>
              ) : null}

              {turn === 'listening' ? <p role="status">Listening… say the line now.</p> : null}

              {!support.recognition && turn === 'yours' ? (
                <div>
                  <label htmlFor="typed-line" className="label">
                    Type the line as you would say it
                  </label>
                  <div className="flex flex-wrap gap-3">
                    <input
                      id="typed-line"
                      type="text"
                      value={typed}
                      onChange={(e: { target: { value: string } }) => setTyped(e.target.value)}
                      autoComplete="off"
                      maxLength={300}
                      className="field min-w-[14rem] flex-1"
                    />
                    <button type="button" className="btn btn-primary" onClick={() => typed.trim() && record(typed)} disabled={typed.trim() === ''}>
                      Check
                    </button>
                  </div>
                </div>
              ) : null}

              {message ? (
                <p role="alert" className="text-sm text-redpen">
                  {message}
                </p>
              ) : null}

              {turn === 'scored' && score ? (
                <div className="space-y-3">
                  <p className="title-md" role="status">
                    {score.score}%
                  </p>
                  <p>{VERDICT_TEXT[score.verdict]}</p>
                  <p className="hint">
                    Heard: <span className="italic">“{heard}”</span>
                  </p>
                  <Correction tokens={score.tokens} />
                  <div className="flex flex-wrap gap-3">
                    <button type="button" className="btn btn-quiet" onClick={retry}>
                      <RefreshIcon size={18} />
                      <span>Try this line again</span>
                    </button>
                    <button type="button" className="btn btn-primary" onClick={nextLine}>
                      {cursor + 1 < lines.length ? 'Next line' : 'Finish'}
                    </button>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>
      ) : null}

      {phase === 'done' ? (
        <div role="status" className="panel space-y-3">
          <p className="title-md">{mode === 'listen' ? 'That was the whole dialogue.' : 'Dialogue finished.'}</p>
          {average !== null ? (
            <p>
              Your average score was {average}% across {scored.length} of {yourLines.length} lines.
            </p>
          ) : mode !== 'listen' ? (
            <p>You skipped every line. Run it again and say your lines aloud to get scores.</p>
          ) : null}
          {guest ? (
            <p className="hint">
              <Link href={`/login?next=${encodeURIComponent(pathname)}`}>Sign in</Link> to save your scores and earn XP for speaking.
            </p>
          ) : null}
          <div className="flex flex-wrap gap-3">
            <button type="button" className="btn btn-primary" onClick={() => begin(mode)}>
              <RefreshIcon size={18} />
              <span>Play again</span>
            </button>
            <button type="button" className="btn btn-quiet" onClick={() => setPhase('choose')}>
              Choose another role
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
