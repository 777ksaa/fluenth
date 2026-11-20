// Browser speech: text-to-speech for listening practice, the Web Speech API for pronunciation.
//
// Support differs by browser. Speech synthesis works almost everywhere. Speech recognition is in
// Chrome, Edge and Safari but not Firefox, and in Chrome the audio is sent to Google's servers
// for transcription. Everything here degrades to "unsupported" instead of throwing.

// The recognition types are not in every TypeScript lib.dom version, so they are declared here.
interface HeardAlternative {
  readonly transcript: string
  readonly confidence: number
}
interface HeardResult {
  readonly length: number
  readonly isFinal: boolean
  readonly [index: number]: HeardAlternative
}
interface RecognitionEventLike {
  readonly resultIndex: number
  readonly results: { readonly length: number; readonly [index: number]: HeardResult }
}
interface RecognitionLike {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  onresult: ((event: RecognitionEventLike) => void) | null
  onerror: ((event: { readonly error: string }) => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
}
type RecognitionConstructor = new () => RecognitionLike

function recognitionConstructor(): RecognitionConstructor | undefined {
  if (typeof window === 'undefined') return undefined
  const w = window as unknown as { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition
}

export function speechSupport(): { synthesis: boolean; recognition: boolean } {
  return {
    synthesis: typeof window !== 'undefined' && 'speechSynthesis' in window,
    recognition: recognitionConstructor() !== undefined,
  }
}

// ---- text to speech ---------------------------------------------------------

let voicesPromise: Promise<SpeechSynthesisVoice[]> | undefined

/** Voices load asynchronously in Chrome; some browsers never fire the event, so give up after a moment. */
function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  if (voicesPromise) return voicesPromise
  voicesPromise = new Promise<SpeechSynthesisVoice[]>((resolve) => {
    const synth = window.speechSynthesis
    const ready = synth.getVoices()
    if (ready.length > 0) {
      resolve(ready)
      return
    }
    const finish = () => {
      synth.removeEventListener('voiceschanged', finish)
      resolve(synth.getVoices())
    }
    synth.addEventListener('voiceschanged', finish)
    setTimeout(finish, 1200)
  }).then((voices) => {
    if (voices.length === 0) voicesPromise = undefined // try again next time
    return voices
  })
  return voicesPromise
}

export function pickVoice(voices: readonly SpeechSynthesisVoice[], lang: string): SpeechSynthesisVoice | undefined {
  const wanted = lang.toLowerCase()
  const prefix = wanted.split('-')[0]
  return (
    voices.find((v) => v.lang.toLowerCase().replace('_', '-') === wanted) ??
    voices.find((v) => v.lang.toLowerCase().startsWith(`${prefix}-`) || v.lang.toLowerCase() === prefix)
  )
}

export function stopSpeaking(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel()
}

/** Speaks `text`. Resolves true when it finished, false when it was cut off or is unsupported. */
export async function speak(text: string, options: { lang?: string; rate?: number } = {}): Promise<boolean> {
  if (!speechSupport().synthesis || text.trim() === '') return false
  const lang = options.lang ?? 'en-US'
  const voices = await loadVoices()
  const synth = window.speechSynthesis
  synth.cancel() // drop anything still queued, otherwise Chrome can stall
  return new Promise<boolean>((resolve) => {
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang
    utterance.rate = options.rate ?? 1
    const voice = pickVoice(voices, lang)
    if (voice) utterance.voice = voice
    utterance.onend = () => resolve(true)
    utterance.onerror = () => resolve(false)
    synth.speak(utterance)
  })
}

// ---- speech recognition -----------------------------------------------------

export type ListenError = 'unsupported' | 'denied' | 'no-mic' | 'no-speech' | 'network' | 'failed'

export interface Heard {
  transcript: string
  confidence: number
  /** The recogniser's other guesses, best first. Includes the transcript itself. */
  alternatives: { transcript: string; confidence: number }[]
}

export type ListenResult = { ok: true; heard: Heard } | { ok: false; error: ListenError }

export interface Listener {
  /** Ends the recording early. The result promise still resolves, with whatever was heard. */
  stop: () => void
  result: Promise<ListenResult>
}

const ERROR_MAP: Record<string, ListenError | undefined> = {
  'not-allowed': 'denied',
  'service-not-allowed': 'denied',
  'audio-capture': 'no-mic',
  'no-speech': 'no-speech',
  network: 'network',
  aborted: undefined, // the learner stopped it: not an error
}

/** Records one utterance. Never rejects: failures come back as { ok: false }. */
export function listen(options: { lang?: string; maxAlternatives?: number } = {}): Listener {
  const Ctor = recognitionConstructor()
  if (!Ctor) return { stop: () => {}, result: Promise.resolve({ ok: false, error: 'unsupported' }) }

  const recognition = new Ctor()
  recognition.lang = options.lang ?? 'en-US'
  recognition.continuous = false
  recognition.interimResults = false
  recognition.maxAlternatives = options.maxAlternatives ?? 4

  let heard: Heard | undefined
  let failure: ListenError | undefined

  const result = new Promise<ListenResult>((resolve) => {
    recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const entry = event.results[i]
        if (!entry.isFinal) continue
        const alternatives: Heard['alternatives'] = []
        for (let j = 0; j < entry.length; j++) {
          alternatives.push({ transcript: entry[j].transcript.trim(), confidence: entry[j].confidence })
        }
        if (alternatives.length > 0) {
          heard = { transcript: alternatives[0].transcript, confidence: alternatives[0].confidence, alternatives }
        }
      }
    }
    recognition.onerror = (event) => {
      failure = Object.hasOwn(ERROR_MAP, event.error) ? ERROR_MAP[event.error] : 'failed'
    }
    recognition.onend = () => {
      if (heard && heard.transcript !== '') resolve({ ok: true, heard })
      else resolve({ ok: false, error: failure ?? 'no-speech' })
    }
    try {
      recognition.start()
    } catch {
      resolve({ ok: false, error: 'failed' })
    }
  })

  return {
    stop: () => {
      try {
        recognition.stop()
      } catch {
        // already stopped
      }
    },
    result,
  }
}

export const LISTEN_MESSAGES: Record<ListenError, string> = {
  unsupported: 'This browser cannot record speech. Try Chrome, Edge or Safari, or type what you would say.',
  denied: 'Microphone access is blocked. Allow it in your browser’s site settings and try again.',
  'no-mic': 'No microphone was found.',
  'no-speech': 'Nothing was heard. Press the microphone and speak right away.',
  network: 'The speech service could not be reached. Check your connection and try again.',
  failed: 'Recording failed. Try again.',
}
