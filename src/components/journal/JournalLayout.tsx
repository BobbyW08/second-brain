import { Outlet, useNavigate } from "@tanstack/react-router";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";
import { useJournalPages } from "@/queries/pages";

export function JournalLayout() {
	const { user } = useAuth();
	const { data: entries, isLoading } = useJournalPages(user?.id ?? "");
	const navigate = useNavigate();

	if (isLoading) {
		return (
			<div className="space-y-1 p-2 w-48">
				{[1, 2, 3].map((i) => (
					<Skeleton key={i} className="h-10 w-full rounded" />
				))}
			</div>
		);
	}

	return (
		<div className="flex h-full">
			{/* Entry list — left panel */}
			<aside className="w-56 border-r flex flex-col overflow-y-auto">
				<div className="px-3 py-2">
					<span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
						Journal
					</span>
				</div>
				{(entries ?? []).map((entry) => (
					<button
						type="button"
						key={entry.id}
						onClick={() =>
							navigate({ to: "/journal/$pageId", params: { pageId: entry.id } })
						}
						className="text-left px-3 py-2 text-sm hover:bg-accent truncate"
					>
						{entry.title}
					</button>
				))}
			</aside>

			{/* Editor area — right panel */}
			<main className="flex-1 overflow-y-auto">
				<Outlet />
			</main>
		</div>
	);
}
