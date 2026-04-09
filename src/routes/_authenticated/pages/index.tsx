import { createFileRoute } from "@tanstack/react-router";
import { FileText } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";

export const Route = createFileRoute("/_authenticated/pages/")({
	head: () => ({
		meta: [{ title: "Pages | Second Brain" }],
	}),
	component: PagesIndex,
});

export default function PagesIndex() {
	return (
		<EmptyState
			icon={FileText}
			title="Select a page"
			description="Choose a page from the sidebar or create one."
		/>
	);
}
