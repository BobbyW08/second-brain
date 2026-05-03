import { createAnthropic } from "@ai-sdk/anthropic";
import { createServerFn } from "@tanstack/react-start";
import { streamText } from "ai";
import { AI_MODELS, TONE_SYSTEM_PROMPT } from "@/lib/aiConstants";

interface AIContext {
	tasks?: Array<{ short_id: string; title: string; due_at?: string }>;
	folders?: Array<{ id: string; name: string; is_system?: boolean }>;
	pages?: Array<{ id: string; title: string; folder_id?: string }>;
	calendarBlocks?: Array<{ id: string; title: string; start_at: string }>;
	currentPage?: { id: string; title: string; content?: unknown } | null;
}

export const aiPrompt = createServerFn({ method: "POST" })
	.inputValidator(
		(data: { prompt: string; context: AIContext; selectedText?: string }) =>
			data,
	)
	.handler(async ({ data }) => {
		const { prompt, context, selectedText } = data;
		const anthropic = createAnthropic();

		const contextBlock = `
## Your full context

### Active tasks (not complete)
${context.tasks?.map((t) => `- [#${t.short_id}] ${t.title}${t.due_at ? ` — due ${t.due_at}` : ""}`).join("\n")}

### Calendar — today through end of week
${context.calendarBlocks?.map((b) => `- ${b.title} at ${b.start_at}`).join("\n")}

### Current page: ${context.currentPage?.title ?? "None"}
${context.currentPage?.content ? `\n${JSON.stringify(context.currentPage.content).slice(0, 3000)}` : ""}

### All pages
${context.pages?.map((p) => `- ${p.title}`).join("\n")}

${selectedText ? `### Selected text in editor\n${selectedText}` : ""}
`;

		const result = streamText({
			model: anthropic(AI_MODELS.default),
			system: `${TONE_SYSTEM_PROMPT}\n\n${contextBlock}`,
			messages: [{ role: "user", content: prompt }],
		});

		return result.toUIMessageStreamResponse();
	});
