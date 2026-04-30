import crypto from "node:crypto";
import { createServerFn } from "@tanstack/react-start";
import { supabase } from "@/utils/supabase";

const GOOGLE_API_BASE = "https://www.googleapis.com/calendar/v3";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

// ─── Helpers ───────────────────────────────────────────────────────────────────

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

/** Compute SHA-256 hash of title|start_time|end_time for change detection */
function computeContentHash(
	title: string,
	startTime: string,
	endTime: string,
): string {
	const content = `title:${title}|start:${startTime}|end:${endTime}`;
	return crypto.createHash("sha256").update(content).digest("hex");
}

// ─── FUNCTION 1: refreshGoogleTokenIfNeeded ────────────────────────────────

export const refreshGoogleTokenIfNeeded = createServerFn({ method: "POST" })
	.inputValidator((data: { userId: string }) => data)
	.handler(async ({ data }) => {
		const { userId } = data;

		const { data: profile } = await supabase
			.from("profiles")
			.select("google_access_token, google_refresh_token, google_token_expiry")
			.eq("id", userId)
			.single()
			.throwOnError();

		if (!profile?.google_refresh_token) {
			throw new Error("No Google refresh token available");
		}

		// Check if token is expired or expires within 5 minutes
		const expiry = profile.google_token_expiry
			? new Date(profile.google_token_expiry)
			: null;
		const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);

		if (
			profile.google_access_token &&
			expiry &&
			expiry > fiveMinutesFromNow
		) {
			return { access_token: profile.google_access_token as string };
		}

		// Token expired or expiring soon — refresh
		const clientId = process.env.GOOGLE_CLIENT_ID;
		const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

		if (!clientId || !clientSecret) {
			throw new Error("Google OAuth client ID or secret not configured");
		}

		const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
			method: "POST",
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
			body: new URLSearchParams({
				client_id: clientId,
				client_secret: clientSecret,
				refresh_token: profile.google_refresh_token,
				grant_type: "refresh_token",
			}),
		});

		if (!tokenRes.ok) {
			const text = await tokenRes.text();
			throw new Error(`Token refresh failed ${tokenRes.status}: ${text}`);
		}

		const tokenData = await tokenRes.json();
		const newAccessToken = tokenData.access_token;
		const newExpiry = new Date(
			Date.now() + (tokenData.expires_in || 3600) * 1000,
		).toISOString();

		await supabase
			.from("profiles")
			.update({
				google_access_token: newAccessToken,
				google_token_expiry: newExpiry,
			})
			.eq("id", userId)
			.throwOnError();

		return { access_token: newAccessToken };
	});

// ─── FUNCTION 2: createGoogleCalendarEvent ──────────────────────────────────

export const createGoogleCalendarEvent = createServerFn({ method: "POST" })
	.inputValidator(
		(data: {
			userId: string;
			block: {
				id: string;
				title: string;
				start_time: string;
				end_time: string;
				all_day?: boolean;
				description?: string;
			};
			calendarId?: string;
		}) => data,
	)
	.handler(async ({ data }) => {
		const { userId, block, calendarId = "primary" } = data;

		const { access_token } = await refreshGoogleTokenIfNeeded({
			data: { userId },
		});

		const syncClusterId = crypto.randomUUID();

		const eventBody: Record<string, unknown> = {
			summary: block.title,
			description: block.description || "",
			start: block.all_day
				? { date: block.start_time.split("T")[0] }
				: { dateTime: block.start_time },
			end: block.all_day
				? { date: block.end_time.split("T")[0] }
				: { dateTime: block.end_time },
			extendedProperties: {
				shared: {
					source_id: block.id,
					origin: "local",
					sync_cluster_id: syncClusterId,
				},
			},
		};

		const res = await googleFetch(
			"POST",
			`/calendars/${calendarId}/events`,
			access_token as string,
			eventBody,
		);
		const json = await res.json();
		const googleEventId = json.id;

		// Upsert into event_mappings
		const contentHash = computeContentHash(
			block.title,
			block.start_time,
			block.end_time,
		);

		await supabase
			.from("event_mappings")
			.upsert(
				{
					user_id: userId,
					local_block_id: block.id,
					google_event_id: googleEventId,
					google_calendar_id: calendarId,
					sync_cluster_id: syncClusterId,
					content_hash: contentHash,
					origin: "local",
					last_synced_at: new Date().toISOString(),
				},
				{ onConflict: "user_id,google_event_id" },
			)
			.throwOnError();

		// Update calendar_blocks
		await supabase
			.from("calendar_blocks")
			.update({
				google_event_id: googleEventId,
				is_google_synced: true,
			})
			.eq("id", block.id)
			.eq("user_id", userId)
			.throwOnError();

		return { googleEventId };
	});

// ─── FUNCTION 3: updateGoogleCalendarEvent ──────────────────────────────────

export const updateGoogleCalendarEvent = createServerFn({ method: "POST" })
	.inputValidator(
		(data: {
			userId: string;
			googleEventId: string;
			block: {
				title?: string;
				start_time?: string;
				end_time?: string;
				all_day?: boolean;
				description?: string;
			};
			calendarId?: string;
		}) => data,
	)
	.handler(async ({ data }) => {
		const { userId, googleEventId, block, calendarId = "primary" } = data;

		const { access_token } = await refreshGoogleTokenIfNeeded({
			data: { userId },
		});

		// Check content hash — skip API call if unchanged
		if (block.title && block.start_time && block.end_time) {
			const newHash = computeContentHash(
				block.title,
				block.start_time,
				block.end_time,
			);

			const { data: mapping } = await supabase
				.from("event_mappings")
				.select("content_hash")
				.eq("user_id", userId)
				.eq("google_event_id", googleEventId)
				.single();

			if (mapping && mapping.content_hash === newHash) {
				return { updated: false }; // No changes
			}
		}

		const body: Record<string, unknown> = {};
		if (block.title) body.summary = block.title;
		if (block.description !== undefined) body.description = block.description;
		if (block.start_time) {
			body.start = block.all_day
				? { date: block.start_time.split("T")[0] }
				: { dateTime: block.start_time };
		}
		if (block.end_time) {
			body.end = block.all_day
				? { date: block.end_time.split("T")[0] }
				: { dateTime: block.end_time };
		}

		await googleFetch(
			"PATCH",
			`/calendars/${calendarId}/events/${googleEventId}`,
			access_token as string,
			body,
		);

		// Update event_mappings content_hash
		if (block.title && block.start_time && block.end_time) {
			const newHash = computeContentHash(
				block.title,
				block.start_time,
				block.end_time,
			);

			await supabase
				.from("event_mappings")
				.update({
					content_hash: newHash,
					last_synced_at: new Date().toISOString(),
				})
				.eq("user_id", userId)
				.eq("google_event_id", googleEventId)
				.throwOnError();
		}

		return { updated: true };
	});

// ─── FUNCTION 4: deleteGoogleCalendarEvent ──────────────────────────────────

export const deleteGoogleCalendarEvent = createServerFn({ method: "POST" })
	.inputValidator(
		(data: {
			userId: string;
			googleEventId: string;
			calendarId?: string;
		}) => data,
	)
	.handler(async ({ data }) => {
		const { userId, googleEventId, calendarId = "primary" } = data;

		const { access_token } = await refreshGoogleTokenIfNeeded({
			data: { userId },
		});

		// Delete from Google
		await googleFetch(
			"DELETE",
			`/calendars/${calendarId}/events/${googleEventId}`,
			access_token as string,
		).catch((err) => {
			// If already deleted (404), continue
			if (!err.message?.includes("404")) throw err;
		});

		// Delete from event_mappings
		await supabase
			.from("event_mappings")
			.delete()
			.eq("user_id", userId)
			.eq("google_event_id", googleEventId)
			.throwOnError();

		// Update calendar_blocks
		await supabase
			.from("calendar_blocks")
			.update({
				google_event_id: null,
				is_google_synced: false,
			})
			.eq("user_id", userId)
			.eq("google_event_id", googleEventId)
			.throwOnError();

		return { deleted: true };
	});

// ─── FUNCTION 5: fetchGoogleCalendarEvents ──────────────────────────────────

export const fetchGoogleCalendarEvents = createServerFn({ method: "POST" })
	.inputValidator(
		(data: { userId: string; calendarId?: string }) => data,
	)
	.handler(async ({ data }) => {
		const { userId, calendarId = "primary" } = data;

		const { access_token } = await refreshGoogleTokenIfNeeded({
			data: { userId },
		});

		const now = new Date();
		const timeMin = now.toISOString();
		const timeMax = new Date(
			now.getTime() + 90 * 24 * 60 * 60 * 1000,
		).toISOString();

		const url = `/calendars/${calendarId}/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime`;

		const res = await googleFetch("GET", url, access_token);
		const json = await res.json();
		const googleEvents = json.items || [];

		// Map to FullCalendar event objects
		const events = googleEvents
			.filter((ev: { status?: string }) => ev.status !== "cancelled")
			.map(
				(
					ev: {
						id: string;
						summary?: string;
						start?: { dateTime?: string; date?: string };
						end?: { dateTime?: string; date?: string };
						recurringEventId?: string;
						extendedProperties?: {
							shared?: {
								sync_cluster_id?: string;
								origin?: string;
								source_id?: string;
							};
						};
					},
				) => ({
					id: ev.id,
					title: ev.summary || "(no title)",
					start: ev.start?.dateTime || ev.start?.date || "",
					end: ev.end?.dateTime || ev.end?.date || "",
					allDay: !ev.start?.dateTime,
					extendedProps: {
						source: "google",
						googleEventId: ev.id,
						recurringEventId: ev.recurringEventId || null,
						syncClusterId:
							ev.extendedProperties?.shared?.sync_cluster_id || null,
						origin:
							ev.extendedProperties?.shared?.origin || "google",
					},
				}),
			);

		return events;
	});

// ─── FUNCTION 6: syncGoogleToLocal ──────────────────────────────────────────

export const syncGoogleToLocal = createServerFn({ method: "POST" })
	.inputValidator(
		(data: { userId: string; calendarId?: string }) => data,
	)
	.handler(async ({ data }) => {
		const { userId, calendarId = "primary" } = data;

		// Fetch Google events
		const googleEvents =
			await fetchGoogleCalendarEvents({
				data: { userId, calendarId },
			});

		let created = 0;
		let updated = 0;
		let removed = 0;

		for (const ev of googleEvents) {
			const googleEventId = ev.id as string;

			// Check for existing mapping
			const { data: mapping } = await supabase
				.from("event_mappings")
				.select("*, local_block_id")
				.eq("user_id", userId)
				.eq("google_event_id", googleEventId)
				.single();

			const contentHash = computeContentHash(
				ev.title || "",
				(ev.start as string) || "",
				(ev.end as string) || "",
			);

			// Cancelled event
			if ((ev as { status?: string }).status === "cancelled") {
				if (mapping) {
					// Delete local block
					if (mapping.local_block_id) {
						await supabase
							.from("calendar_blocks")
							.delete()
							.eq("id", mapping.local_block_id)
							.eq("user_id", userId)
							.throwOnError();
					}
					// Delete mapping
					await supabase
						.from("event_mappings")
						.delete()
						.eq("id", mapping.id)
						.throwOnError();
					removed++;
				}
				continue;
			}

			if (!mapping) {
				// No mapping — check extendedProperties for source_id
				const props = (ev.extendedProps || {}) as {
					syncClusterId?: string;
					origin?: string;
				};

				// Native Google event (no source_id) — create local block
				const newBlock = {
					user_id: userId,
					title: ev.title || "(no title)",
					start_time: (ev.start as string) || new Date().toISOString(),
					end_time: (ev.end as string) || new Date().toISOString(),
					block_type: "google",
					google_event_id: googleEventId,
					is_google_synced: true,
				};

				const { data: inserted } = await supabase
					.from("calendar_blocks")
					.insert(newBlock)
					.select()
					.single()
					.throwOnError();

				// Create event_mapping
				await supabase
					.from("event_mappings")
					.insert({
						user_id: userId,
						local_block_id: inserted.id,
						google_event_id: googleEventId,
						google_calendar_id: calendarId,
						sync_cluster_id:
							props.syncClusterId || crypto.randomUUID(),
						content_hash: contentHash,
						origin: "google",
						last_synced_at: new Date().toISOString(),
					})
					.throwOnError();

				created++;
			} else if (mapping.content_hash !== contentHash) {
				// Hash differs — check origin
				if (mapping.origin === "google") {
					// Google is origin — update local block
					if (!mapping.local_block_id) return; // Skip if no local block linked

					await supabase
						.from("calendar_blocks")
						.update({
							title: ev.title || "(no title)",
							start_time: (ev.start as string) || "",
							end_time: (ev.end as string) || "",
						})
						.eq("id", mapping.local_block_id)
						.eq("user_id", userId)
						.throwOnError();

					// Update mapping
					await supabase
						.from("event_mappings")
						.update({
							content_hash: contentHash,
							last_synced_at: new Date().toISOString(),
						})
						.eq("id", mapping.id)
						.throwOnError();

					updated++;
				}
				// origin === 'local': local wins, skip Google changes
			}
		}

		return { created, updated, removed };
	});

// ─── FUNCTION 7: syncLocalToGoogle ──────────────────────────────────────────

export const syncLocalToGoogle = createServerFn({ method: "POST" })
	.inputValidator(
		(data: { userId: string; calendarId?: string }) => data,
	)
	.handler(async ({ data }) => {
		const { userId, calendarId = "primary" } = data;

		// Fetch local blocks that should be synced
		const { data: blocks } = await supabase
			.from("calendar_blocks")
			.select("*")
			.eq("user_id", userId)
			.eq("is_google_synced", true)
			.throwOnError();

		let pushed = 0;
		let updated = 0;

		if (!blocks) return { pushed, updated };

		for (const block of blocks) {
			if (!block.google_event_id) {
				// No Google event yet — create
				await createGoogleCalendarEvent({
					data: {
						userId,
						block: {
							id: block.id,
							title: block.title,
							start_time: block.start_time,
							end_time: block.end_time,
							all_day: false,
						},
						calendarId,
					},
				});
				pushed++;
			} else {
				// Already has Google event — update (hash check inside)
				const result = await updateGoogleCalendarEvent({
					data: {
						userId,
						googleEventId: block.google_event_id,
						block: {
							title: block.title,
							start_time: block.start_time,
							end_time: block.end_time,
						},
						calendarId,
					},
				});
				if (result.updated) updated++;
			}
		}

		return { pushed, updated };
	});

// ─── FUNCTION 8: triggerFullSync ────────────────────────────────────────────

export const triggerFullSync = createServerFn({ method: "POST" })
	.inputValidator(
		(data: { userId: string; calendarId?: string }) => data,
	)
	.handler(async ({ data }) => {
		const { userId, calendarId = "primary" } = data;

		const googleToLocal = await syncGoogleToLocal({
			data: { userId, calendarId },
		});

		const localToGoogle = await syncLocalToGoogle({
			data: { userId, calendarId },
		});

		return { googleToLocal, localToGoogle };
	});
