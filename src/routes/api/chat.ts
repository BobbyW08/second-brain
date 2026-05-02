import { createAnthropic } from "@ai-sdk/anthropic";
import { createFileRoute } from "@tanstack/react-router";
import { streamText } from "ai";
import { AI_MODELS, TONE_SYSTEM_PROMPT } from "@/lib/aiConstants";

export const Route = createFileRoute("/api/chat")({
	server: {
		handlers: {
			POST: async ({ request }: { request: Request }) => {
				const { messages } = await request.json();
				const anthropic = createAnthropic();
				const result = streamText({
					model: anthropic(AI_MODELS.default),
					system: TONE_SYSTEM_PROMPT,
					messages,
				});
				return result.toUIMessageStreamResponse();
			},
		},
	},
});
