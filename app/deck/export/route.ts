import { cardsToTsv } from '@/lib/core/export'
import type { ExportCard } from '@/lib/core/export'
import { getSessionContext } from '@/lib/supabase/server'

/** Tab-separated file that Anki (and any spreadsheet) can import. Row Level Security limits it to the caller's own cards. */
export async function GET() {
  const { supabase, userId } = await getSessionContext()
  if (!userId) return new Response('Sign in to export your deck.', { status: 401 })

  const { data, error } = await supabase
    .from('cards')
    .select('word, part_of_speech, definition, example, translation')
    .order('created_at', { ascending: true })
    .limit(5000)
  if (error) return new Response('The deck could not be exported. Try again.', { status: 500 })

  return new Response(cardsToTsv((data ?? []) as ExportCard[]), {
    headers: {
      'content-type': 'text/tab-separated-values; charset=utf-8',
      'content-disposition': 'attachment; filename="fluentpath-deck.txt"',
      'cache-control': 'private, no-store',
    },
  })
}
