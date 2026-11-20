import 'server-only'

// Minimal Anthropic Messages API client (plain fetch, no SDK). Swap in @anthropic-ai/sdk if you
// want built-in retries and streaming. The key stays on the server.

export class AiUnavailableError extends Error {}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export const models = {
  /** Tutor chat and practice generation. */
  tutor: () => process.env.ANTHROPIC_MODEL_TUTOR || 'claude-sonnet-5-5',
  /** Short, cheap tasks such as dictionary translations. */
  fast: () => process.env.ANTHROPIC_MODEL_FAST || 'claude-haiku-5-5',
}

export async function complete(input: {
  model: string
  system: string
  messages: ChatMessage[]
  maxTokens: number
}): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new AiUnavailableError('ANTHROPIC_API_KEY is not set')

  let res: Response
  try {
    res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: input.model,
        max_tokens: input.maxTokens,
        system: input.system,
        messages: input.messages,
      }),
      signal: AbortSignal.timeout(30_000),
      cache: 'no-store',
    })
  } catch {
    throw new AiUnavailableError('The AI service did not respond')
  }

  if (!res.ok) throw new AiUnavailableError(`The AI service returned ${res.status}`)

  const data = (await res.json()) as { content?: { type: string; text?: string }[] }
  return (data.content ?? [])
    .filter((block) => block.type === 'text' && typeof block.text === 'string')
    .map((block) => block.text as string)
    .join('')
    .trim()
}
