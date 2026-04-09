import { defineEventHandler, readBody } from 'h3'
import { createAnthropic } from '@ai-sdk/anthropic'
import { convertToModelMessages, streamText, type UIMessage } from 'ai'
import { TONE_SYSTEM_PROMPT, AI_MODELS } from '@/lib/aiConstants'

const anthropic = createAnthropic()

interface ChatRequestBody {
  messages: UIMessage[]
  context?: string
}

export default defineEventHandler(async (event) => {
  const body = await readBody<ChatRequestBody>(event)
  if (!body) throw new Error('Request body is required')

  const systemPrompt = body.context
    ? `${TONE_SYSTEM_PROMPT}\n\nCurrent context:\n${body.context}`
    : TONE_SYSTEM_PROMPT

  const result = await streamText({
    model: anthropic(AI_MODELS.default),
    system: systemPrompt,
    messages: await convertToModelMessages(body.messages),
  })

  return result.toTextStreamResponse()
})
