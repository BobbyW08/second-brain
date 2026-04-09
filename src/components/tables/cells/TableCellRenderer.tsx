import { useState } from "react";
import { CheckboxCell } from "@/components/tables/cells/CheckboxCell";
import { DateCell } from "@/components/tables/cells/DateCell";
import { NumberCell } from "@/components/tables/cells/NumberCell";
import { SelectCell } from "@/components/tables/cells/SelectCell";
import { TextCell } from "@/components/tables/cells/TextCell";
import { UrlCell } from "@/components/tables/cells/UrlCell";
import type { TableColumn } from "@/queries/tables";

interface TableCellRendererProps {
	column: TableColumn;
	value: unknown;
	onChange: (value: unknown) => void;
}

export const TableCellRenderer = ({
	column,
	value,
	onChange,
}: TableCellRendererProps) => {
	const [isEditing, setIsEditing] = useState(false);
	const [editValue, setEditValue] = useState(value);

	const handleSave = () => {
		onChange(editValue);
		setIsEditing(false);
	};

	const handleCancel = () => {
		setEditValue(value);
		setIsEditing(false);
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			handleSave();
		} else if (e.key === "Escape") {
			handleCancel();
		}
	};

	// If we're not editing, show the display version
	if (!isEditing) {
		return (
			<button
				type="button"
				className="cursor-pointer hover:bg-gray-100 p-2 rounded w-full text-left"
				onClick={() => setIsEditing(true)}
			>
				{renderDisplayValue(column.type, value)}
			</button>
		);
	}

	// If we're editing, show the appropriate editor
	return (
		<div className="p-2">
			{renderEditor(
				column,
				editValue,
				(newValue) => setEditValue(newValue),
				handleKeyDown,
			)}
		</div>
	);
};

const renderDisplayValue = (type: string, value: unknown) => {
	switch (type) {
		case "text":
		case "url":
			return value || "";
		case "checkbox":
			return value ? "✓" : "✗";
		case "select":
			return value || "";
		case "date":
			return value ? new Date(value).toLocaleDateString() : "";
		case "number":
			return value !== null && value !== undefined ? value.toString() : "";
		default:
			return value || "";
	}
};

const renderEditor = (
	column: TableColumn,
	value: unknown,
	onChange: (value: unknown) => void,
	onKeyDown: (e: React.KeyboardEvent) => void,
) => {
	switch (column.type) {
		case "text":
			return (
				<TextCell value={value} onChange={onChange} onKeyDown={onKeyDown} />
			);
		case "checkbox":
			return <CheckboxCell value={value} onChange={onChange} />;
		case "select":
			return (
				<SelectCell
					value={value}
					options={column.options || []}
					onChange={onChange}
				/>
			);
		case "date":
			return (
				<DateCell value={value} onChange={onChange} onKeyDown={onKeyDown} />
			);
		case "number":
			return (
				<NumberCell value={value} onChange={onChange} onKeyDown={onKeyDown} />
			);
		case "url":
			return (
				<UrlCell value={value} onChange={onChange} onKeyDown={onKeyDown} />
			);
		default:
			return (
				<TextCell value={value} onChange={onChange} onKeyDown={onKeyDown} />
			);
	}
};
