import { defineEventHandler, readBody } from 'h3'
import { createAnthropic } from '@ai-sdk/anthropic'
import { streamText } from 'ai'
import { TONE_SYSTEM_PROMPT, AI_MODELS } from '@/lib/aiConstants'

const anthropic = createAnthropic()

interface ChatRequestBody {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
  context?: string
}

export default defineEventHandler(async (event) => {
  const body = await readBody<ChatRequestBody>(event)

  const systemPrompt = body.context
    ? `${TONE_SYSTEM_PROMPT}\n\nCurrent context:\n${body.context}`
    : TONE_SYSTEM_PROMPT

  const result = await streamText({
    model: anthropic(AI_MODELS.default),
    system: systemPrompt,
    messages: body.messages,
  })

  return result.toDataStreamResponse()
})
