import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useUpdateRow } from "@/queries/tableRows";
import {
	type TableColumn,
	useTableRows,
	useTableSchema,
} from "@/queries/tables";
import "@blocknote/mantine/style.css";
import { ArrowLeft, Loader2 } from "lucide-react";
import { editorSchema } from "@/components/editor/linkChipSpec";
import { TableCellRenderer } from "@/components/tables/cells/TableCellRenderer";
import { Button } from "@/components/ui/button";
import { useAutosave } from "@/hooks/useAutosave";
import type { Database } from "@/types/database.types";

type TableRow = Database["public"]["Tables"]["table_rows"]["Row"];

interface RowDetailViewProps {
	tableId: string;
	rowId: string;
}

export function RowDetailView({ tableId, rowId }: RowDetailViewProps) {
	const { theme } = useTheme();
	const { user } = useAuth();
	const {
		data: schema,
		isLoading: schemaLoading,
		error: schemaError,
	} = useTableSchema(tableId);
	const {
		data: rows,
		isLoading: rowsLoading,
		error: rowsError,
	} = useTableRows(tableId);
	const updateRowMutation = useUpdateRow(tableId);
	const [currentRow, setCurrentRow] = useState<TableRow | null>(null);
	const [columns, setColumns] = useState<TableColumn[]>([]);

	// Initialize BlockNote editor for notes (always call hooks unconditionally)
	const editor = useCreateBlockNote({
		initialContent: undefined,
		schema: editorSchema,
	});

	// Autosave notes — must be called before any early returns
	const { save: saveNotes, isSaving: isSavingNotes } = useAutosave(
		(content: unknown) => {
			if (user) {
				updateRowMutation.mutate({
					rowId: currentRow?.id ?? "",
					notes: content as Record<string, unknown>,
				});
			}
		},
		800,
	);

	// Create columns based on schema
	useEffect(() => {
		if (schema) {
			const columnsArray = schema.columns || [];

			let parsedColumns: TableColumn[] = [];
			if (Array.isArray(columnsArray)) {
				parsedColumns = columnsArray as unknown as TableColumn[];
			} else if (typeof columnsArray === "string") {
				try {
					parsedColumns = JSON.parse(columnsArray) as TableColumn[];
				} catch (e) {
					console.error("Failed to parse columns JSON:", e);
					parsedColumns = [];
				}
			}

			setColumns(parsedColumns);
		}
	}, [schema]);

	// Find the specific row by ID
	useEffect(() => {
		if (rows && rows.length > 0) {
			const foundRow = rows.find((row) => row.id === rowId);
			if (foundRow) {
				setCurrentRow(foundRow);
			}
		}
	}, [rows, rowId]);

	// Handle loading and error states
	if (schemaLoading || rowsLoading) {
		return (
			<div className="flex items-center justify-center h-64">
				<Loader2 className="h-8 w-8 animate-spin" />
			</div>
		);
	}

	if (schemaError || rowsError) {
		return (
			<div className="p-4">
				<h2 className="text-xl font-semibold text-red-600">
					Error loading data
				</h2>
				<p className="text-red-500">
					{schemaError?.message || rowsError?.message || "Unknown error"}
				</p>
			</div>
		);
	}

	if (!schema || !currentRow) {
		return (
			<div className="p-4">
				<h2 className="text-xl font-semibold">Row not found</h2>
				<p className="text-muted-foreground">
					The requested row could not be found.
				</p>
			</div>
		);
	}

	const handleFieldUpdate = (columnName: string, newValue: unknown) => {
		if (!user) return;

		const newData = {
			...(currentRow.data as Record<string, unknown>),
			[columnName]: newValue,
		};

		updateRowMutation.mutate({
			rowId: currentRow.id,
			data: newData,
		});
	};

	const handleBackToTable = () => {
		window.history.back();
	};

	return (
		<div className="p-6 max-w-4xl mx-auto">
			{/* Breadcrumb navigation */}
			<div className="mb-6">
				<Button
					variant="ghost"
					onClick={handleBackToTable}
					className="flex items-center gap-2"
				>
					<ArrowLeft className="h-4 w-4" />
					Back to table
				</Button>
			</div>

			<div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
				<h1 className="text-2xl font-bold mb-6">Row Details</h1>

				{/* Fields in vertical form layout */}
				<div className="space-y-4 mb-8">
					{columns.map((column) => (
						<div key={column.name} className="border-b pb-4">
							<span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
								{column.name}
							</span>
							<div className="p-2">
								<TableCellRenderer
									column={column}
									value={
										(currentRow.data as Record<string, unknown>)?.[column.name]
									}
									onChange={(newValue) =>
										handleFieldUpdate(column.name, newValue)
									}
								/>
							</div>
						</div>
					))}
				</div>

				{/* Row Notes Section */}
				<div>
					<h2 className="text-xl font-semibold mb-4">Notes</h2>

					{/* Saving indicator for notes */}
					<div className="flex justify-end mb-2 h-5">
						{isSavingNotes && (
							<span className="flex items-center gap-1 text-xs text-muted-foreground">
								<Loader2 className="h-3 w-3 animate-spin" />
								Saving...
							</span>
						)}
					</div>

					{/* BlockNote editor for notes */}
					<BlockNoteView
						editor={editor}
						onChange={() => saveNotes(editor.document)}
						theme={theme === "dark" ? "dark" : "light"}
						slashMenu={true}
					/>
				</div>
			</div>
		</div>
	);
}
