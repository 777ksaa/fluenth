// Word-level diff used by dictation, speaking and drills.
// Aligns the learner's answer to the reference with a small edit-distance DP, so one missing
// word does not mark everything after it as wrong.

export type DiffStatus = 'correct' | 'typo' | 'wrong' | 'missing' | 'extra'

export interface DiffToken {
  status: DiffStatus
  expected?: string
  got?: string
}

export interface DiffResult {
  tokens: DiffToken[]
  total: number
  correct: number
  typos: number
  wrong: number
  missing: number
  extra: number
  /** 0..1. Typos count half; extra words count against you. */
  accuracy: number
  perfect: boolean
}

export interface DiffOptions {
  /** "I'm" == "I am". Off for dictation (spelling matters), on for speech recognition. */
  expandContractions?: boolean
}

const CONTRACTIONS = new Map<string, string>(
  Object.entries({
    "i'm": 'i am',
    "you're": 'you are',
    "we're": 'we are',
    "they're": 'they are',
    "don't": 'do not',
    "doesn't": 'does not',
    "didn't": 'did not',
    "can't": 'can not',
    cannot: 'can not',
    "won't": 'will not',
    "isn't": 'is not',
    "aren't": 'are not',
    "wasn't": 'was not',
    "weren't": 'were not',
    "haven't": 'have not',
    "hasn't": 'has not',
    "hadn't": 'had not',
    "wouldn't": 'would not',
    "couldn't": 'could not',
    "shouldn't": 'should not',
    "i'll": 'i will',
    "you'll": 'you will',
    "we'll": 'we will',
    "they'll": 'they will',
    "i've": 'i have',
    "you've": 'you have',
    "we've": 'we have',
    "they've": 'they have',
    "let's": 'let us',
  }),
)

export function tokenize(text: string, opts: DiffOptions = {}): string[] {
  const words = text
    .normalize('NFKC')
    .replace(/[‘’ʼ]/g, "'")
    .replace(/[–—]/g, ' ')
    .toLowerCase()
    .replace(/[^a-z0-9'\-\s]/g, ' ')
    .split(/\s+/)
    .map((w) => w.replace(/^['\-]+|['\-]+$/g, ''))
    .filter(Boolean)
  if (!opts.expandContractions) return words
  return words.flatMap((w) => (CONTRACTIONS.get(w) ?? w).split(' '))
}

/** Optimal-string-alignment distance: an adjacent swap ("recieve") costs 1. */
export function editDistance(a: string, b: string): number {
  const n = a.length
  const m = b.length
  if (n === 0) return m
  if (m === 0) return n
  const d: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0))
  for (let i = 0; i <= n; i++) d[i][0] = i
  for (let j = 0; j <= m; j++) d[0][j] = j
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost)
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1)
      }
    }
  }
  return d[n][m]
}

/** Short words must be exact ("cat" is not "car"); longer words tolerate a slip or two. */
export function maxTypoDistance(length: number): number {
  if (length <= 3) return 0
  if (length <= 7) return 1
  return 2
}

const TYPO_COST = 0.4

function pairCost(expected: string, got: string): { cost: number; status: 'correct' | 'typo' | 'wrong' } {
  if (expected === got) return { cost: 0, status: 'correct' }
  const limit = maxTypoDistance(expected.length)
  if (limit > 0 && editDistance(expected, got) <= limit) return { cost: TYPO_COST, status: 'typo' }
  return { cost: 1, status: 'wrong' }
}

const near = (a: number, b: number) => Math.abs(a - b) < 1e-9

export function diffWords(expected: string, answer: string, opts: DiffOptions = {}): DiffResult {
  const E = tokenize(expected, opts)
  const G = tokenize(answer, opts)
  const n = E.length
  const m = G.length

  const cost: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0))
  for (let i = 1; i <= n; i++) cost[i][0] = i
  for (let j = 1; j <= m; j++) cost[0][j] = j
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      cost[i][j] = Math.min(
        cost[i - 1][j - 1] + pairCost(E[i - 1], G[j - 1]).cost,
        cost[i - 1][j] + 1,
        cost[i][j - 1] + 1,
      )
    }
  }

  const tokens: DiffToken[] = []
  let i = n
  let j = m
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0) {
      const pair = pairCost(E[i - 1], G[j - 1])
      if (near(cost[i][j], cost[i - 1][j - 1] + pair.cost)) {
        tokens.push({ status: pair.status, expected: E[i - 1], got: G[j - 1] })
        i--
        j--
        continue
      }
    }
    if (i > 0 && near(cost[i][j], cost[i - 1][j] + 1)) {
      tokens.push({ status: 'missing', expected: E[i - 1] })
      i--
      continue
    }
    tokens.push({ status: 'extra', got: G[j - 1] })
    j--
  }
  tokens.reverse()

  const count = (status: DiffStatus) => tokens.filter((t) => t.status === status).length
  const correct = count('correct')
  const typos = count('typo')
  const wrong = count('wrong')
  const missing = count('missing')
  const extra = count('extra')
  const perfect = typos + wrong + missing + extra === 0
  const denominator = n + extra
  const accuracy = perfect ? 1 : denominator === 0 ? 0 : (correct + 0.5 * typos) / denominator

  return { tokens, total: n, correct, typos, wrong, missing, extra, accuracy, perfect }
}

/** Plain-language lines describing each mistake, for screen readers and text-only feedback. */
export function describeDiff(tokens: DiffToken[]): string[] {
  const lines: string[] = []
  for (const t of tokens) {
    if (t.status === 'wrong' || t.status === 'typo') lines.push(`You wrote "${t.got}" where the answer has "${t.expected}".`)
    else if (t.status === 'missing') lines.push(`Missing the word "${t.expected}".`)
    else if (t.status === 'extra') lines.push(`The word "${t.got}" is extra.`)
  }
  return lines
}
