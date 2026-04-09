export const BLOCK_SIZE_DURATIONS: Record<"S" | "M" | "L", string> = {
	S: "00:30", // 30 minutes
	M: "01:00", // 60 minutes
	L: "01:30", // 90 minutes
};

export const PRIORITY_LABELS: Record<string, string> = {
	high: "High",
	medium: "Medium",
	low: "Low",
};

export const PRIORITY_ORDER = ["high", "medium", "low"] as const;
