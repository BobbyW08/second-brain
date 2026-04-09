import { createFileRoute } from "@tanstack/react-router";
import { JournalView } from "@/components/journal/JournalView";

export const Route = createFileRoute("/_authenticated/journal/")({
	component: JournalView,
});
