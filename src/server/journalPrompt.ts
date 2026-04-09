import { createAnthropic } from "@ai-sdk/anthropic";
import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";
import { AI_MODELS, TONE_SYSTEM_PROMPT } from "@/lib/aiConstants";

const anthropic = createAnthropic();

export const getJournalPrompt = createServerFn({ method: "POST" })
	.inputValidator(z.object({ journalDate: z.string() }))
	.handler(async ({ data }) => {
		const { text } = await generateText({
			model: anthropic(AI_MODELS.fast),
			system: TONE_SYSTEM_PROMPT,
			prompt: `Generate one thoughtful, open-ended journal reflection question for ${data.journalDate}.
The question should be brief (one sentence), encouraging, and forward-focused.
Return only the question, nothing else.`,
		});

		return { prompt: text.trim() };
	});
