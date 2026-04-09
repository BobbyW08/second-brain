import { describe, expect, it } from "vitest";

import { getJournalTitle } from "./getJournalTitle";

describe("getJournalTitle", () => {
	it("returns single-day title with full weekday and date", () => {
		const d = new Date("2026-04-07T10:00:00");

		expect(getJournalTitle(d, d)).toBe("Journal — Tuesday, April 7");
	});

	it("returns same-month range title", () => {
		const start = new Date("2026-04-07T10:00:00");
		const end = new Date("2026-04-11T10:00:00");

		expect(getJournalTitle(start, end)).toBe("Journal — Tue – Sat, April 7–11");
	});

	it("returns cross-month range title", () => {
		const start = new Date("2026-04-28T10:00:00");
		const end = new Date("2026-05-02T10:00:00");

		expect(getJournalTitle(start, end)).toBe("Journal — April 28 – May 2");
	});

	it("handles month boundary correctly — same month last day to next month first day", () => {
		const start = new Date("2026-03-31T10:00:00");
		const end = new Date("2026-04-01T10:00:00");

		expect(getJournalTitle(start, end)).toBe("Journal — March 31 – April 1");
	});

	it("handles year boundary correctly", () => {
		const start = new Date("2026-12-30T10:00:00");
		const end = new Date("2027-01-02T10:00:00");

		expect(getJournalTitle(start, end)).toBe(
			"Journal — December 30 – January 2",
		);
	});
});
