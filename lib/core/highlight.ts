// Finds the studied word inside an example sentence so it can be highlighted.

export interface Segment {
  text: string
  match: boolean
}

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** The word plus its regular inflections: break, breaks, breaking; hurry, hurries, hurried. */
export function wordForms(word: string): string[] {
  const w = word.toLowerCase()
  const forms = new Set<string>([w, `${w}s`, `${w}es`, `${w}ed`, `${w}d`, `${w}ing`])
  if (/[^aeiou]y$/.test(w)) {
    const stem = w.slice(0, -1)
    forms.add(`${stem}ies`)
    forms.add(`${stem}ied`)
  }
  if (w.endsWith('e')) forms.add(`${w.slice(0, -1)}ing`)
  return [...forms].sort((a, b) => b.length - a.length)
}

/** Splits `text` into plain and matched parts. Whole-word, case-insensitive; always returns at least one segment. */
export function splitHighlight(text: string, word: string): Segment[] {
  if (!text) return []
  const pattern = new RegExp(`\\b(${wordForms(word).map(escapeRegExp).join('|')})\\b`, 'gi')
  const out: Segment[] = []
  let last = 0
  for (const m of text.matchAll(pattern)) {
    const start = m.index ?? 0
    if (start > last) out.push({ text: text.slice(last, start), match: false })
    out.push({ text: m[0], match: true })
    last = start + m[0].length
  }
  if (last < text.length) out.push({ text: text.slice(last), match: false })
  return out.length > 0 ? out : [{ text, match: false }]
}
