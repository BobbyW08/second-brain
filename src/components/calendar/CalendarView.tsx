import type {
	EventChangeArg,
	EventClickArg,
	EventContentArg,
} from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
import type { DropArg, EventResizeDoneArg } from "@fullcalendar/interaction";
import interactionPlugin from "@fullcalendar/interaction";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useCalendarBlocks } from "@/queries/calendarBlocks";
import { useUIStore } from "@/stores/useUIStore";
import { supabase } from "@/utils/supabase";
import { EventSidePanel } from "./EventSidePanel";
import "./styles/calendar.css";

const EventItem = ({ info }: { info: EventContentArg }) => {
	const { event } = info;
	const [left, right] = info.timeText.split(" - ");
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
	const { sidePanelBlockId, setSidePanelBlockId } = useUIStore();

	const calendarRef = useRef<FullCalendar | null>(null);
	const containerRef = useRef<HTMLDivElement | null>(null);
	const [isClient, setIsClient] = useState(false);

	useEffect(() => {
		setIsClient(true);
	}, []);

	// Force FullCalendar to recalculate dimensions after hydration
	useEffect(() => {
		if (!isClient) return;
		const timer = setTimeout(() => {
			const calendarApi = calendarRef.current?.getApi();
			if (calendarApi) {
				calendarApi.updateSize();
			}
		}, 300);
		return () => clearTimeout(timer);
	}, [isClient]);

	const today = new Date();
	const rangeStart = new Date(today);
	rangeStart.setDate(today.getDate() - 14);
	const rangeEnd = new Date(today);
	rangeEnd.setDate(today.getDate() + 14);

	const {
		data: calendarBlocks = [],
		isLoading: loadingBlocks,
		isError,
	} = useCalendarBlocks(userId ?? "", {
		start: rangeStart.toISOString(),
		end: rangeEnd.toISOString(),
	});

	const handleDrop = async (info: DropArg) => {
		const taskId = info.draggedEl.getAttribute("data-task-id");
		const title = info.draggedEl.getAttribute("data-title") ?? "";
		const durationStr = info.draggedEl.getAttribute("data-duration") ?? "01:00";
		if (!taskId || !userId) return;

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
		await supabase
			.from("calendar_blocks")
			.update({ start_time, end_time })
			.eq("id", blockId)
			.eq("user_id", userId)
			.throwOnError();
		queryClient.invalidateQueries({ queryKey: ["calendar-blocks"] });
	};

	const handleEventResize = async (info: EventResizeDoneArg) => {
		const { event } = info;
		const blockId = event.id;
		const end_time = event.end?.toISOString() ?? undefined;
		if (!blockId || !end_time || !userId) return;
		await supabase
			.from("calendar_blocks")
			.update({ end_time })
			.eq("id", blockId)
			.eq("user_id", userId)
			.throwOnError();
		queryClient.invalidateQueries({ queryKey: ["calendar-blocks"] });
	};

	const handleEventClick = (info: EventClickArg) => {
		setSidePanelBlockId(info.event.id);
	};

	if (!userId || (loadingBlocks && !isError)) {
		return (
			<div className="h-full p-2 flex flex-col gap-1">
				{/* Day header row */}
				<div className="flex gap-1 mb-2">
					<div className="w-12 shrink-0" />
					{[0, 1, 2].map((i) => (
						<Skeleton key={i} className="h-8 flex-1 bg-accent" />
					))}
				</div>
				{/* Hour rows — 10 rows representing ~10 visible hours */}
				{Array.from({ length: 10 }).map((_, rowIdx) => {
					const hour = 6 + rowIdx;
					return (
						<div key={`skeleton-hour-${hour}`} className="flex gap-1">
							<Skeleton className="h-12 w-12 shrink-0 bg-accent" />
							{[1, 2, 3].map((colId) => (
								<Skeleton
									key={`skeleton-col-${colId}`}
									className="h-12 flex-1 bg-accent opacity-40"
								/>
							))}
						</div>
					);
				})}
			</div>
		);
	}

	return (
		<div
			ref={containerRef}
			className="flex flex-col w-full overflow-auto bg-background"
		>
			{isClient && (
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
					events={(calendarBlocks ?? []).map((block) => {
						const source = block.task_id ? "task" : "google";
						return {
							id: block.id,
							title: block.title,
							start: block.start_time,
							end: block.end_time,
							backgroundColor: source === "task" ? "#3a8fd4" : "#3a8a3a",
							extendedProps: {
								source,
								taskId: block.task_id,
								googleEventId: block.google_event_id,
								block_type: block.block_type,
								is_synced: block.is_synced,
							},
						};
					})}
					eventContent={(arg) => <EventItem info={arg} />}
					eventClick={handleEventClick}
					eventChange={handleEventChange}
					eventResize={handleEventResize}
					drop={handleDrop}
					dateClick={() => setSidePanelBlockId(null)}
				/>
			)}

			{sidePanelBlockId && (
				<EventSidePanel
					blockId={sidePanelBlockId}
					onClose={() => setSidePanelBlockId(null)}
					userId={userId ?? ""}
				/>
			)}
		</div>
	);
}
