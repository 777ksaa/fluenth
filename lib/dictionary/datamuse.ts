import 'server-only'

// Datamuse (https://www.datamuse.com/api/) supplies synonyms and antonyms when the dictionary
// lists none. It is optional enrichment: every failure returns empty lists.
//
// Terms to know: Datamuse asks for attribution (the site footer credits it), and from
// 1 February 2027 it requires an API key. When that happens, read their docs for how the key
// is sent and add it to the two URLs below. Until then, failures here simply mean fewer
// related words.

const BASE = 'https://api.datamuse.com/words'

async function related(relation: 'rel_syn' | 'rel_ant', word: string, max: number): Promise<string[]> {
  try {
    const res = await fetch(`${BASE}?${relation}=${encodeURIComponent(word)}&max=${max}`, {
      signal: AbortSignal.timeout(3000),
      cache: 'no-store',
    })
    if (!res.ok) return []
    const data: unknown = await res.json()
    if (!Array.isArray(data)) return []
    const out: string[] = []
    for (const item of data) {
      const w = (item as { word?: unknown } | null)?.word
      if (typeof w === 'string' && w.length <= 60 && /^[a-z][a-z' -]*$/i.test(w) && !out.includes(w)) out.push(w)
    }
    return out.slice(0, max)
  } catch {
    return []
  }
}

export async function fetchRelatedWords(word: string, max = 10): Promise<{ synonyms: string[]; antonyms: string[] }> {
  const [synonyms, antonyms] = await Promise.all([related('rel_syn', word, max), related('rel_ant', word, max)])
  return { synonyms, antonyms }
}
