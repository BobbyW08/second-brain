import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/tasks/")({
	head: () => ({
		meta: [{ title: "Tasks | Second Brain" }],
	}),
	component: TasksPage,
});

function TasksPage() {
	return (
		<div className="flex flex-1 items-center justify-center text-muted-foreground">
			<p>Select a task to get started, or drag one to the calendar.</p>
			{/* TODO: Phase 3 — calendar view replaces this as the main content */}
		</div>
	);
}

// Rename the file to -index.tsx to exclude it from routes
// This is a stub route that should not be included in the route tree
