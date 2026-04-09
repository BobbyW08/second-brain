import { createAnthropic } from "@ai-sdk/anthropic";
import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";
import { AI_MODELS, TONE_SYSTEM_PROMPT } from "@/lib/aiConstants";

const anthropic = createAnthropic();

export const improveWriting = createServerFn({ method: "POST" })
	.inputValidator(
		z.object({
			selection: z.string(),
			action: z.enum(["improve", "summarize", "expand"]),
			context: z.string().optional(),
		}),
	)
	.handler(async ({ data }) => {
		const actionInstructions = {
			improve:
				"Improve the clarity and flow of the following text. Keep the meaning intact.",
			summarize: "Summarize the following text concisely.",
			expand: "Expand the following text with more detail and depth.",
		};

		const { text } = await generateText({
			model: anthropic(AI_MODELS.fast),
			system: TONE_SYSTEM_PROMPT,
			prompt: `${actionInstructions[data.action]}\n\nText:\n${data.selection}`,
		});

		return { result: text };
	});
