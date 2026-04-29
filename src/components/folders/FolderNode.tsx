import { ChevronRight, FileText, Folder, MoreHorizontal } from "lucide-react";
import { useEffect, useRef } from "react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { TreeNode } from "@/queries/folders";

interface FolderNodeProps {
	node: TreeNode;
	expanded: boolean;
	onToggleExpand: (id: string) => void;
	editing: boolean;
	onStartEdit: () => void;
	onRename: (node: TreeNode, newName: string) => void;
	onDelete: (node: TreeNode) => void;
	onSelect: (node: TreeNode) => void;
	depth: number;
	allNodes: TreeNode[];
}

export function FolderNode({
	node,
	expanded,
	onToggleExpand,
	editing,
	onStartEdit,
	onRename,
	onDelete,
	onSelect,
	depth,
	allNodes,
}: FolderNodeProps) {
	const isFolder = node.type === "folder";
	const children = allNodes.filter((n) => n.parent_id === node.id);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (editing && inputRef.current) {
			inputRef.current.focus();
			inputRef.current.select();
		}
	}, [editing]);

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") {
			onRename(node, e.currentTarget.value);
		}
		if (e.key === "Escape") {
			onRename(node, node.name);
		}
	};

	return (
		<>
			<div
				className="flex items-center gap-1 px-2 py-1 rounded group hover:bg-muted"
				style={{ paddingLeft: `${depth * 16 + 8}px` }}
			>
				{/* Chevron for folders with children */}
				{isFolder && children.length > 0 ? (
					<button
						type="button"
						onClick={() => onToggleExpand(node.id)}
						className="p-0.5 flex items-center justify-center flex-shrink-0"
						aria-label={expanded ? "Collapse" : "Expand"}
					>
						<ChevronRight
							className={`h-3 w-3 text-muted-foreground transition-transform ${expanded ? "rotate-90" : ""}`}
						/>
					</button>
				) : (
					<span className="w-4 flex-shrink-0" />
				)}

				{/* Icon + Title */}
				<button
					type="button"
					onClick={() => onSelect(node)}
					className="flex items-center gap-1 flex-1 min-w-0 text-left"
				>
					{isFolder ? (
						<Folder className="h-4 w-4 text-muted-foreground flex-shrink-0" />
					) : (
						<FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
					)}

					{editing ? (
						<input
							ref={inputRef}
							type="text"
							defaultValue={node.name}
							onChange={() => {}} // Controlled by onBlur
							onBlur={(e) => onRename(node, e.currentTarget.value)}
							onKeyDown={handleKeyDown}
							className="bg-transparent outline-none border-b border-primary w-full text-sm"
						/>
					) : (
						<span className="text-sm truncate flex-1">{node.name}</span>
					)}
				</button>

				{/* Context menu */}
				<DropdownMenu>
					<DropdownMenuTrigger
						onClick={(e) => e.stopPropagation()}
						className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-accent transition-opacity flex-shrink-0"
						aria-label="Options"
					>
						<MoreHorizontal className="h-3 w-3" />
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-48">
						<DropdownMenuItem onClick={() => onStartEdit()}>
							Rename
						</DropdownMenuItem>
						<DropdownMenuItem
							onClick={() => onDelete(node)}
							className="text-destructive"
						>
							Delete
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			{/* Children */}
			{isFolder && expanded && children.length > 0 && (
				<div>
					{children.map((child) => (
						<FolderNode
							key={child.id}
							node={child}
							expanded={expanded}
							onToggleExpand={onToggleExpand}
							editing={false}
							onStartEdit={() => {}}
							onRename={onRename}
							onDelete={onDelete}
							onSelect={onSelect}
							depth={depth + 1}
							allNodes={allNodes}
						/>
					))}
				</div>
			)}
		</>
	);
}
