import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  allSynonyms,
  entrySummary,
  isIndexable,
  normalizeApiResponse,
  safeHttpsUrl,
} from './dictionary.ts'

// Shape taken from https://api.dictionaryapi.dev/api/v2/entries/en/hello
const HELLO = [
  {
    word: 'hello',
    phonetic: 'həˈləʊ',
    phonetics: [
      { text: 'həˈləʊ', audio: '//ssl.gstatic.com/dictionary/static/sounds/20200429/hello--_gb_1.mp3' },
      { text: 'hɛˈləʊ' },
    ],
    origin: 'early 19th century: variant of earlier hollo.',
    meanings: [
      {
        partOfSpeech: 'exclamation',
        definitions: [
          { definition: 'used as a greeting or to begin a phone conversation.', example: 'hello there, Katie!', synonyms: [], antonyms: [] },
        ],
        synonyms: ['greetings'],
        antonyms: [],
      },
      {
        partOfSpeech: 'noun',
        definitions: [{ definition: 'an utterance of "hello"; a greeting.', example: 'she was getting polite nods and hellos', synonyms: [], antonyms: [] }],
        synonyms: [],
        antonyms: [],
      },
    ],
    license: { name: 'CC BY-SA 3.0', url: 'https://creativecommons.org/licenses/by-sa/3.0' },
    sourceUrls: ['https://en.wiktionary.org/wiki/hello'],
  },
  {
    word: 'hello',
    phonetics: [{ audio: 'http://insecure.example/hello.mp3' }],
    meanings: [
      {
        partOfSpeech: 'noun',
        definitions: [{ definition: 'A call for response if it is not clear if anyone is present.', synonyms: ['hallo'], antonyms: [] }],
        synonyms: [],
        antonyms: [],
      },
    ],
    license: { name: 'CC BY-SA 3.0', url: 'https://creativecommons.org/licenses/by-sa/3.0' },
    sourceUrls: ['https://en.wiktionary.org/wiki/hello'],
  },
]

test('normalises a real-shaped response', () => {
  const e = normalizeApiResponse(HELLO, 'hello')
  assert.ok(e)
  assert.equal(e.word, 'hello')
  assert.equal(e.phonetic, 'həˈləʊ')
  assert.equal(e.audio, 'https://ssl.gstatic.com/dictionary/static/sounds/20200429/hello--_gb_1.mp3')
  assert.equal(e.license?.name, 'CC BY-SA 3.0')
  assert.deepEqual(e.sourceUrls, ['https://en.wiktionary.org/wiki/hello'])
})

test('entries repeating a part of speech are merged; insecure audio is dropped', () => {
  const e = normalizeApiResponse(HELLO, 'hello')!
  assert.deepEqual(e.meanings.map((m) => m.partOfSpeech), ['exclamation', 'noun'])
  assert.equal(e.meanings[1].definitions.length, 2)
  assert.equal(e.phonetics.some((p) => p.audio?.startsWith('http://')), false)
  assert.deepEqual(allSynonyms(e), ['greetings', 'hallo'])
})

test('garbage and the upstream "not found" body yield null', () => {
  assert.equal(normalizeApiResponse(null, 'x'), null)
  assert.equal(normalizeApiResponse('nope', 'x'), null)
  assert.equal(normalizeApiResponse({ title: 'No Definitions Found' }, 'x'), null)
  assert.equal(normalizeApiResponse([], 'x'), null)
  assert.equal(normalizeApiResponse([{ word: 'x', meanings: [{ partOfSpeech: 'noun', definitions: [] }] }], 'x'), null)
  assert.equal(normalizeApiResponse([null, 5, 'a'], 'x'), null)
})

test('output is bounded', () => {
  const huge = [
    {
      word: 'big',
      meanings: Array.from({ length: 20 }, (_, i) => ({
        partOfSpeech: `pos${i}`,
        definitions: Array.from({ length: 30 }, (_, j) => ({ definition: 'd'.repeat(5000) + j })),
        synonyms: Array.from({ length: 50 }, (_, k) => `s${k}`),
      })),
    },
  ]
  const e = normalizeApiResponse(huge, 'big')!
  assert.equal(e.meanings.length, 8)
  assert.equal(e.meanings[0].definitions.length, 6)
  assert.equal(e.meanings[0].definitions[0].definition.length, 600)
  assert.equal(e.meanings[0].synonyms.length, 12)
})

test('safeHttpsUrl', () => {
  assert.equal(safeHttpsUrl('//a.example/x.mp3'), 'https://a.example/x.mp3')
  assert.equal(safeHttpsUrl('https://a.example/x'), 'https://a.example/x')
  for (const bad of ['http://a.example', 'javascript:alert(1)', 'data:text/html,hi', '', 5, null, 'not a url']) {
    assert.equal(safeHttpsUrl(bad), undefined, String(bad))
  }
})

test('thin-content guard', () => {
  const full = normalizeApiResponse(HELLO, 'hello')!
  assert.equal(isIndexable(full), true)

  const thin = normalizeApiResponse(
    [{ word: 'zzz', meanings: [{ partOfSpeech: 'noun', definitions: [{ definition: 'Sleep.' }] }] }],
    'zzz',
  )!
  assert.equal(isIndexable(thin), false)
})

test('entrySummary stays under ~160 characters', () => {
  const e = normalizeApiResponse(HELLO, 'hello')!
  assert.ok(entrySummary(e).startsWith('hello (exclamation): used as a greeting'))
  assert.ok(entrySummary(e).length <= 160)
  const long = normalizeApiResponse(
    [{ word: 'long', meanings: [{ partOfSpeech: 'noun', definitions: [{ definition: 'word '.repeat(80) }] }] }],
    'long',
  )!
  assert.ok(entrySummary(long).length <= 160)
})
