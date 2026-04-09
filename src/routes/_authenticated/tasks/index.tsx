import { createFileRoute } from "@tanstack/react-router";
import { PriorityBucket } from "@/components/tasks/PriorityBucket";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export const Route = createFileRoute("/_authenticated/tasks/")({
	head: () => ({
		meta: [{ title: "Priorities | Second Brain" }],
	}),
	component: TasksPage,
});

function TasksPage() {
	const { userId } = useCurrentUser();
	if (!userId) return null;

	return (
		<div className="p-4 max-w-2xl mx-auto">
			<h1 className="text-2xl font-bold mb-6">Priorities</h1>
			<PriorityBucket userId={userId} />
		</div>
	);
}
