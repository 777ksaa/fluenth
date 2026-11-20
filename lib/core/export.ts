// Deck export for Anki (File > Import) and spreadsheets: tab-separated, one card per line.

export interface ExportCard {
  word: string
  part_of_speech: string | null
  definition: string
  example: string | null
  translation: string | null
}

/**
 * A cell that starts with = + - @ is run as a formula by Excel and Sheets, so it is prefixed
 * with an apostrophe. Tabs and line breaks would split the row, so they become spaces.
 */
export function tsvCell(value: string | null | undefined): string {
  const clean = (value ?? '').replace(/[\t\r\n]+/g, ' ').trim()
  return /^[=+\-@]/.test(clean) ? `'${clean}` : clean
}

/** Front: the word. Back: definition, example and translation, in that order. */
export function cardsToTsv(cards: ExportCard[]): string {
  const rows = cards.map((c) => {
    const front = tsvCell(c.part_of_speech ? `${c.word} (${c.part_of_speech})` : c.word)
    const back = [c.definition, c.example ? `Example: ${c.example}` : '', c.translation ? `Translation: ${c.translation}` : '']
      .filter(Boolean)
      .join('<br>')
    return `${front}\t${tsvCell(back)}`
  })
  return rows.length > 0 ? `${rows.join('\n')}\n` : ''
}
