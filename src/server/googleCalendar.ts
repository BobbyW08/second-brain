import { createServerFn } from "@tanstack/react-start";
import { google } from "googleapis";
import { supabase } from "@/utils/supabase";

const getOAuth2Client = (accessToken: string, refreshToken: string) => {
	const client = new google.auth.OAuth2(
		process.env.GOOGLE_CLIENT_ID,
		process.env.GOOGLE_CLIENT_SECRET,
		process.env.GOOGLE_REDIRECT_URI,
	);
	client.setCredentials({
		access_token: accessToken,
		refresh_token: refreshToken,
	});
	return client;
};

export const syncGoogleCalendar = createServerFn({ method: "POST" })
	.inputValidator(
		(data: { userId: string; accessToken: string; refreshToken: string }) =>
			data,
	)
	.handler(async ({ data: { userId, accessToken, refreshToken } }) => {
		const auth = getOAuth2Client(accessToken, refreshToken);

		// Refresh token on every call
		const { credentials } = await auth.refreshAccessToken();
		auth.setCredentials(credentials);

		// Persist refreshed token to profiles
		if (credentials.refresh_token) {
			await supabase
				.from("profiles")
				.update({ google_refresh_token: credentials.refresh_token })
				.eq("id", userId)
				.throwOnError();
		}

		const calendar = google.calendar({ version: "v3", auth });

		const now = new Date();
		const timeMin = new Date(
			now.getTime() - 14 * 24 * 60 * 60 * 1000,
		).toISOString();
		const timeMax = new Date(
			now.getTime() + 14 * 24 * 60 * 60 * 1000,
		).toISOString();

		const { data: eventsData } = await calendar.events.list({
			calendarId: "primary",
			timeMin,
			timeMax,
			singleEvents: true,
			orderBy: "startTime",
		});

		const events = eventsData.items ?? [];

		// Upsert into calendar_blocks matching on google_event_id
		for (const event of events) {
			if (!event.id || !event.summary) continue;

			await supabase
				.from("calendar_blocks")
				.upsert(
					{
						user_id: userId,
						title: event.summary,
						start_time: event.start?.dateTime ?? event.start?.date ?? "",
						end_time: event.end?.dateTime ?? event.end?.date ?? "",
						block_type: "event",
						google_event_id: event.id,
						is_synced: true,
					},
					{ onConflict: "google_event_id" },
				)
				.throwOnError();
		}

		return { synced: events.length };
	});

export const createGoogleEvent = createServerFn({ method: "POST" })
	.inputValidator(
		(data: {
			block: { title: string; start_time: string; end_time: string };
			accessToken: string;
			refreshToken: string;
		}) => data,
	)
	.handler(async ({ data: { block, accessToken, refreshToken } }) => {
		const auth = getOAuth2Client(accessToken, refreshToken);

		const { credentials } = await auth.refreshAccessToken();
		auth.setCredentials(credentials);

		const calendar = google.calendar({ version: "v3", auth });

		const { data: eventData } = await calendar.events.insert({
			calendarId: "primary",
			requestBody: {
				summary: block.title,
				start: { dateTime: block.start_time },
				end: { dateTime: block.end_time },
			},
		});

		return { googleEventId: eventData.id };
	});

export const updateGoogleEvent = createServerFn({ method: "POST" })
	.inputValidator(
		(data: {
			googleEventId: string;
			updates: { title?: string; start_time?: string; end_time?: string };
			accessToken: string;
			refreshToken: string;
		}) => data,
	)
	.handler(
		async ({ data: { googleEventId, updates, accessToken, refreshToken } }) => {
			const auth = getOAuth2Client(accessToken, refreshToken);

			const { credentials } = await auth.refreshAccessToken();
			auth.setCredentials(credentials);

			const calendar = google.calendar({ version: "v3", auth });

			await calendar.events.patch({
				calendarId: "primary",
				eventId: googleEventId,
				requestBody: {
					...(updates.title && { summary: updates.title }),
					...(updates.start_time && {
						start: { dateTime: updates.start_time },
					}),
					...(updates.end_time && { end: { dateTime: updates.end_time } }),
				},
			});
		},
	);

export const deleteGoogleEvent = createServerFn({ method: "POST" })
	.inputValidator(
		(data: {
			googleEventId: string;
			accessToken: string;
			refreshToken: string;
		}) => data,
	)
	.handler(async ({ data: { googleEventId, accessToken, refreshToken } }) => {
		const auth = getOAuth2Client(accessToken, refreshToken);

		const { credentials } = await auth.refreshAccessToken();
		auth.setCredentials(credentials);

		const calendar = google.calendar({ version: "v3", auth });

		await calendar.events.delete({
			calendarId: "primary",
			eventId: googleEventId,
		});
	});
