import { FileText, FolderPlus, Plus } from "lucide-react";
import { useState } from "react";
import { EmptyState } from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import {
	type TreeNode,
	useCreateFolder,
	useDeleteNode,
	useFoldersAndPages,
	useRenameNode,
} from "@/queries/folders";
import { useCreatePage } from "@/queries/pages";
import { useUIStore } from "@/stores/useUIStore";
import { FolderNode } from "./FolderNode";

export function FolderTree({ userId }: { userId: string }) {
	const { data: tree, isLoading } = useFoldersAndPages(userId);
	const { setActivePageId, expandedFolderIds, toggleFolderExpanded } =
		useUIStore();
	const [editingId, setEditingId] = useState<string | null>(null);

	const { mutate: createPage } = useCreatePage();
	const { mutate: createFolder } = useCreateFolder();
	const { mutate: renameNode } = useRenameNode();
	const { mutate: deleteNode } = useDeleteNode();

	const handleRename = (node: TreeNode, newName: string) => {
		renameNode({
			type: node.type,
			id: node.id,
			name: newName,
			user_id: userId,
		});
		setEditingId(null);
	};

	const handleDelete = (node: TreeNode) => {
		if (node.is_system) return;
		deleteNode({ type: node.type, id: node.id, user_id: userId });
	};

	const handleSelectPage = (node: TreeNode) => {
		if (node.type === "page") {
			setActivePageId(node.id);
		}
	};

	const handleCreatePage = () => {
		createPage(
			{ user_id: userId, title: "Untitled", page_type: "page" },
			{
				onSuccess: (page) => {
					setActivePageId(page.id);
				},
			},
		);
	};

	const handleCreateFolder = () => {
		createFolder(
			{ user_id: userId, name: "Untitled" },
			{
				onSuccess: (folder) => {
					setEditingId(folder.id);
					if (!expandedFolderIds.includes(folder.id)) {
						toggleFolderExpanded(folder.id);
					}
				},
			},
		);
	};

	const handleCreateSubPage = (folderId: string) => {
		createPage(
			{
				user_id: userId,
				title: "Untitled",
				folder_id: folderId,
				page_type: "page",
			},
			{
				onSuccess: (page) => {
					setActivePageId(page.id);
				},
			},
		);
	};

	const handleCreateSubFolder = (parentId: string) => {
		createFolder(
			{ user_id: userId, name: "Untitled", parent_id: parentId },
			{
				onSuccess: (folder) => {
					toggleFolderExpanded(parentId);
					setEditingId(folder.id);
				},
			},
		);
	};

	const handleRenameFromTree = (id: string) => {
		setEditingId(id);
	};

	if (isLoading || !tree) {
		return (
			<div className="space-y-1 p-2">
				{[1, 2, 3, 4, 5].map((i) => (
					<Skeleton key={i} className="h-6 w-full rounded" />
				))}
			</div>
		);
	}

	return (
		<div className="flex flex-col h-full">
			{/* Header */}
			<div className="flex items-center justify-between px-2 py-1">
				<span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
					Pages
				</span>
				<div className="flex items-center gap-0.5">
					<button
						type="button"
						onClick={handleCreateFolder}
						aria-label="New folder"
						className="p-1 rounded hover:bg-muted"
					>
						<FolderPlus className="h-4 w-4" />
					</button>
					<button
						type="button"
						onClick={handleCreatePage}
						aria-label="New page"
						className="p-1 rounded hover:bg-muted"
					>
						<Plus className="h-4 w-4" />
					</button>
				</div>
			</div>

			{/* Tree or Empty State */}
			{tree.length === 0 ? (
				<div className="flex-1 flex items-center justify-center p-4">
					<EmptyState
						icon={FileText}
						title="No pages yet"
						description="Create a page to get started."
					/>
				</div>
			) : (
				<div className="flex-1 overflow-y-auto px-1">
					{tree.map((node) => (
						<FolderNode
							key={node.id}
							node={node}
							expanded={expandedFolderIds.includes(node.id)}
							onToggleExpand={toggleFolderExpanded}
							editing={editingId === node.id}
							onStartEdit={() => handleRenameFromTree(node.id)}
							onRename={handleRename}
							onDelete={handleDelete}
							onSelect={handleSelectPage}
							onCreatePage={handleCreateSubPage}
							onCreateFolder={handleCreateSubFolder}
							depth={0}
							allNodes={tree}
						/>
					))}
				</div>
			)}
		</div>
	);
}
