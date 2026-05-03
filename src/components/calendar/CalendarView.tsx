import type {
	EventChangeArg,
	EventClickArg,
	EventContentArg,
} from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
import type { DropArg } from "@fullcalendar/interaction";
import interactionPlugin from "@fullcalendar/interaction";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useCalendarBlocks } from "@/queries/calendarBlocks";
import {
	fetchGoogleCalendarEvents,
	triggerFullSync,
	updateGoogleCalendarEvent,
} from "@/server/googleCalendar";
import { useUIStore } from "@/stores/useUIStore";
import { supabase } from "@/utils/supabase";
import { EventSidePanel } from "./EventSidePanel";
import { GoogleSyncDialog } from "./GoogleSyncDialog";
import { RecurringEditDialog } from "./RecurringEditDialog";
import "./styles/calendar.css";

const EventItem = ({ info }: { info: EventContentArg }) => {
	const { event } = info;
	const timeText = info.timeText || "";
	const [left, right] = timeText.split(" - ");
	return (
		<div style={{ overflow: "hidden", width: "100%" }}>
			<div
				style={{
					display: "flex",
					flexDirection: "column",
					gap: "0px",
					fontSize: "12px",
				}}
			>
				<p style={{ fontWeight: 600, lineHeight: "1.2", margin: 0 }}>
					{event.title}
				</p>
				<p
					style={{
						fontSize: "11px",
						color: "var(--muted-foreground)",
						margin: 0,
					}}
				>
					{left} - {right}
				</p>
			</div>
		</div>
	);
};

export function CalendarView() {
	const { userId } = useCurrentUser();
	const queryClient = useQueryClient();
	const {
		sidePanelBlockId,
		setSidePanelBlockId,
		calendarGoogleSyncEnabled,
		setCalendarGoogleSyncEnabled,
	} = useUIStore();

	const calendarRef = useRef<FullCalendar | null>(null);

	const today = new Date();
	const rangeStart = new Date(today);
	rangeStart.setDate(today.getDate() - 14);
	const rangeEnd = new Date(today);
	rangeEnd.setDate(today.getDate() + 14);

	const { data: calendarBlocks = [] } = useCalendarBlocks(userId ?? "", {
		start: rangeStart.toISOString(),
		end: rangeEnd.toISOString(),
	});

	const { data: googleEvents = [], refetch: refetchGoogle } = useQuery({
		queryKey: ["google-events", userId],
		enabled: !!userId && calendarGoogleSyncEnabled,
		queryFn: async () => {
			if (!userId) return [];
			const result = await fetchGoogleCalendarEvents({
				data: { userId },
			});
			return result as never[];
		},
	});

	const [syncDialogOpen, setSyncDialogOpen] = useState(false);
	const [recurringDialog, setRecurringDialog] = useState<{
		open: boolean;
		eventId: string;
		recurringEventId: string;
		newStart: string;
		newEnd: string | undefined;
		info: EventChangeArg | null;
	}>({
		open: false,
		eventId: "",
		recurringEventId: "",
		newStart: "",
		newEnd: undefined,
		info: null,
	});

	const triggerSyncMutation = useMutation({
		mutationFn: async () => {
			if (!userId) return null;
			return triggerFullSync({ data: { userId } });
		},
		onSuccess: () => {
			toast.success("Synced");
			queryClient.invalidateQueries({ queryKey: ["calendar-blocks"] });
			refetchGoogle();
		},
		onError: (err: Error) => {
			toast.error(`Sync issue: ${err.message}`);
		},
	});

	const updateGoogleMutation = useMutation({
		mutationFn: async ({
			googleEventId,
			start_time,
			end_time,
			title,
		}: {
			googleEventId: string;
			start_time: string;
			end_time: string | undefined;
			title: string;
		}) => {
			return updateGoogleCalendarEvent({
				data: {
					userId: userId ?? "",
					googleEventId,
					block: { title, start_time, end_time },
				},
			});
		},
	});

	// Merge local blocks and Google events
	const mergedEvents = [
		// Local blocks (tasks + manually created)
		...(calendarBlocks || []).map((block) => ({
			id: block.id,
			title: block.title,
			start: block.start_time,
			end: block.end_time,
			backgroundColor: block.task_id ? "#3a8fd4" : "#34d399",
			extendedProps: {
				source: block.task_id ? "task" : "local",
				taskId: block.task_id,
				googleEventId: block.google_event_id,
				is_synced: block.is_synced,
				block_type: block.block_type,
			},
		})),
		// Google events (from fetchGoogleCalendarEvents)
		...(calendarGoogleSyncEnabled ? googleEvents : []),
	];

	const handleDrop = async (info: DropArg) => {
		const taskId = info.draggedEl.getAttribute("data-task-id");
		const title = info.draggedEl.getAttribute("data-title") ?? "";
		const durationStr = info.draggedEl.getAttribute("data-duration") ?? "01:00";
		if (!taskId || !userId) return;

		if (!(info.date instanceof Date) || Number.isNaN(info.date.getTime())) {
			toast.error("Invalid drop time. Please drop on a valid time slot.");
			return;
		}

		const start_time = info.date.toISOString();
		const [dHours, dMins] = durationStr.split(":").map(Number);
		const endDate = new Date(info.date);
		endDate.setHours(endDate.getHours() + dHours, endDate.getMinutes() + dMins);
		const end_time = endDate.toISOString();

		const { data: newBlock } = await supabase
			.from("calendar_blocks")
			.insert({
				task_id: taskId,
				user_id: userId,
				start_time,
				end_time,
				title,
				block_type: "task",
			})
			.select()
			.single()
			.throwOnError();

		await supabase
			.from("tasks")
			.update({ status: "scheduled" })
			.eq("id", taskId)
			.eq("user_id", userId)
			.throwOnError();

		// If sync enabled, also push to Google
		if (calendarGoogleSyncEnabled) {
			try {
				await fetchGoogleCalendarEvents({
					data: { userId },
				});
			} catch {
				// Non-blocking
			}
		}

		queryClient.invalidateQueries({ queryKey: ["calendar-blocks"] });
		queryClient.invalidateQueries({ queryKey: ["tasks", userId] });
		setSidePanelBlockId(newBlock.id);
	};

	const handleEventChange = async (info: EventChangeArg) => {
		const { event } = info;
		const blockId = event.id;
		const start_time = event.start?.toISOString() ?? null;
		const end_time = event.end?.toISOString() ?? undefined;
		if (!blockId || !start_time || !userId) return;

		const source = event.extendedProps.source;
		const isSynced = event.extendedProps.is_synced;
		const googleEventId = event.extendedProps.googleEventId;
		const recurringEventId = event.extendedProps.recurringEventId;

		// Handle recurring Google event
		if (source === "google" && recurringEventId) {
			setRecurringDialog({
				open: true,
				eventId: blockId,
				recurringEventId,
				newStart: start_time,
				newEnd: end_time ?? "",
				info,
			});
			return;
		}

		// Save locally
		await supabase
			.from("calendar_blocks")
			.update({ start_time, end_time })
			.eq("id", blockId)
			.eq("user_id", userId)
			.throwOnError();

		// If synced to Google, update there too
		if (
			(source === "local" || source === "task") &&
			isSynced &&
			googleEventId
		) {
			try {
				await updateGoogleMutation.mutateAsync({
					googleEventId,
					start_time: event.start?.toISOString() ?? "",
					end_time,
					title: event.title,
				});
			} catch {
				toast("Saved. Google Calendar will update on next sync.");
			}
		}

		queryClient.invalidateQueries({ queryKey: ["calendar-blocks"] });
	};

	const handleEventResize = async (info: EventChangeArg) => {
		const { event } = info;
		const blockId = event.id;
		const end_time = event.end?.toISOString() ?? undefined;
		if (!blockId || !end_time || !userId) return;

		const source = event.extendedProps.source;
		const isSynced = event.extendedProps.is_synced;
		const googleEventId = event.extendedProps.googleEventId;
		const recurringEventId = event.extendedProps.recurringEventId;

		// Handle recurring Google event
		if (source === "google" && recurringEventId) {
			setRecurringDialog({
				open: true,
				eventId: blockId,
				recurringEventId,
				newStart: event.start?.toISOString() ?? "",
				newEnd: end_time,
				info,
			});
			return;
		}

		// Save locally
		await supabase
			.from("calendar_blocks")
			.update({ end_time })
			.eq("id", blockId)
			.eq("user_id", userId)
			.throwOnError();

		// If synced to Google, update there too
		if (
			(source === "local" || source === "task") &&
			isSynced &&
			googleEventId
		) {
			try {
				await updateGoogleMutation.mutateAsync({
					googleEventId,
					start_time: event.start?.toISOString() ?? "",
					end_time,
					title: event.title,
				});
			} catch {
				toast("Saved. Google Calendar will update on next sync.");
			}
		}

		queryClient.invalidateQueries({ queryKey: ["calendar-blocks"] });
	};

	const handleEventClick = (info: EventClickArg) => {
		setSidePanelBlockId(info.event.id);
	};

	const handleSyncToggle = () => {
		if (!calendarGoogleSyncEnabled) {
			setSyncDialogOpen(true);
		} else {
			triggerSyncMutation.mutate();
		}
	};

	const handleConnect = () => {
		setCalendarGoogleSyncEnabled(true);
		triggerSyncMutation.mutate();
	};

	const handleRecurringUpdate = async (_updateAll: boolean) => {
		const { eventId, newStart, newEnd, info } = recurringDialog;
		if (!info) return;

		try {
			// For Google recurring events, we need to use Google's API
			// This is handled by the server function
			await supabase
				.from("calendar_blocks")
				.update({
					start_time: newStart,
					end_time: newEnd,
				})
				.eq("id", eventId)
				.eq("user_id", userId)
				.throwOnError();

			queryClient.invalidateQueries({ queryKey: ["calendar-blocks"] });
			toast.success("Event updated");
		} catch (_error) {
			toast.error("Failed to update recurring event");
		}

		setRecurringDialog((prev) => ({ ...prev, open: false }));
	};

	// biome-ignore lint/suspicious/noExplicitAny: FullCalendar doesn't export a type for eventRemove
	const handleEventRemove = async (info: { event: any }) => {
		const { event } = info;
		const blockId = event.id;
		if (!blockId || !userId) return;

		try {
			// Delete the calendar block
			await supabase
				.from("calendar_blocks")
				.delete()
				.eq("id", blockId)
				.eq("user_id", userId)
				.throwOnError();

			// Update task status back to pending if it was a task
			if (event.extendedProps.task_id) {
				await supabase
					.from("tasks")
					.update({ status: "pending" })
					.eq("id", event.extendedProps.task_id)
					.eq("user_id", userId)
					.throwOnError();
			}

			queryClient.invalidateQueries({ queryKey: ["calendar-blocks"] });
			queryClient.invalidateQueries({ queryKey: ["tasks", userId] });
			toast.success("Event removed from calendar");
		} catch (_error) {
			toast.error("Failed to remove event");
		}
	};

	if (!userId) return null;

	return (
		<div className="flex flex-col h-full w-full overflow-hidden bg-background">
			{/* Sync toggle + view switcher row */}
			<div className="flex items-center justify-end gap-2 px-2 py-1 border-b border-border">
				<button
					type="button"
					onClick={handleSyncToggle}
					className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border border-border hover:bg-muted transition"
					style={{ minWidth: "44px", minHeight: "44px" }}
					title="Google Calendar sync"
				>
					<RefreshCw
						className={`w-4 h-4 ${triggerSyncMutation.isPending ? "animate-spin" : ""}`}
					/>
					<span className="text-xs text-muted-foreground">
						{calendarGoogleSyncEnabled ? "Synced" : "Sync"}
					</span>
				</button>
			</div>

			<FullCalendar
				ref={calendarRef}
				plugins={[timeGridPlugin, interactionPlugin, dayGridPlugin]}
				initialView="timeGridThreeDay"
				droppable={true}
				editable={true}
				nowIndicator={true}
				allDaySlot={true}
				allDayText="Anytime"
				slotMinTime="06:00:00"
				slotMaxTime="22:00:00"
				height="100%"
				contentHeight="100%"
				displayEventEnd={true}
				headerToolbar={{
					left: "prev,next today",
					center: "title",
					right: "timeGridDay,timeGridThreeDay,dayGridMonth",
				}}
				views={{
					timeGridThreeDay: {
						type: "timeGrid",
						duration: { days: 3 },
						buttonText: "3 day",
					},
				}}
				eventTimeFormat={{
					hour: "numeric",
					minute: "2-digit",
					hour12: true,
				}}
				events={mergedEvents}
				eventContent={(arg) => <EventItem info={arg} />}
				eventClick={handleEventClick}
				eventChange={handleEventChange}
				eventResize={handleEventResize}
				drop={handleDrop}
				eventRemove={handleEventRemove}
				dateClick={() => setSidePanelBlockId(null)}
			/>

			{sidePanelBlockId && (
				<EventSidePanel
					blockId={sidePanelBlockId}
					onClose={() => setSidePanelBlockId(null)}
					userId={userId ?? ""}
				/>
			)}

			<GoogleSyncDialog
				open={syncDialogOpen}
				onOpenChange={setSyncDialogOpen}
				onConnect={handleConnect}
			/>

			<RecurringEditDialog
				open={recurringDialog.open}
				onOpenChange={(open) =>
					setRecurringDialog((prev) => ({ ...prev, open }))
				}
				onJustThisTime={() => handleRecurringUpdate(false)}
				onAllTimes={() => handleRecurringUpdate(true)}
			/>
		</div>
	);
}
