import { createFileRoute } from "@tanstack/react-router";
import { NotFound } from "@/components/layout/NotFound";
import { TableSchemaBuilder } from "@/components/tables/TableSchemaBuilder";
import { useAuth } from "@/context/AuthContext";
import { useTableSchema } from "@/queries/tables";

export const Route = createFileRoute(
	"/_authenticated/tables/$tableId/settings",
)({
	component: TableSchemaSettings,
});

function TableSchemaSettings() {
	const { tableId } = Route.useParams();
	const { user } = useAuth();
	const userId = user?.id ?? "";
	const { data: tableSchema, isLoading, isError } = useTableSchema(tableId);

	if (isLoading) {
		return <div className="p-4">Loading table schema...</div>;
	}

	if (isError || !tableSchema) {
		return <NotFound message="Table not found" />;
	}

	return (
		<div className="p-6 max-w-4xl mx-auto">
			<div className="mb-6">
				<h1 className="text-2xl font-bold">Table Settings</h1>
				<p className="text-muted-foreground">
					Configure the schema for "{tableSchema.name}"
				</p>
			</div>

			<TableSchemaBuilder
				tableId={tableId}
				userId={userId}
				initialColumns={
					(tableSchema.columns as unknown as import("@/queries/tables").TableColumn[]) ??
					[]
				}
			/>
		</div>
	);
}
