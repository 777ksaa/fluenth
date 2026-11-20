import { test } from 'node:test'
import assert from 'node:assert/strict'
import { splitHighlight, wordForms } from './highlight.ts'

const matches = (text: string, word: string) => splitHighlight(text, word).filter((s) => s.match).map((s) => s.text)

test('highlights the word and its regular inflections, whole words only', () => {
  assert.deepEqual(matches('She was in a hurry.', 'hurry'), ['hurry'])
  assert.deepEqual(matches('They hurried home; he hurries too.', 'hurry'), ['hurried', 'hurries'])
  assert.deepEqual(matches('Making plans is easy; she makes them.', 'make'), ['Making', 'makes'])
  assert.deepEqual(matches('Icebreakers help.', 'ice'), [])
  assert.deepEqual(matches('Please break the ice.', 'break the ice'), ['break the ice'])
})

test('segments always reassemble the original text', () => {
  for (const [text, word] of [['Hello hello HELLO.', 'hello'], ['no match here', 'zebra'], ['a.b(c) d', 'a.b(c)'], ['', 'x']] as const) {
    assert.equal(splitHighlight(text, word).map((s) => s.text).join(''), text)
  }
  assert.deepEqual(splitHighlight('no match here', 'zebra'), [{ text: 'no match here', match: false }])
})

test('special characters in the word cannot break the pattern', () => {
  assert.doesNotThrow(() => splitHighlight('text', '(a+'))
  assert.ok(wordForms('try').includes('tried'))
  assert.ok(wordForms('make').includes('making'))
})
