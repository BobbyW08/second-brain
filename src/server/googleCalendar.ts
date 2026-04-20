import { createServerFn } from "@tanstack/react-start";

export const syncGoogleCalendar = createServerFn({ method: "POST" })
	.inputValidator(
		(data: { userId: string; accessToken: string; refreshToken: string }) =>
			data,
	)
	.handler(async () => {
		throw new Error("Google Calendar sync coming in v0.5");
	});

export const createGoogleEvent = createServerFn({ method: "POST" })
	.inputValidator(
		(data: {
			block: { title: string; start_time: string; end_time: string };
			accessToken: string;
			refreshToken: string;
		}) => data,
	)
	.handler(async () => {
		throw new Error("Google Calendar event creation coming in v0.5");
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
	.handler(async () => {
		throw new Error("Google Calendar event update coming in v0.5");
	});

export const deleteGoogleEvent = createServerFn({ method: "POST" })
	.inputValidator(
		(data: {
			googleEventId: string;
			accessToken: string;
			refreshToken: string;
		}) => data,
	)
	.handler(async () => {
		throw new Error("Google Calendar event deletion coming in v0.5");
	});
