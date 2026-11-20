import { NextResponse } from 'next/server'
import { awardXp } from '@/lib/actions/xp'
import { AiUnavailableError, complete, models } from '@/lib/ai/anthropic'
import type { ChatMessage } from '@/lib/ai/anthropic'
import { tutorSystem } from '@/lib/ai/prompts'
import { consumeAiQuota } from '@/lib/ai/quota'
import { getSessionContext } from '@/lib/supabase/server'

const MAX_MESSAGES = 12
const MAX_MESSAGE_CHARS = 1000
const MAX_TOTAL_CHARS = 6000

function parseMessages(body: unknown): ChatMessage[] | null {
  const raw = (body as { messages?: unknown } | null)?.messages
  if (!Array.isArray(raw) || raw.length === 0) return null
  const messages: ChatMessage[] = []
  for (const m of raw.slice(-MAX_MESSAGES)) {
    const role = (m as { role?: unknown })?.role
    const content = (m as { content?: unknown })?.content
    if ((role !== 'user' && role !== 'assistant') || typeof content !== 'string') return null
    const trimmed = content.trim()
    if (trimmed.length === 0 || trimmed.length > MAX_MESSAGE_CHARS) return null
    messages.push({ role, content: trimmed })
  }
  while (messages[0]?.role === 'assistant') messages.shift() // the API requires the first turn to be the learner's
  if (messages.length === 0 || messages[messages.length - 1].role !== 'user') return null
  if (messages.reduce((n, m) => n + m.content.length, 0) > MAX_TOTAL_CHARS) return null
  return messages
}

export async function POST(request: Request) {
  const { supabase, userId } = await getSessionContext()
  if (!userId) return NextResponse.json({ error: 'auth' }, { status: 401 })

  if (Number(request.headers.get('content-length') ?? 0) > 20_000) {
    return NextResponse.json({ error: 'invalid' }, { status: 413 })
  }
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid' }, { status: 400 })
  }
  const messages = parseMessages(body)
  if (!messages) return NextResponse.json({ error: 'invalid' }, { status: 400 })

  const { data: profile } = await supabase.from('profiles').select('cefr_level, native_lang').eq('id', userId).maybeSingle()
  if (!(await consumeAiQuota(supabase))) return NextResponse.json({ error: 'limit' }, { status: 429 })

  try {
    const reply = await complete({
      model: models.tutor(),
      system: tutorSystem(profile?.cefr_level ?? 'A2', profile?.native_lang ?? 'ru'),
      messages,
      maxTokens: 400,
    })
    if (!reply) return NextResponse.json({ error: 'failed' }, { status: 502 })
    const xp = await awardXp(supabase, 'tutor', null, null)
    return NextResponse.json({ reply, xp })
  } catch (error) {
    const unavailable = error instanceof AiUnavailableError
    return NextResponse.json({ error: unavailable ? 'unavailable' : 'failed' }, { status: 502 })
  }
}
