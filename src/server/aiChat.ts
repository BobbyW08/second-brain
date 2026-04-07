import { createServerFn } from '@tanstack/react-start'
import { createAnthropic } from '@ai-sdk/anthropic'
import { streamText } from 'ai'
import { z } from 'zod'
import { TONE_SYSTEM_PROMPT, AI_MODELS } from '@/lib/aiConstants'

const anthropic = createAnthropic()

const MessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
})

export const chatStream = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      messages: z.array(MessageSchema),
      context: z.string().optional(),
    })
  )
  .handler(async ({ data }) => {
    const systemPrompt = data.context
      ? `${TONE_SYSTEM_PROMPT}\n\nCurrent context:\n${data.context}`
      : TONE_SYSTEM_PROMPT

    const result = await streamText({
      model: anthropic(AI_MODELS.default),
      system: systemPrompt,
      messages: data.messages,
    })

    return result.toDataStreamResponse()
  })