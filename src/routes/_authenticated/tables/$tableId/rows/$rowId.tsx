import { createFileRoute } from "@tanstack/react-router";
import { RowDetailView } from "@/components/tables/RowDetailView";
import { useAuth } from "@/context/AuthContext";

export const Route = createFileRoute(
	"/_authenticated/tables/$tableId/rows/$rowId",
)({
	component: RowDetailRouteComponent,
});

function RowDetailRouteComponent() {
	const params = Route.useParams();
	const { user } = useAuth();

	if (!user) {
		// Handle unauthenticated access
		return (
			<div className="flex items-center justify-center h-64">
				<p className="text-red-500">Please sign in to view this page</p>
			</div>
		);
	}

	return <RowDetailView tableId={params.tableId} rowId={params.rowId} />;
}
