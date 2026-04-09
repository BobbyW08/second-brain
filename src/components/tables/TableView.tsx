import { useNavigate } from "@tanstack/react-router";
import { ChevronRight, Loader2, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { TableCellRenderer } from "@/components/tables/cells/TableCellRenderer";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";
import { useCreateRow, useUpdateRow } from "@/queries/tableRows";
import type { TableColumn } from "@/queries/tables";
import { useTableRows, useTableSchema } from "@/queries/tables";

interface TableViewProps {
	tableId: string;
}

export const TableView = ({ tableId }: TableViewProps) => {
	const {
		data: schema,
		isLoading: schemaLoading,
		error: schemaError,
	} = useTableSchema(tableId);
	const {
		data: rows,
		isLoading: rowsLoading,
		error: rowsError,
		refetch,
	} = useTableRows(tableId);
	const createRowMutation = useCreateRow(tableId);
	const updateRowMutation = useUpdateRow(tableId);
	const { user } = useAuth();
	const navigate = useNavigate();

	const [isCreatingRow, setIsCreatingRow] = useState(false);

	// Derive columns from schema — must be before any early returns (Rules of Hooks)
	const columns = useMemo<TableColumn[]>(() => {
		const columnsArray = schema?.columns ?? [];
		if (Array.isArray(columnsArray)) return columnsArray as TableColumn[];
		if (typeof columnsArray === "string") {
			try {
				return JSON.parse(columnsArray) as TableColumn[];
			} catch {
				return [];
			}
		}
		return [];
	}, [schema?.columns]);

	// Handle loading and error states
	if (schemaLoading || rowsLoading) {
		return (
			<div className="p-4 space-y-2">
				<Skeleton className="h-8 w-full" />
				{[1, 2, 3, 4].map((i) => (
					<Skeleton key={i} className="h-10 w-full" />
				))}
			</div>
		);
	}

	if (schemaError || rowsError) {
		return (
			<div className="p-4">
				<h2 className="text-xl font-semibold text-red-600">
					Error loading table data
				</h2>
				<p className="text-red-500">
					{schemaError?.message || rowsError?.message || "Unknown error"}
				</p>
			</div>
		);
	}

	if (!schema || !rows) {
		return (
			<div className="p-4">
				<h2 className="text-xl font-semibold">No data available</h2>
			</div>
		);
	}

	// Handle adding a new row
	const handleAddRow = async () => {
		if (!user) return;

		setIsCreatingRow(true);
		try {
			await createRowMutation.mutateAsync({
				user_id: user.id,
				data: {},
			});
			// Refetch to get the new row
			await refetch();
		} catch (error) {
			console.error("Error creating row:", error);
		} finally {
			setIsCreatingRow(false);
		}
	};

	return (
		<div className="p-4">
			<div className="flex justify-between items-center mb-4">
				<h1 className="text-2xl font-bold">Table View</h1>
				<Button onClick={handleAddRow} disabled={isCreatingRow || !user}>
					{isCreatingRow ? (
						<>
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							Adding...
						</>
					) : (
						<>
							<Plus className="mr-2 h-4 w-4" />
							Add Row
						</>
					)}
				</Button>
			</div>

			<div className="overflow-x-auto">
				<table className="min-w-full border">
					<thead>
						<tr className="border-b">
							<th className="w-10 p-2 border-r" />
							{columns.map((column) => (
								<th key={column.name} className="p-2 text-left border-r">
									{column.name}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{rows?.map((row) => (
							<tr key={row.id} className="border-b">
								<td className="w-10 p-2 border-r">
									<button
										type="button"
										className="p-1 rounded hover:bg-accent"
										onClick={() =>
											navigate({
												to: "/tables/$tableId/rows/$rowId",
												params: { tableId, rowId: row.id },
											})
										}
										aria-label="Open row detail"
									>
										<ChevronRight className="h-4 w-4 text-muted-foreground" />
									</button>
								</td>
								{columns.map((column) => (
									<td key={`${row.id}-${column.name}`} className="p-2 border-r">
										<TableCellRenderer
											column={column}
											value={
												(row.data as Record<string, unknown>)?.[column.name]
											}
											onChange={(newValue) => {
												updateRowMutation.mutate({
													rowId: row.id,
													data: {
														...(row.data as Record<string, unknown>),
														[column.name]: newValue,
													},
												});
											}}
										/>
									</td>
								))}
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
};
