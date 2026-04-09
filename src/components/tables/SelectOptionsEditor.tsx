import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { TableColumn } from "@/queries/tables";

interface SelectOptionsEditorProps {
	columnId: string;
	options: string[];
	onUpdate: (id: string, updates: Partial<TableColumn>) => void;
}

export function SelectOptionsEditor({
	columnId,
	options,
	onUpdate,
}: SelectOptionsEditorProps) {
	const [newOption, setNewOption] = useState("");
	const [editingOptionIndex, setEditingOptionIndex] = useState<number | null>(
		null,
	);
	const [editingValue, setEditingValue] = useState("");

	const handleAddOption = () => {
		if (newOption.trim() && !options.includes(newOption.trim())) {
			const newOptions = [...options, newOption.trim()];
			onUpdate(columnId, { options: newOptions });
			setNewOption("");
		}
	};

	const handleDeleteOption = (index: number) => {
		const newOptions = [...options];
		newOptions.splice(index, 1);
		onUpdate(columnId, { options: newOptions });
	};

	const handleStartEdit = (index: number, value: string) => {
		setEditingOptionIndex(index);
		setEditingValue(value);
	};

	const handleSaveEdit = (index: number) => {
		const trimmed = editingValue.trim();
		// Allow saving if value is non-empty and either unchanged OR not already in the list
		if (trimmed && (trimmed === options[index] || !options.includes(trimmed))) {
			const newOptions = [...options];
			newOptions[index] = editingValue.trim();
			onUpdate(columnId, { options: newOptions });
		}
		setEditingOptionIndex(null);
		setEditingValue("");
	};

	const handleCancelEdit = () => {
		setEditingOptionIndex(null);
		setEditingValue("");
	};

	return (
		<div className="mt-2 space-y-2">
			<div className="flex gap-2">
				<Input
					value={newOption}
					onChange={(e) => setNewOption(e.target.value)}
					placeholder="Add new option"
					onKeyDown={(e) => {
						if (e.key === "Enter") handleAddOption();
					}}
					className="flex-1"
				/>
				<Button onClick={handleAddOption} size="sm">
					<Plus className="h-4 w-4" />
				</Button>
			</div>

			<div className="space-y-1">
				{options.map((option, index) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: options list uses positional editing — index is the stable identity
					<div key={index} className="flex items-center gap-2">
						{editingOptionIndex === index ? (
							<div className="flex items-center gap-2">
								<Input
									value={editingValue}
									onChange={(e) => setEditingValue(e.target.value)}
									onBlur={handleSaveEdit.bind(null, index)}
									onKeyDown={(e) => {
										if (e.key === "Enter") handleSaveEdit(index);
										if (e.key === "Escape") handleCancelEdit();
									}}
									autoFocus
									className="w-40"
								/>
							</div>
						) : (
							<div className="flex items-center gap-2 flex-1">
								<span className="flex-1">{option}</span>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => handleStartEdit(index, option)}
									aria-label="Edit option"
								>
									Edit
								</Button>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => handleDeleteOption(index)}
									aria-label="Delete option"
								>
									<Trash2 className="h-4 w-4" />
								</Button>
							</div>
						)}
					</div>
				))}
			</div>
		</div>
	);
}
