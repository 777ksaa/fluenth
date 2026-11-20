'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { speak, speechSupport, stopSpeaking } from '@/lib/client/speech'
import { SpeakerIcon } from './icons'

interface Props {
  text: string
  /** A recorded pronunciation (https). Played first; the browser voice is the fallback. */
  audioUrl?: string
  /** Accessible name. Defaults to `Listen: <text>`. */
  label?: string
  rate?: number
  /** Visible text next to the icon. Leave out for an icon-only button. */
  children?: string
  className?: string
}

export function SpeakButton({ text, audioUrl, label, rate, children, className }: Props) {
  const [available, setAvailable] = useState(true)
  const [playing, setPlaying] = useState(false)
  const audio = useRef<HTMLAudioElement | null>(null)

  // Decided after mount so the server and the first client render match.
  useEffect(() => {
    setAvailable(Boolean(audioUrl) || speechSupport().synthesis)
  }, [audioUrl])

  const halt = useCallback(() => {
    audio.current?.pause()
    audio.current = null
    stopSpeaking()
    setPlaying(false)
  }, [])

  useEffect(() => halt, [halt])

  async function toggle() {
    if (playing) {
      halt()
      return
    }
    setPlaying(true)
    if (audioUrl) {
      try {
        const player = new Audio(audioUrl)
        audio.current = player
        player.onended = () => setPlaying(false)
        await player.play()
        return
      } catch {
        audio.current = null // blocked or unreachable: use the browser voice instead
      }
    }
    await speak(text, { rate })
    setPlaying(false)
  }

  if (!available) return null
  const name = label ?? `Listen: ${text}`
  return (
    <button
      type="button"
      onClick={() => void toggle()}
      aria-label={children ? undefined : name}
      aria-pressed={playing}
      title={name}
      className={className ?? `btn btn-quiet ${children ? 'btn-sm' : 'btn-icon'}`}
    >
      <SpeakerIcon size={18} />
      {children ? <span>{children}</span> : null}
    </button>
  )
}
