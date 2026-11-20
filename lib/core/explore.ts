// Deterministic picks for internal links and the home page. Nothing here is random at request
// time: the same word always links to the same neighbours, so a cached page never changes
// between regenerations and crawlers see a stable link graph.

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b))

function hash(text: string): number {
  let h = 5381
  for (let i = 0; i < text.length; i++) h = ((h * 33) ^ text.charCodeAt(i)) >>> 0
  return h
}

/** `count` other words from `pool`, spread across it, stable for a given `word`. Never includes `word`. */
export function exploreWords(word: string, pool: readonly string[], count = 6): string[] {
  const others = pool.filter((w) => w !== word)
  if (others.length <= count) return others
  const h = hash(word)
  const n = others.length
  let stride = 1 + ((h >>> 8) % (n - 1))
  while (gcd(stride, n) !== 1) stride++ // coprime with n, so the picks never repeat
  const start = h % n
  return Array.from({ length: count }, (_, i) => others[(start + i * stride) % n])
}

/** The same word for everyone on a given UTC day. */
export function wordOfTheDay(date: Date, pool: readonly string[]): string {
  if (pool.length === 0) throw new Error('wordOfTheDay needs a non-empty pool')
  const day = Math.floor(date.getTime() / 86_400_000)
  return pool[((day % pool.length) + pool.length) % pool.length]
}
