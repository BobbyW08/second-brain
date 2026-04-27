import { ChevronDown, MoreVertical } from "lucide-react";
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
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

	const handleDeleteClick = () => {
		if (taskCount > 0) {
			setIsDeleteDialogOpen(true);
		} else {
			onDelete();
		}
	};

	return (
		<>
			{/* biome-ignore lint/a11y/useSemanticElements: contains nested interactive elements */}
			<div
				role="button"
				tabIndex={0}
				className="group flex w-full items-center justify-between px-3 py-2 cursor-pointer select-none"
				onClick={onToggleExpand}
				onDoubleClick={(e) => {
					e.stopPropagation();
					setIsEditing(true);
				}}
				onKeyDown={(e) => {
					if (e.key === "Enter") {
						onToggleExpand();
					}
				}}
			>
				<div className="flex items-center gap-2 flex-1 min-w-0">
					<div
						className="h-2 w-2 shrink-0 rounded-full"
						style={{ backgroundColor: bucket.color ?? "#666672" }}
					/>

					{isEditing ? (
						<input
							ref={inputRef}
							type="text"
							value={newName}
							onChange={(e) => setNewName(e.target.value)}
							onBlur={handleSave}
							onKeyDown={handleKeyDown}
							onClick={(e) => e.stopPropagation()}
							className="flex-1 bg-transparent text-[10px] font-medium uppercase tracking-[0.06em] text-foreground outline-none border-b border-[#3A8FD4]"
						/>
					) : (
						<span className="truncate text-[10px] font-medium uppercase tracking-[0.06em] text-muted-foreground group-hover:text-foreground">
							{bucket.name}
						</span>
					)}

					<div className="flex items-center justify-center rounded-full bg-accent px-1.5 py-0.5 text-[11px] font-normal text-muted-foreground">
						{taskCount}
					</div>
				</div>

				<div className="flex items-center gap-1">
					<DropdownMenu>
						<DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
							<button
								type="button"
								className="p-1 rounded hover:bg-accent transition-colors"
							>
								<MoreVertical className="h-3 w-3 text-muted-foreground" />
							</button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-32">
							<DropdownMenuItem onClick={() => setIsEditing(true)}>
								Rename
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={handleDeleteClick}
								className="text-red-400 focus:text-red-400"
							>
								Remove
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>

					<ChevronDown
						className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-150 ${
							isExpanded ? "" : "-rotate-90"
						}`}
					/>
				</div>
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
