// Word normalisation and URL slugs for /vocabulary/[word].
// Users can look up ANY word, so every input is validated before it touches the
// database, an upstream API or an AI prompt.

const MAX_LENGTH = 60
const MAX_WORDS = 8 // long idioms: "the straw that broke the camel's back"

// Only ordinary sentence punctuation, quotes, brackets and hyphens are trimmed from the ends.
// Digits, "<" and "_" are NOT trimmed, so "3d" and "<script>" are rejected rather than being
// silently turned into "d" and "script".
const EDGE_PUNCTUATION = /^[\s.,!?;:"'()\-“”]+|[\s.,!?;:"'()\-“”]+$/g

/** Canonical lowercase headword or phrase, or null if the input is not a plausible English entry. */
export function normalizeWord(input: unknown): string | null {
  if (typeof input !== 'string') return null
  const cleaned = input
    .normalize('NFKC')
    .replace(/[‘’ʼ]/g, "'")
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(EDGE_PUNCTUATION, '')
  if (cleaned.length === 0 || cleaned.length > MAX_LENGTH) return null
  if (!/^[a-z]+(?:['\- ][a-z]+)*$/.test(cleaned)) return null
  if (cleaned.split(' ').length > MAX_WORDS) return null
  return cleaned
}

/** "break the ice" -> "break-the-ice". Hyphens already in the word are kept. */
export function wordToSlug(word: string): string {
  return word.trim().toLowerCase().replace(/ +/g, '-')
}

/**
 * Possible headwords for a URL slug, most likely first. "break-the-ice" could be the
 * phrase "break the ice"; "well-known" could be the hyphenated word itself.
 */
export function slugToCandidates(slug: string): string[] {
  let decoded: string
  try {
    decoded = decodeURIComponent(slug)
  } catch {
    return []
  }
  const out: string[] = []
  for (const candidate of [decoded.replace(/-/g, ' '), decoded]) {
    const normalized = normalizeWord(candidate)
    if (normalized && !out.includes(normalized)) out.push(normalized)
  }
  return out
}
