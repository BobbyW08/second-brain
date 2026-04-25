import { createServerFn } from "@tanstack/react-start";

const GOOGLE_API_BASE = "https://www.googleapis.com/calendar/v3";

async function googleFetch(
	method: string,
	path: string,
	accessToken: string,
	body?: object,
): Promise<Response> {
	const res = await fetch(`${GOOGLE_API_BASE}${path}`, {
		method,
		headers: {
			Authorization: `Bearer ${accessToken}`,
			"Content-Type": "application/json",
		},
		body: body ? JSON.stringify(body) : undefined,
	});

	if (!res.ok) {
		const text = await res.text();
		throw new Error(`Google Calendar API error ${res.status}: ${text}`);
	}

	return res;
}

export const syncGoogleCalendar = createServerFn({ method: "POST" })
	.inputValidator(
		(data: { userId: string; accessToken: string; refreshToken: string }) =>
			data,
	)
	.handler(async ({ data }) => {
		const { accessToken } = data;

		const now = new Date();
		const timeMin = new Date(
			now.getTime() - 14 * 24 * 60 * 60 * 1000,
		).toISOString();
		const timeMax = new Date(
			now.getTime() + 14 * 24 * 60 * 60 * 1000,
		).toISOString();

		const res = await googleFetch(
			"GET",
			`/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`,
			accessToken,
		);
		const json = await res.json();
		const googleEvents = json.items || [];

		return { count: googleEvents.length };
	});

export const createGoogleEvent = createServerFn({ method: "POST" })
	.inputValidator(
		(data: {
			block: {
				title: string;
				start_time: string;
				end_time: string;
				description?: string;
				location?: string;
			};
			accessToken: string;
		}) => data,
	)
	.handler(async ({ data }) => {
		const { block, accessToken } = data;
		const body = {
			summary: block.title,
			description: block.description || "",
			location: block.location || "",
			start: { dateTime: block.start_time },
			end: { dateTime: block.end_time },
		};

		const res = await googleFetch(
			"POST",
			"/calendars/primary/events",
			accessToken,
			body,
		);
		const json = await res.json();
		return { googleEventId: json.id };
	});

export const updateGoogleEvent = createServerFn({ method: "POST" })
	.inputValidator(
		(data: {
			googleEventId: string;
			updates: {
				title?: string;
				start_time?: string;
				end_time?: string;
				description?: string;
				location?: string;
			};
			accessToken: string;
		}) => data,
	)
	.handler(async ({ data }) => {
		const { googleEventId, updates, accessToken } = data;

		const body: Record<string, string | { dateTime: string }> = {};
		if (updates.title) body.summary = updates.title;
		if (updates.description) body.description = updates.description;
		if (updates.location) body.location = updates.location;
		if (updates.start_time) body.start = { dateTime: updates.start_time };
		if (updates.end_time) body.end = { dateTime: updates.end_time };

		await googleFetch(
			"PATCH",
			`/calendars/primary/events/${googleEventId}`,
			accessToken,
			body,
		);
		return { success: true };
	});

export const deleteGoogleEvent = createServerFn({ method: "POST" })
	.inputValidator(
		(data: { googleEventId: string; accessToken: string }) => data,
	)
	.handler(async ({ data }) => {
		const { googleEventId, accessToken } = data;
		await googleFetch(
			"DELETE",
			`/calendars/primary/events/${googleEventId}`,
			accessToken,
		);
		return { success: true };
	});
