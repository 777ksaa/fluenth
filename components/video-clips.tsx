'use client'

import { useEffect, useRef, useState } from 'react'
import { embedUrl, youglishUrl } from '@/lib/core/media'
import type { Clip } from '@/lib/core/media'
import { splitHighlight } from '@/lib/core/highlight'
import { PlayIcon } from './icons'

// YouGlish JavaScript API: the script calls window.onYouglishAPIReady once it has loaded,
// then `new YG.Widget(element, { width, components, events })` and `widget.fetch(query, lang)`.
interface YouglishWidget {
  fetch: (query: string, lang: string, accent?: string) => void
}
interface YouglishApi {
  Widget: new (
    container: HTMLElement,
    options: { width?: number; events?: Record<string, (event: { totalResult?: number; code?: number }) => void> },
  ) => YouglishWidget
}
declare global {
  interface Window {
    YG?: YouglishApi
    onYouglishAPIReady?: () => void
  }
}

const YOUGLISH_SCRIPT = 'https://youglish.com/public/emb/widget.js'
let apiPromise: Promise<YouglishApi> | undefined

function loadYouglish(): Promise<YouglishApi> {
  if (apiPromise) return apiPromise
  apiPromise = new Promise<YouglishApi>((resolve, reject) => {
    if (window.YG) {
      resolve(window.YG)
      return
    }
    let settled = false
    const fail = (reason: string) => {
      if (settled) return
      settled = true
      apiPromise = undefined // allow a retry
      reject(new Error(reason))
    }
    window.onYouglishAPIReady = () => {
      if (settled) return
      if (window.YG) {
        settled = true
        resolve(window.YG)
      } else fail('YouGlish API missing')
    }
    const script = document.createElement('script')
    script.src = YOUGLISH_SCRIPT
    script.async = true
    script.charset = 'utf-8'
    script.onerror = () => fail('YouGlish script failed to load')
    document.head.appendChild(script)
    setTimeout(() => fail('YouGlish timed out'), 12_000)
  })
  return apiPromise
}

type YouglishState = 'idle' | 'loading' | 'ready' | 'empty' | 'error'

interface Props {
  /** The word or phrase to find in real speech. */
  query: string
  /** Curated clips for this topic (approved rows from media_clips). */
  clips: Clip[]
  /** Whether to offer the YouGlish search widget. */
  youglish: boolean
}

/**
 * Real-speech video. Nothing is requested from YouTube or YouGlish until the learner presses a
 * button, so the page stays fast and no third-party cookies are set by merely reading a word.
 */
export function VideoClips({ query, clips, youglish }: Props) {
  const [playing, setPlaying] = useState<string | null>(null)
  const [state, setState] = useState<YouglishState>('idle')
  const host = useRef<HTMLDivElement>(null)
  const started = useRef(false)

  // A new word means a new widget: reset when the query changes.
  useEffect(() => {
    started.current = false
    setState('idle')
    setPlaying(null)
    if (host.current) host.current.replaceChildren()
  }, [query])

  async function startYouglish() {
    if (started.current || !host.current) return
    started.current = true
    setState('loading')
    try {
      const api = await loadYouglish()
      const element = host.current
      if (!element) return
      const widget = new api.Widget(element, {
        events: {
          onFetchDone: (event) => setState(event.totalResult === 0 ? 'empty' : 'ready'),
          onError: () => setState('error'),
        },
      })
      widget.fetch(query, 'english')
    } catch {
      started.current = false
      setState('error')
    }
  }

  if (!youglish && clips.length === 0) return null

  return (
    <div className="space-y-8">
      {clips.length > 0 ? (
        <ul className="ruled">
          {clips.map((clip) => (
            <li key={clip.id}>
              {playing === clip.id ? (
                <iframe
                  className="aspect-video w-full rounded-lg border border-rule"
                  src={embedUrl(clip)}
                  title={`Video clip: ${clip.transcript}`}
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              ) : (
                <button type="button" className="btn btn-quiet" onClick={() => setPlaying(clip.id)}>
                  <PlayIcon size={18} />
                  <span>Play clip</span>
                </button>
              )}
              <p className="reading mt-3">
                {splitHighlight(clip.transcript, query).map((part, i) => (part.match ? <mark key={i}>{part.text}</mark> : <span key={i}>{part.text}</span>))}
              </p>
              <p className="hint">
                {clip.attribution}, {clip.license}
              </p>
            </li>
          ))}
        </ul>
      ) : null}

      {youglish ? (
        <div>
          <div ref={host} className={state === 'idle' || state === 'error' ? 'hidden' : 'min-h-[14rem]'} />
          {state === 'idle' || state === 'error' ? (
            <div className="space-y-2">
              <button type="button" className="btn btn-primary" onClick={() => void startYouglish()}>
                <PlayIcon size={18} />
                <span>{state === 'error' ? 'Try again' : 'Hear it in real videos'}</span>
              </button>
              {state === 'error' ? (
                <p role="alert" className="text-sm text-redpen">
                  The video search did not load.{' '}
                  <a href={youglishUrl(query)} target="_blank" rel="noopener noreferrer">
                    Open it on YouGlish
                  </a>
                  .
                </p>
              ) : (
                <p className="hint">Loads videos from YouTube through YouGlish when you press the button.</p>
              )}
            </div>
          ) : null}
          {state === 'loading' ? <p className="hint mt-2">Searching real videos…</p> : null}
          {state === 'empty' ? <p className="hint mt-2">No video clips were found for this phrase.</p> : null}
          <p className="hint mt-3">
            Powered by{' '}
            <a href="https://youglish.com" target="_blank" rel="noopener noreferrer">
              YouGlish.com
            </a>
          </p>
        </div>
      ) : null}
    </div>
  )
}
