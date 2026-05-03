import { createFileRoute } from "@tanstack/react-router";
import { aiPrompt } from "@/server/aiWriting";

export const Route = createFileRoute("/api/ai-prompt")({
	server: {
		handlers: {
			POST: async ({ request }: { request: Request }) => {
				const { prompt, context, selectedText } = await request.json();
				return aiPrompt({
					data: {
						prompt,
						context,
						selectedText,
					},
				});
			},
		},
	},
});
