import { NextResponse } from 'next/server'
import { AiUnavailableError, complete, models } from '@/lib/ai/anthropic'
import { parseGeneratedQuiz } from '@/lib/ai/parse'
import { practiceSystem } from '@/lib/ai/prompts'
import { consumeAiQuota } from '@/lib/ai/quota'
import { isLevel } from '@/lib/core/levels'
import { getSessionContext } from '@/lib/supabase/server'

const TOPIC = /^[\p{L}\p{N} ,.'\-()/]{3,80}$/u

/** Generates a short practice set on any topic, validated before it reaches the browser. */
export async function POST(request: Request) {
  const { supabase, userId } = await getSessionContext()
  if (!userId) return NextResponse.json({ error: 'auth' }, { status: 401 })

  let body: { topic?: unknown; level?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid' }, { status: 400 })
  }
  const topic = typeof body.topic === 'string' ? body.topic.replace(/\s+/g, ' ').trim() : ''
  const level = typeof body.level === 'string' ? body.level : ''
  if (!TOPIC.test(topic) || !isLevel(level)) return NextResponse.json({ error: 'invalid' }, { status: 400 })

  if (!(await consumeAiQuota(supabase))) return NextResponse.json({ error: 'limit' }, { status: 429 })

  try {
    const text = await complete({
      model: models.tutor(),
      system: practiceSystem(level),
      messages: [{ role: 'user', content: `Topic: ${topic}` }],
      maxTokens: 1800,
    })
    const questions = parseGeneratedQuiz(text, 'ai', 6)
    if (questions.length < 3) return NextResponse.json({ error: 'failed' }, { status: 502 })
    return NextResponse.json({ questions })
  } catch (error) {
    const unavailable = error instanceof AiUnavailableError
    return NextResponse.json({ error: unavailable ? 'unavailable' : 'failed' }, { status: 502 })
  }
}
