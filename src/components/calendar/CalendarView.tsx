import type {
	EventChangeArg,
	EventClickArg,
	EventContentArg,
} from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import { useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
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
		<div className="overflow-hidden w-full">
			<div className="flex flex-col space-y-0 text-xs">
				<p className="font-semibold w-full line-clamp-1">{event.title}</p>
				<p className="text-muted-foreground line-clamp-1">{`${left} - ${right}`}</p>
			</div>
		</div>
	);
};

export function CalendarView() {
	const { userId } = useCurrentUser();
	const queryClient = useQueryClient();
	const { sidePanelBlockId, setSidePanelBlockId } = useUIStore();

	const calendarRef = useRef<FullCalendar | null>(null);

	const today = new Date();
	const rangeStart = new Date(today);
	rangeStart.setDate(today.getDate() - 14);
	const rangeEnd = new Date(today);
	rangeEnd.setDate(today.getDate() + 14);

	const { data: calendarBlocks = [], isLoading: loadingBlocks } =
		useCalendarBlocks({
			start: rangeStart.toISOString(),
			end: rangeEnd.toISOString(),
		});

	const handleEventClick = (info: EventClickArg) => {
		setSidePanelBlockId(info.event.id);
	};

	const handleEventChange = async (info: EventChangeArg) => {
		const blockId = info.event.id;
		const start_time = info.event.start?.toISOString() ?? null;
		const end_time = info.event.end?.toISOString() ?? undefined;

		if (!blockId || !start_time || !userId) return;

		await supabase
			.from("calendar_blocks")
			.update({ start_time, end_time })
			.eq("id", blockId)
			.eq("user_id", userId)
			.throwOnError();

		queryClient.invalidateQueries({ queryKey: ["calendar-blocks"] });
	};

	if (loadingBlocks) {
		return (
			<div className="h-full p-2 flex flex-col gap-1">
				{[0, 1, 2].map((i) => (
					<Skeleton key={i} className="h-8 flex-1 bg-accent" />
				))}
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
		<div className="flex-1 min-h-0 h-full overflow-hidden bg-background">
			<FullCalendar
				ref={calendarRef}
				plugins={[timeGridPlugin, interactionPlugin, dayGridPlugin]}
				initialView="timeGridThreeDay"
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
				droppable={true}
				editable={true}
				nowIndicator={true}
				allDaySlot={true}
				allDayText="Anytime"
				slotMinTime="06:00:00"
				slotMaxTime="22:00:00"
				height="100%"
				selectable={true}
				selectMirror={true}
				contentHeight="auto"
				displayEventEnd={true}
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
				select={() => setSidePanelBlockId(null)}
				dateClick={() => setSidePanelBlockId(null)}
			/>

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
