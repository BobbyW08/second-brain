export const BLOCK_SIZE_DURATIONS: Record<string, string> = {
	S: "00:30",
	M: "01:00",
	L: "01:30",
	small: "00:30",
	medium: "01:00",
	large: "01:30",
};

export const PRIORITY_LABELS: Record<string, string> = {
	urgent: "Urgent",
	important: "Important",
	someday: "Someday",
	unsorted: "Unsorted",
};

export const PRIORITY_ORDER = [
	"urgent",
	"important",
	"someday",
	"unsorted",
] as const;

export const TASK_STATUS = {
	ACTIVE: "active",
	COMPLETED_TODAY: "completed_today",
	ARCHIVED: "archived",
} as const;
