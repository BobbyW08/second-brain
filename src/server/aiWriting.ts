import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// AI writing functionality removed for v0.1
export const improveWriting = createServerFn({ method: "POST" })
	.inputValidator(
		z.object({
			selection: z.string(),
			action: z.enum(["improve", "summarize", "expand"]),
			context: z.string().optional(),
		}),
	)
	.handler(async () => {
		throw new Error("AI writing improvements coming in v0.5");
	});
