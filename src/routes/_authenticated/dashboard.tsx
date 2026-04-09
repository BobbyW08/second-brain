import { createFileRoute } from "@tanstack/react-router";
import { CalendarView } from "@/components/calendar/CalendarView";

export const Route = createFileRoute("/_authenticated/dashboard")({
	head: () => ({
		meta: [{ title: "Dashboard | Second Brain" }],
	}),
	component: Dashboard,
});

export default function Dashboard() {
	return <CalendarView />;
}
