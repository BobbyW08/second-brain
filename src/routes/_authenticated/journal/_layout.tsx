import { createFileRoute } from "@tanstack/react-router";
import { JournalLayout } from "@/components/journal/JournalLayout";

export const Route = createFileRoute("/_authenticated/journal/_layout")({
	component: JournalLayout,
});
