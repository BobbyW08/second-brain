import { createAnthropic } from "@ai-sdk/anthropic";
import { createServerFn } from "@tanstack/react-start";
import { generateObject } from "ai";
import { z } from "zod";
import { AI_MODELS, TONE_SYSTEM_PROMPT } from "@/lib/aiConstants";

const anthropic = createAnthropic();

const SuggestionSchema = z.array(
	z.object({
		taskId: z.string(),
		suggestedStart: z.string().describe("ISO 8601 datetime"),
		suggestedEnd: z.string().describe("ISO 8601 datetime"),
		reason: z.string().describe("Brief, encouraging explanation"),
	}),
);

export const getSchedulingSuggestions = createServerFn({ method: "POST" })
	.inputValidator(
		z.object({
			tasks: z.array(
				z.object({
					id: z.string(),
					title: z.string(),
					priority: z.string(),
					block_size: z.string(),
				}),
			),
			existingBlocks: z.array(
				z.object({
					start_time: z.string(),
					end_time: z.string(),
					title: z.string(),
				}),
			),
			date: z.string().describe("ISO date for suggestions"),
		}),
	)
	.handler(async ({ data }) => {
		const prompt = `
Given these tasks and existing calendar blocks, suggest optimal scheduling for up to 3 tasks.
Work day: 9am–6pm. Respect existing blocks. Block sizes: S=30min, M=60min, L=120min.
Date: ${data.date}

Tasks:
${data.tasks.map((t) => `- ${t.title} (${t.priority}, ${t.block_size})`).join("\n")}

Existing blocks:
${data.existingBlocks.map((b) => `- ${b.title}: ${b.start_time} – ${b.end_time}`).join("\n")}
`;

		const { object } = await generateObject({
			model: anthropic(AI_MODELS.default),
			system: TONE_SYSTEM_PROMPT,
			prompt,
			schema: SuggestionSchema,
		});

		return object;
	});
