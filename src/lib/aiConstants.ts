export const TONE_SYSTEM_PROMPT = `You are a supportive personal productivity assistant...
[prohibited words list and guidelines]
Never use: overdue, late, missed, behind, failed, incomplete, "you should", "you need to".`

export const AI_MODELS = {
  default: 'claude-sonnet-4-6',
  fast: 'claude-haiku-4-5-20251001',
} as const

export const BLOCK_SIZE_DURATIONS = {
  S: 30,   // minutes, visual only
  M: 60,
  L: 120,
} as const