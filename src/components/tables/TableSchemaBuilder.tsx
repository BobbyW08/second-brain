import { MoveDown, MoveUp, Plus, Save, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { TableColumn, TableColumnType } from "@/queries/tables";
import { useUpdateTable } from "@/queries/tables";
import { SelectOptionsEditor } from "./SelectOptionsEditor";

interface TableSchemaBuilderProps {
	tableId: string;
	userId: string;
	initialColumns: TableColumn[];
}

export function TableSchemaBuilder({
	tableId,
	userId,
	initialColumns,
}: TableSchemaBuilderProps) {
	const [columns, setColumns] = useState<TableColumn[]>(initialColumns || []);

	const { mutate: saveSchema, isPending } = useUpdateTable(userId);

	const addColumn = () => {
		const newColumn: TableColumn = {
			id: `col-${Date.now()}`,
			name: "New Column",
			type: "text",
		};
		setColumns([...columns, newColumn]);
	};

	const updateColumn = (id: string, updates: Partial<TableColumn>) => {
		setColumns(
			columns.map((col) => (col.id === id ? { ...col, ...updates } : col)),
		);
	};

	const deleteColumn = (id: string) => {
		setColumns(columns.filter((col) => col.id !== id));
	};

	const moveColumn = (id: string, direction: "up" | "down") => {
		const index = columns.findIndex((col) => col.id === id);
		if (index === -1) return;

		const newColumns = [...columns];
		if (direction === "up" && index > 0) {
			[newColumns[index - 1], newColumns[index]] = [
				newColumns[index],
				newColumns[index - 1],
			];
		} else if (direction === "down" && index < newColumns.length - 1) {
			[newColumns[index], newColumns[index + 1]] = [
				newColumns[index + 1],
				newColumns[index],
			];
		}
		setColumns(newColumns);
	};

	const saveChanges = () => {
		saveSchema({ tableId, updates: { columns } });
	};

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<h2 className="text-xl font-semibold">Column Configuration</h2>
				<Button
					onClick={saveChanges}
					disabled={isPending}
					className="flex items-center gap-2"
				>
					<Save className="h-4 w-4" />
					{isPending ? "Saving…" : "Save Changes"}
				</Button>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Columns</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						{columns.length === 0 ? (
							<p className="text-muted-foreground text-center py-4">
								No columns configured
							</p>
						) : (
							columns.map((column, index) => (
								<ColumnEditorRow
									key={column.id}
									column={column}
									index={index}
									totalColumns={columns.length}
									onUpdate={updateColumn}
									onDelete={deleteColumn}
									onMove={moveColumn}
								/>
							))
						)}
					</div>

					<Button onClick={addColumn} className="mt-4 flex items-center gap-2">
						<Plus className="h-4 w-4" />
						Add Column
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}

interface ColumnEditorRowProps {
	column: TableColumn;
	index: number;
	totalColumns: number;
	onUpdate: (id: string, updates: Partial<TableColumn>) => void;
	onDelete: (id: string) => void;
	onMove: (id: string, direction: "up" | "down") => void;
}

function ColumnEditorRow({
	column,
	index,
	totalColumns,
	onUpdate,
	onDelete,
	onMove,
}: ColumnEditorRowProps) {
	const [isEditingName, setIsEditingName] = useState(false);
	const [newName, setNewName] = useState(column.name);

	const handleNameSave = () => {
		onUpdate(column.id, { name: newName });
		setIsEditingName(false);
	};

	const handleTypeChange = (newType: TableColumnType) => {
		// If changing from select to another type, remove options
		if (column.type === "select" && newType !== "select") {
			onUpdate(column.id, { type: newType, options: undefined });
		} else {
			onUpdate(column.id, { type: newType });
		}
	};

	return (
		<div className="border rounded-lg p-4 space-y-3">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					{isEditingName ? (
						<div className="flex items-center gap-2">
							<Input
								value={newName}
								onChange={(e) => setNewName(e.target.value)}
								onBlur={handleNameSave}
								onKeyDown={(e) => {
									if (e.key === "Enter") handleNameSave();
									if (e.key === "Escape") setIsEditingName(false);
								}}
								autoFocus
								className="w-40"
							/>
						</div>
					) : (
						<Button
							variant="ghost"
							className="text-left font-medium"
							onClick={() => setIsEditingName(true)}
						>
							{column.name}
						</Button>
					)}
				</div>

				<div className="flex items-center gap-2">
					<Button
						variant="ghost"
						size="sm"
						onClick={() => onMove(column.id, "up")}
						disabled={index === 0}
						aria-label="Move up"
					>
						<MoveUp className="h-4 w-4" />
					</Button>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => onMove(column.id, "down")}
						disabled={index === totalColumns - 1}
						aria-label="Move down"
					>
						<MoveDown className="h-4 w-4" />
					</Button>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => onDelete(column.id)}
						aria-label="Delete column"
					>
						<Trash2 className="h-4 w-4" />
					</Button>
				</div>
			</div>

			<div className="flex items-center gap-4">
				<div className="flex-1">
					<span className="text-sm font-medium text-muted-foreground">
						Column Type
					</span>
					<Select value={column.type} onValueChange={handleTypeChange}>
						<SelectTrigger className="w-32">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="text">Text</SelectItem>
							<SelectItem value="checkbox">Checkbox</SelectItem>
							<SelectItem value="select">Select</SelectItem>
							<SelectItem value="date">Date</SelectItem>
							<SelectItem value="number">Number</SelectItem>
							<SelectItem value="url">URL</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</div>

			{column.type === "select" && (
				<div className="mt-2">
					<span className="text-sm font-medium text-muted-foreground">
						Options
					</span>
					<SelectOptionsEditor
						columnId={column.id}
						options={column.options || []}
						onUpdate={onUpdate}
					/>
				</div>
			)}
		</div>
	);
}
