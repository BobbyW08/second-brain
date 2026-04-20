import { createFileRoute } from "@tanstack/react-router";
import { CalendarView } from "../../components/calendar/CalendarView";
import { requireAuth } from "../../utils/auth";

export const Route = createFileRoute("/_authenticated/dashboard")({
	beforeLoad: () => requireAuth(),
	component: DashboardPage,
});

function DashboardPage() {
	return (
		<div className="flex h-full w-full">
			<div className="flex-1 min-w-0">
				<CalendarView />
			</div>
		</div>
	);
}
