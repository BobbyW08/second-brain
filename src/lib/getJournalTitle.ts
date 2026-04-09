/**
 * Returns the journal page title for a given date range.
 *
 * Same day:         "Journal — Monday, April 7"
 * Same month range: "Journal — Mon – Fri, April 7–11"
 * Cross-month range:"Journal — April 7 – May 3"
 */
export function getJournalTitle(createdAt: Date, updatedAt: Date): string {
	const start = createdAt;
	const end = updatedAt;

	const sameDay =
		start.getFullYear() === end.getFullYear() &&
		start.getMonth() === end.getMonth() &&
		start.getDate() === end.getDate();

	if (sameDay) {
		return `Journal — ${start.toLocaleDateString("en-US", {
			weekday: "long",
			month: "long",
			day: "numeric",
		})}`;
	}

	const sameMonth =
		start.getFullYear() === end.getFullYear() &&
		start.getMonth() === end.getMonth();

	if (sameMonth) {
		const startDay = start.toLocaleDateString("en-US", { weekday: "short" });
		const endDay = end.toLocaleDateString("en-US", { weekday: "short" });
		const month = start.toLocaleDateString("en-US", { month: "long" });
		return `Journal — ${startDay} – ${endDay}, ${month} ${start.getDate()}–${end.getDate()}`;
	}

	// Cross-month
	const startStr = start.toLocaleDateString("en-US", {
		month: "long",
		day: "numeric",
	});
	const endStr = end.toLocaleDateString("en-US", {
		month: "long",
		day: "numeric",
	});
	return `Journal — ${startStr} – ${endStr}`;
}
