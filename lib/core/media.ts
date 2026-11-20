// Curated video clips (the media_clips table). A clip's video id ends up inside an iframe URL,
// so every row is validated here even though only admins can write to the table.

export interface Clip {
  id: string
  videoId: string
  start: number
  end: number | null
  transcript: string
  attribution: string
  license: string
}

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/

export const isYoutubeId = (v: unknown): v is string => typeof v === 'string' && VIDEO_ID.test(v)

const text = (v: unknown, max: number): string | null => {
  if (typeof v !== 'string') return null
  const s = v.replace(/\s+/g, ' ').trim()
  return s.length > 0 ? s.slice(0, max) : null
}

/** Returns null for any row that is not safe and complete enough to show. */
export function parseClip(row: unknown): Clip | null {
  if (typeof row !== 'object' || row === null) return null
  const r = row as Record<string, unknown>
  const transcript = text(r.transcript, 400)
  const attribution = text(r.attribution, 200)
  const license = text(r.license, 80)
  const start = typeof r.start_seconds === 'number' && Number.isInteger(r.start_seconds) && r.start_seconds >= 0 ? r.start_seconds : null
  const end = typeof r.end_seconds === 'number' && Number.isInteger(r.end_seconds) ? r.end_seconds : null
  if (typeof r.id !== 'string' || !isYoutubeId(r.video_id) || !transcript || !attribution || !license || start === null) return null
  if (end !== null && end <= start) return null
  return { id: r.id, videoId: r.video_id, start, end, transcript, attribution, license }
}

/** Privacy-enhanced embed: no YouTube cookies until the learner presses play. */
export function embedUrl(clip: Pick<Clip, 'videoId' | 'start' | 'end'>): string {
  const params = new URLSearchParams({ start: String(clip.start), rel: '0', playsinline: '1', autoplay: '1' })
  if (clip.end !== null) params.set('end', String(clip.end))
  return `https://www.youtube-nocookie.com/embed/${clip.videoId}?${params.toString()}`
}

/** Public YouGlish page for a phrase: the fallback when the embedded widget cannot load. */
export const youglishUrl = (query: string): string => `https://youglish.com/pronounce/${encodeURIComponent(query)}/english`
