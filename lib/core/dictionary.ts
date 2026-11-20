// Normalises third-party dictionary JSON (dictionaryapi.dev's v2 shape) into our own entry type.
// The upstream is untrusted: every field is type-checked and bounded before it is stored in
// Postgres or rendered, and audio URLs must be https.

export interface Definition {
  definition: string
  example?: string
  synonyms: string[]
  antonyms: string[]
}

export interface Meaning {
  partOfSpeech: string
  definitions: Definition[]
  synonyms: string[]
  antonyms: string[]
}

export interface Phonetic {
  text?: string
  audio?: string
}

export interface DictionaryEntry {
  word: string
  phonetic?: string
  phonetics: Phonetic[]
  /** First usable https audio URL, if any. */
  audio?: string
  meanings: Meaning[]
  origin?: string
  license?: { name: string; url: string }
  sourceUrls: string[]
  /** Related words from a second source (Datamuse), used when the dictionary lists none. */
  related?: { synonyms: string[]; antonyms: string[] }
}

const LIMITS = {
  meanings: 8,
  definitionsPerMeaning: 6,
  synonymsPerList: 12,
  phonetics: 4,
  sourceUrls: 3,
  text: 600,
} as const

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

function str(v: unknown, max: number = LIMITS.text): string | undefined {
  if (typeof v !== 'string') return undefined
  const s = v.replace(/\s+/g, ' ').trim()
  return s.length > 0 ? s.slice(0, max) : undefined
}

function wordList(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  const out: string[] = []
  for (const item of v) {
    const s = str(item, 60)
    if (s && !out.includes(s)) out.push(s)
    if (out.length >= LIMITS.synonymsPerList) break
  }
  return out
}

/** Accepts https:// and protocol-relative (//host/path) URLs; everything else is dropped. */
export function safeHttpsUrl(v: unknown): string | undefined {
  const s = str(v, 500)
  if (!s) return undefined
  const candidate = s.startsWith('//') ? `https:${s}` : s
  try {
    const url = new URL(candidate)
    return url.protocol === 'https:' ? url.toString() : undefined
  } catch {
    return undefined
  }
}

function parsePhonetics(v: unknown): Phonetic[] {
  if (!Array.isArray(v)) return []
  const out: Phonetic[] = []
  for (const p of v) {
    if (!isRecord(p)) continue
    const text = str(p.text, 80)
    const audio = safeHttpsUrl(p.audio)
    if (!text && !audio) continue
    out.push({ ...(text ? { text } : {}), ...(audio ? { audio } : {}) })
    if (out.length >= LIMITS.phonetics) break
  }
  return out
}

function parseDefinitions(v: unknown): Definition[] {
  if (!Array.isArray(v)) return []
  const out: Definition[] = []
  for (const d of v) {
    if (!isRecord(d)) continue
    const definition = str(d.definition)
    if (!definition) continue
    const example = str(d.example, 400)
    out.push({
      definition,
      ...(example ? { example } : {}),
      synonyms: wordList(d.synonyms),
      antonyms: wordList(d.antonyms),
    })
  }
  return out
}

/**
 * @param raw        parsed JSON from the upstream API (an array of entries for one headword)
 * @param requested  the headword we asked for; used when the upstream omits `word`
 * @returns null when the payload holds no definitions at all
 */
export function normalizeApiResponse(raw: unknown, requested: string): DictionaryEntry | null {
  if (!Array.isArray(raw)) return null

  const meanings: Meaning[] = []
  const phonetics: Phonetic[] = []
  let word: string | undefined
  let phonetic: string | undefined
  let origin: string | undefined
  let license: DictionaryEntry['license']
  const sourceUrls: string[] = []

  for (const item of raw) {
    if (!isRecord(item)) continue
    word ??= str(item.word, 60)
    phonetic ??= str(item.phonetic, 80)
    origin ??= str(item.origin)

    for (const p of parsePhonetics(item.phonetics)) {
      if (phonetics.length < LIMITS.phonetics && !phonetics.some((q) => q.text === p.text && q.audio === p.audio)) {
        phonetics.push(p)
      }
    }

    if (!license && isRecord(item.license)) {
      const name = str(item.license.name, 60)
      const url = safeHttpsUrl(item.license.url)
      if (name && url) license = { name, url }
    }

    if (Array.isArray(item.sourceUrls)) {
      for (const u of item.sourceUrls) {
        const safe = safeHttpsUrl(u)
        if (safe && !sourceUrls.includes(safe) && sourceUrls.length < LIMITS.sourceUrls) sourceUrls.push(safe)
      }
    }

    if (!Array.isArray(item.meanings)) continue
    for (const m of item.meanings) {
      if (!isRecord(m)) continue
      const partOfSpeech = str(m.partOfSpeech, 40)?.toLowerCase()
      const definitions = parseDefinitions(m.definitions)
      if (!partOfSpeech || definitions.length === 0) continue

      // Entries for the same headword often repeat a part of speech: fold them together.
      const existing = meanings.find((x) => x.partOfSpeech === partOfSpeech)
      if (existing) {
        existing.definitions.push(...definitions)
        existing.definitions.splice(LIMITS.definitionsPerMeaning)
        for (const s of wordList(m.synonyms)) if (!existing.synonyms.includes(s)) existing.synonyms.push(s)
        for (const a of wordList(m.antonyms)) if (!existing.antonyms.includes(a)) existing.antonyms.push(a)
        existing.synonyms.splice(LIMITS.synonymsPerList)
        existing.antonyms.splice(LIMITS.synonymsPerList)
      } else if (meanings.length < LIMITS.meanings) {
        meanings.push({
          partOfSpeech,
          definitions: definitions.slice(0, LIMITS.definitionsPerMeaning),
          synonyms: wordList(m.synonyms),
          antonyms: wordList(m.antonyms),
        })
      }
    }
  }

  if (meanings.length === 0) return null

  const audio = phonetics.find((p) => p.audio)?.audio
  return {
    word: word ?? requested,
    ...(phonetic ?? phonetics.find((p) => p.text)?.text
      ? { phonetic: phonetic ?? phonetics.find((p) => p.text)?.text }
      : {}),
    phonetics,
    ...(audio ? { audio } : {}),
    meanings,
    ...(origin ? { origin } : {}),
    ...(license ? { license } : {}),
    sourceUrls,
  }
}

// ---- derived helpers -------------------------------------------------------

export function countDefinitions(entry: DictionaryEntry): number {
  return entry.meanings.reduce((n, m) => n + m.definitions.length, 0)
}

export function countExamples(entry: DictionaryEntry): number {
  return entry.meanings.reduce((n, m) => n + m.definitions.filter((d) => d.example).length, 0)
}

/**
 * Thin-content guard. Only entries with real substance are offered to search engines; the
 * rest stay usable for learners but get `noindex` and are left out of the sitemap.
 * Tune the thresholds to taste: stricter means fewer, better pages.
 */
export function isIndexable(entry: DictionaryEntry): boolean {
  return countDefinitions(entry) >= 2 && countExamples(entry) >= 1
}

export function allSynonyms(entry: DictionaryEntry, limit = 12): string[] {
  const out: string[] = []
  for (const m of entry.meanings) {
    for (const s of [...m.synonyms, ...m.definitions.flatMap((d) => d.synonyms)]) {
      if (!out.includes(s)) out.push(s)
    }
  }
  for (const s of entry.related?.synonyms ?? []) if (!out.includes(s)) out.push(s)
  return out.slice(0, limit)
}

export function allAntonyms(entry: DictionaryEntry, limit = 12): string[] {
  const out: string[] = []
  for (const m of entry.meanings) {
    for (const s of [...m.antonyms, ...m.definitions.flatMap((d) => d.antonyms)]) {
      if (!out.includes(s)) out.push(s)
    }
  }
  for (const s of entry.related?.antonyms ?? []) if (!out.includes(s)) out.push(s)
  return out.slice(0, limit)
}

export function firstExample(entry: DictionaryEntry): string | undefined {
  for (const m of entry.meanings) for (const d of m.definitions) if (d.example) return d.example
  return undefined
}

/** One-sentence summary for <meta name="description"> and social cards (about 155 characters). */
export function entrySummary(entry: DictionaryEntry): string {
  const first = entry.meanings[0]
  const lead = `${entry.word}${first ? ` (${first.partOfSpeech})` : ''}: ${first?.definitions[0]?.definition ?? ''}`
  const text = lead.replace(/\.$/, '')
  const suffix = ' Meaning, pronunciation, examples and real video clips.'
  const max = 158
  if (text.length + suffix.length <= max) return `${text}.${suffix}`
  return `${text.slice(0, max - 1).trimEnd()}…`
}
