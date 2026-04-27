import type { EventDropArg } from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
import type { DropArg, EventResizeDoneArg } from "@fullcalendar/interaction";
import interactionPlugin from "@fullcalendar/interaction";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useCalendarBlocks } from "@/queries/calendarBlocks";
import { useCreatePage } from "@/queries/pages";
import { useUIStore } from "@/stores/useUIStore";
import { supabase } from "@/utils/supabase";
import { CalendarBlock } from "./CalendarBlock";
import { EventSidePanel } from "./EventSidePanel";
import "./styles/calendar.css";

export function CalendarView() {
	const { userId } = useCurrentUser();
	const queryClient = useQueryClient();
	const {
		sidePanelBlockId,
		setSidePanelBlockId,
		setActivePageId,
		setLeftPanelMode,
	} = useUIStore();

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

	const { mutateAsync: createPage } = useCreatePage();

	const isMobile = useIsMobile();

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

		// Create the calendar block
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

		// Update the task status to 'scheduled'
		await supabase
			.from("tasks")
			.update({ status: "scheduled" })
			.eq("id", taskId)
			.eq("user_id", userId)
			.throwOnError();

		queryClient.invalidateQueries({ queryKey: ["calendar-blocks"] });
		queryClient.invalidateQueries({ queryKey: ["tasks", userId] });

		// Open the side panel for the new block
		setSidePanelBlockId(newBlock.id);
	};

	const handleEventDrop = async (info: EventDropArg) => {
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

	const handleJournalClick = async (date: Date) => {
		if (!userId) return;

		const { data: journalFolder } = await supabase
			.from("folders")
			.select("id")
			.eq("user_id", userId)
			.eq("name", "Journal")
			.single()
			.throwOnError();

		if (!journalFolder) return;

		const dateTitle = date.toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
		});

		const { data: existingPage } = await supabase
			.from("pages")
			.select("id")
			.eq("user_id", userId)
			.eq("folder_id", journalFolder.id)
			.eq("title", dateTitle)
			.maybeSingle()
			.throwOnError();

		if (existingPage) {
			setActivePageId(existingPage.id);
			setLeftPanelMode("files");
			return;
		}

		const newPage = await createPage({
			user_id: userId,
			folder_id: journalFolder.id,
			title: dateTitle,
		});

		if (newPage) {
			setActivePageId(newPage.id);
			setLeftPanelMode("files");
			queryClient.invalidateQueries({ queryKey: ["pages", userId] });
		}
	};

	const getZoneBlockCount = (
		date: Date,
		startHour: number,
		endHour: number,
	) => {
		if (!calendarBlocks) return 0;
		return calendarBlocks.filter((block) => {
			const blockDate = new Date(block.start_time);
			const blockHour = blockDate.getHours();
			const sameDay =
				blockDate.getFullYear() === date.getFullYear() &&
				blockDate.getMonth() === date.getMonth() &&
				blockDate.getDate() === date.getDate();
			return sameDay && blockHour >= startHour && blockHour < endHour;
		}).length;
	};

	if (loadingBlocks) {
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

	const initialView = isMobile ? "timeGridDay" : "timeGridThreeDay";

	return (
		<div className="flex-1 min-h-0 h-full overflow-hidden">
			<FullCalendar
				plugins={[timeGridPlugin, interactionPlugin, dayGridPlugin]}
				initialView={initialView}
				droppable={true}
				editable={true}
				views={{
					timeGridThreeDay: {
						type: "timeGrid",
						duration: { days: 3 },
						buttonText: "3 day",
					},
				}}
				nowIndicator={true}
				allDaySlot={true}
				allDayText="Anytime"
				slotMinTime="06:00:00"
				slotMaxTime="22:00:00"
				slotLaneContent={(arg) => {
					if (!arg.time || !arg.date) return null;

					const ms = arg.time.milliseconds;
					const NOON = 12 * 60 * 60 * 1000;
					const EVENING = 18 * 60 * 60 * 1000;

					const isMorningStart = ms === 6 * 60 * 60 * 1000;
					const isAfternoonStart = ms === NOON;
					const isEveningStart = ms === EVENING;

					if (isMorningStart) {
						const count = getZoneBlockCount(arg.date, 6, 12);
						return (
							<div className="zone-label zone-label--morning">
								☀ Morning {count > 0 && `(${count})`}
							</div>
						);
					}
					if (isAfternoonStart) {
						const count = getZoneBlockCount(arg.date, 12, 18);
						return (
							<div className="zone-label zone-label--afternoon">
								◑ Afternoon {count > 0 && `(${count})`}
							</div>
						);
					}
					if (isEveningStart) {
						const count = getZoneBlockCount(arg.date, 18, 22);
						return (
							<div className="zone-label zone-label--evening">
								☽ Evening {count > 0 && `(${count})`}
							</div>
						);
					}
					return null;
				}}
				headerToolbar={{
					left: "prev,next today",
					center: "title",
					right: "timeGridDay,timeGridThreeDay,dayGridMonth",
				}}
				height="100%"
				selectable={true}
				selectMirror={true}
				select={async (info) => {
					if (!userId) return;
					const start_time = info.start.toISOString();
					const end_time = info.end.toISOString();

					const { data: newTask } = await supabase
						.from("tasks")
						.insert({
							user_id: userId,
							title: "New task",
							status: "active",
							color: "#666672",
							priority: "unsorted",
							block_size: "M",
						})
						.select()
						.single()
						.throwOnError();

					const { data: newBlock } = await supabase
						.from("calendar_blocks")
						.insert({
							task_id: newTask.id,
							user_id: userId,
							start_time,
							end_time,
							title: "New task",
							block_type: "task",
						})
						.select()
						.single()
						.throwOnError();

					queryClient.invalidateQueries({ queryKey: ["calendar-blocks"] });
					queryClient.invalidateQueries({ queryKey: ["tasks", userId] });

					setSidePanelBlockId(newBlock.id);
				}}
				dateClick={() => setSidePanelBlockId(null)}
				dayHeaderContent={(arg) => (
					<div
						style={{
							display: "flex",
							alignItems: "center",
							gap: 6,
							justifyContent: "space-between",
							width: "100%",
							padding: "0 4px",
						}}
					>
						<span>{arg.text}</span>
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								if (arg.date) handleJournalClick(arg.date);
							}}
							style={{
								fontSize: 10,
								color: "hsl(var(--muted-foreground))",
								background: "none",
								border: "1px solid hsl(var(--border))",
								borderRadius: 4,
								padding: "1px 5px",
								cursor: "pointer",
								lineHeight: "1.4",
							}}
						>
							+ Journal
						</button>
					</div>
				)}
				drop={handleDrop}
				eventDrop={handleEventDrop}
				eventResize={handleEventResize}
				eventClick={(info) => setSidePanelBlockId(info.event.id)}
				events={(calendarBlocks ?? []).map((block) => {
					const source = block.task_id ? "task" : "google";
					return {
						id: block.id,
						title: block.title,
						start: block.start_time,
						end: block.end_time,
						extendedProps: {
							source,
							taskId: block.task_id,
							googleEventId: block.google_event_id,
							block_type: block.block_type,
							is_synced: block.is_synced,
						},
					};
				})}
				eventContent={(arg) => (
					<CalendarBlock
						event={arg.event}
						timeText={arg.timeText}
						isMirror={arg.isMirror}
					/>
				)}
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
