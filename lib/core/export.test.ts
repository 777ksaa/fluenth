import { test } from 'node:test'
import assert from 'node:assert/strict'
import { cardsToTsv, tsvCell } from './export.ts'

test('cells are made safe for spreadsheets and for the tab-separated format', () => {
  assert.equal(tsvCell('=HYPERLINK("http://x")'), `'=HYPERLINK("http://x")`)
  assert.equal(tsvCell('+1 555'), "'+1 555")
  assert.equal(tsvCell('-5'), "'-5")
  assert.equal(tsvCell('a\tb\nc'), 'a b c')
  assert.equal(tsvCell(null), '')
  assert.equal(tsvCell('plain'), 'plain')
})

test('cardsToTsv makes one line per card, front then back', () => {
  const tsv = cardsToTsv([
    { word: 'break the ice', part_of_speech: null, definition: 'To start a conversation.', example: 'He told a joke to break the ice.', translation: 'растопить лёд' },
    { word: 'run', part_of_speech: 'verb', definition: 'To move fast.', example: null, translation: null },
  ])
  const lines = tsv.trimEnd().split('\n')
  assert.equal(lines.length, 2)
  assert.equal(lines[0].split('\t').length, 2)
  assert.equal(lines[0].split('\t')[0], 'break the ice')
  assert.ok(lines[0].includes('<br>Example: He told a joke to break the ice.<br>Translation: растопить лёд'))
  assert.equal(lines[1], 'run (verb)\tTo move fast.')
  assert.equal(cardsToTsv([]), '')
})
