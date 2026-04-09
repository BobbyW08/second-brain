import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Table } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useCreateTable, useTables } from "@/queries/tables";

export const Route = createFileRoute("/_authenticated/tables/")({
	head: () => ({
		meta: [{ title: "Tables | Second Brain" }],
	}),
	component: TablesIndex,
});

export default function TablesIndex() {
	const { userId } = useCurrentUser();
	const { data: tables } = useTables(userId);
	const createTable = useCreateTable(userId);
	const navigate = useNavigate();

	const handleCreateTable = () => {
		createTable.mutate(
			{
				name: "Untitled Table",
			},
			{
				onSuccess: (newTable) => {
					navigate({
						to: "/tables/$tableId/settings",
						params: { tableId: newTable.id },
					});
				},
			},
		);
	};

	if (!tables || tables.length === 0) {
		return (
			<EmptyState
				icon={Table}
				title="No tables yet"
				description="Create your first table to get started with organizing your data."
				action={
					<button
						type="button"
						onClick={handleCreateTable}
						className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
					>
						Create Table
					</button>
				}
			/>
		);
	}

	return (
		<div className="p-6 max-w-3xl mx-auto">
			<div className="flex justify-between items-center mb-6">
				<h1 className="text-2xl font-bold">Tables</h1>
				<button
					type="button"
					onClick={handleCreateTable}
					className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
				>
					New Table
				</button>
			</div>
			<div className="space-y-2">
				{tables.map((table) => (
					<button
						key={table.id}
						type="button"
						className="w-full text-left p-4 rounded-lg border hover:bg-accent transition-colors flex items-center gap-3"
						onClick={() =>
							navigate({
								to: "/tables/$tableId",
								params: { tableId: table.id },
							})
						}
					>
						<Table className="h-5 w-5 text-muted-foreground" />
						<span className="font-medium">{table.name}</span>
					</button>
				))}
			</div>
		</div>
	);
}
