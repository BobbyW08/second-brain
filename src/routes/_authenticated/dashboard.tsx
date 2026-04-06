import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/dashboard")({
	head: () => ({
		meta: [{ title: "Second Brain" }, { name: "robots", content: "noindex" }],
	}),
	component: DashboardPage,
});

function DashboardPage() {
	return (
		<div className="min-h-screen bg-background p-6">
			<p className="text-muted-foreground">Dashboard — coming in Phase 1-B</p>
		</div>
	);
}
