import dayGridPlugin from "@fullcalendar/daygrid";
import listPlugin from "@fullcalendar/list";
import FullCalendar from "@fullcalendar/react";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCalendarBlocks } from "@/queries/calendarBlocks";
import { useUIStore } from "@/stores/useUIStore";

export function MiniCalendarDrawer() {
	const { miniCalendarOpen, setMiniCalendarOpen, leftPanelMode } = useUIStore();

	// Calculate range for mini calendar (roughly 14 days back/forward for agenda)
	const today = new Date();
	const rangeStart = new Date(today);
	rangeStart.setDate(today.getDate() - 14);
	const rangeEnd = new Date(today);
	rangeEnd.setDate(today.getDate() + 14);

	const { data: calendarBlocks = [] } = useCalendarBlocks({
		start: rangeStart.toISOString(),
		end: rangeEnd.toISOString(),
	});

	const events = (calendarBlocks ?? []).map((block) => ({
		id: block.id,
		title: block.title,
		start: block.start_time,
		end: block.end_time,
	}));

	if (leftPanelMode !== "files") return null;

	return (
		<>
			{/* Pull Tab */}
			<button
				type="button"
				onClick={() => setMiniCalendarOpen(!miniCalendarOpen)}
				className="fixed right-0 top-1/2 -translate-y-1/2 w-9 h-20 bg-[hsl(var(--secondary))] border-l border-border rounded-l-xl cursor-pointer flex items-center justify-center z-30 transition-colors hover:bg-accent"
			>
				<CalendarIcon className="h-4 w-4 text-muted-foreground" />
			</button>

			{/* Drawer */}
			<div
				className={cn(
					"fixed right-9 top-0 h-screen w-[280px] bg-[hsl(var(--secondary))] border-l border-border z-20 flex flex-col gap-8 p-4 overflow-y-auto transform transition-transform duration-200 ease-in-out shadow-[-8px_0_24px_rgba(0,0,0,0.3)]",
					miniCalendarOpen ? "translate-x-0" : "translate-x-full",
				)}
			>
				<div className="flex flex-col gap-8 pt-4">
					{/* Month View */}
					<div className="mini-calendar-wrapper">
						<FullCalendar
							plugins={[dayGridPlugin]}
							initialView="dayGridMonth"
							headerToolbar={{
								left: "prev",
								center: "title",
								right: "next",
							}}
							height="auto"
							events={events}
							fixedWeekCount={false}
							showNonCurrentDates={false}
						/>
					</div>

					{/* Agenda List View */}
					<div className="flex flex-col gap-2">
						<h3 className="text-[10px] font-medium uppercase tracking-[0.06em] text-muted-foreground px-1">
							Upcoming
						</h3>
						<FullCalendar
							plugins={[listPlugin]}
							initialView="listWeek"
							duration={{ days: 14 }}
							headerToolbar={false}
							height="auto"
							events={events}
						/>
					</div>
				</div>

				<style>{`
					.mini-calendar-wrapper .fc {
						font-size: 11px;
					}
					.mini-calendar-wrapper .fc-toolbar-title {
						font-size: 13px !important;
						font-weight: 500;
					}
					.mini-calendar-wrapper .fc-button {
						padding: 2px 4px !important;
					}
                    .fc-list-day-cushion {
                        background: hsl(var(--accent)) !important;
                        padding: 4px 8px !important;
                    }
                    .fc-list-event {
                        cursor: default !important;
                    }
                    .fc-list-event:hover td {
                        background: transparent !important;
                    }
                    .fc-list-event-title {
                        font-size: 12px;
                    }
				`}</style>
			</div>
		</>
	);
}
