import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Journal prompt functionality removed for v0.1
export const getJournalPrompt = createServerFn({ method: "POST" })
	.inputValidator(z.object({ journalDate: z.string() }))
	.handler(async () => {
		throw new Error("Journal prompts coming in v0.5");
	});
