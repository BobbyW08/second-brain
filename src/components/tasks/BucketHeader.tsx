import { ChevronRight, MoreHorizontal } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Bucket } from "@/queries/buckets";

interface BucketHeaderProps {
	bucket: Bucket;
	taskCount: number;
	isExpanded: boolean;
	onToggleExpand: () => void;
	onRename: (newName: string) => void;
	onDelete: () => void;
	initialRenameMode?: boolean;
}

export function BucketHeader({
	bucket,
	taskCount,
	isExpanded,
	onToggleExpand,
	onRename,
	onDelete,
	initialRenameMode = false,
}: BucketHeaderProps) {
	const [isEditing, setIsEditing] = useState(initialRenameMode);
	const [newName, setNewName] = useState(bucket.name);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (isEditing) {
			inputRef.current?.focus();
			inputRef.current?.select();
		}
	}, [isEditing]);

	const handleSave = () => {
		const trimmed = newName.trim();
		if (trimmed && trimmed !== bucket.name) {
			onRename(trimmed);
		} else {
			setNewName(bucket.name);
		}
		setIsEditing(false);
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			handleSave();
		} else if (e.key === "Escape") {
			setNewName(bucket.name);
			setIsEditing(false);
		}
	};

	return (
		<>
			<div className="group flex items-center gap-2 px-3 py-2 border-b border-[#2a2a30]/40">
				<button
					type="button"
					onClick={onToggleExpand}
					className="flex items-center gap-1.5 flex-1 min-w-0"
				>
					<ChevronRight
						size={13}
						className={`text-[#444450] transition-transform shrink-0 ${
							isExpanded ? "rotate-90" : ""
						}`}
					/>
					<span className="text-[10px] font-medium uppercase tracking-[0.06em] text-[#666672] truncate">
						{isEditing ? (
							<input
								ref={inputRef}
								type="text"
								value={newName}
								onChange={(e) => setNewName(e.target.value)}
								onBlur={handleSave}
								onKeyDown={handleKeyDown}
								onClick={(e) => e.stopPropagation()}
								className="flex-1 bg-transparent text-[10px] font-medium uppercase tracking-[0.06em] text-[#e8e8f0] outline-none border-b border-[#3A8FD4]"
							/>
						) : (
							bucket.name
						)}
					</span>
					{taskCount > 0 && (
						<span className="text-[11px] text-[#444450] bg-[#2a2a30] rounded-full px-1.5 py-0.5 leading-none ml-1 shrink-0">
							{taskCount}
						</span>
					)}
				</button>

				<button
					className="opacity-0 group-hover:opacity-100 transition-opacity text-[#444450] hover:text-[#aaaaB8] min-w-[44px] min-h-[44px] flex items-center justify-center"
					onClick={(e) => {
						e.stopPropagation();
						setIsEditing(true);
					}}
				>
					<MoreHorizontal size={14} />
				</button>
			</div>

			<AlertDialog
				open={isDeleteDialogOpen}
				onOpenChange={setIsDeleteDialogOpen}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Remove bucket?</AlertDialogTitle>
						<AlertDialogDescription>
							This bucket has {taskCount} task{taskCount === 1 ? "" : "s"}.
							Removing the bucket will move {taskCount === 1 ? "it" : "them"} to
							Unsorted.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={onDelete}
							className="bg-red-600 hover:bg-red-700 text-white"
						>
							Remove bucket
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
