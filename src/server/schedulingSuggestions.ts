import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Scheduling suggestions functionality removed for v0.1
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
	.handler(async () => {
		throw new Error("Scheduling suggestions coming in v0.5");
	});
