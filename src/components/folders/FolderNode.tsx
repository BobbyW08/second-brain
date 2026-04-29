import {
	ChevronRight,
	FileText,
	Folder,
	FolderPlus,
	MoreHorizontal,
	Plus,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { TreeNode } from "@/queries/folders";
import { useUIStore } from "@/stores/useUIStore";

interface FolderNodeProps {
	node: TreeNode;
	expanded: boolean;
	onToggleExpand: (id: string) => void;
	editing: boolean;
	onStartEdit: () => void;
	onRename: (node: TreeNode, newName: string) => void;
	onDelete: (node: TreeNode) => void;
	onSelect: (node: TreeNode) => void;
	onCreatePage: (folderId: string) => void;
	onCreateFolder: (parentId: string) => void;
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
	onCreatePage,
	onCreateFolder,
	depth,
	allNodes,
}: FolderNodeProps) {
	const { expandedFolderIds } = useUIStore();
	const isFolder = node.type === "folder";
	const isSystem = node.is_system ?? false;
	const children = allNodes.filter((n) => n.parent_id === node.id);
	const inputRef = useRef<HTMLInputElement>(null);
	const [localName, setLocalName] = useState(node.name);

	useEffect(() => {
		if (editing && inputRef.current) {
			inputRef.current.focus();
			inputRef.current.select();
		}
	}, [editing]);

	useEffect(() => {
		setLocalName(node.name);
	}, [node.name]);

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") {
			const newName = e.currentTarget.value.trim();
			if (newName && newName !== node.name) {
				onRename(node, newName);
			} else {
				onRename(node, node.name);
			}
		}
		if (e.key === "Escape") {
			onRename(node, node.name);
		}
	};

	const hasChildren = isFolder && children.length > 0;

	return (
		<>
			<div
				className="flex items-center gap-1 px-2 py-1 rounded group hover:bg-muted"
				style={{ paddingLeft: `${depth * 16 + 8}px` }}
			>
				{hasChildren ? (
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

				<button
					type="button"
					onClick={() => onSelect(node)}
					onDoubleClick={() => {
						if (!isSystem) onStartEdit();
					}}
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
							value={localName}
							onChange={(e) => setLocalName(e.target.value)}
							onBlur={(e) => onRename(node, e.currentTarget.value)}
							onKeyDown={handleKeyDown}
							className="bg-transparent outline-none border-b border-primary w-full text-sm"
						/>
					) : (
						<span className="text-sm truncate flex-1">{node.name}</span>
					)}
				</button>

				<DropdownMenu>
					<DropdownMenuTrigger
						onClick={(e) => e.stopPropagation()}
						className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-accent transition-opacity flex-shrink-0"
						aria-label="Options"
					>
						<MoreHorizontal className="h-3 w-3" />
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-48">
						{isFolder && (
							<>
								<DropdownMenuItem onClick={() => onCreatePage(node.id)}>
									<Plus className="h-3.5 w-3.5 mr-2" />
									New Page
								</DropdownMenuItem>
								<DropdownMenuItem onClick={() => onCreateFolder(node.id)}>
									<FolderPlus className="h-3.5 w-3.5 mr-2" />
									New Folder
								</DropdownMenuItem>
								<DropdownMenuSeparator />
							</>
						)}
						{!isSystem && (
							<DropdownMenuItem onClick={() => onStartEdit()}>
								Rename
							</DropdownMenuItem>
						)}
						{!isSystem && (
							<DropdownMenuItem
								onClick={() => onDelete(node)}
								className="text-destructive"
							>
								Delete
							</DropdownMenuItem>
						)}
						{isSystem && (
							<span className="px-2 py-1.5 text-xs text-muted-foreground">
								System folder
							</span>
						)}
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			{isFolder && expanded && children.length > 0 && (
				<div>
					{children.map((child) => (
						<FolderNode
							key={child.id}
							node={child}
							expanded={expandedFolderIds.includes(child.id)}
							onToggleExpand={onToggleExpand}
							editing={false}
							onStartEdit={() => {}}
							onRename={onRename}
							onDelete={onDelete}
							onSelect={onSelect}
							onCreatePage={onCreatePage}
							onCreateFolder={onCreateFolder}
							depth={depth + 1}
							allNodes={allNodes}
						/>
					))}
				</div>
			)}
		</>
	);
}
