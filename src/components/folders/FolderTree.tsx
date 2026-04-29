import { FileText, Plus } from "lucide-react";
import { useState } from "react";
import { EmptyState } from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import {
	type TreeNode,
	useDeleteNode,
	useFoldersAndPages,
	useRenameNode,
} from "@/queries/folders";
import { useCreatePage } from "@/queries/pages";
import { useUIStore } from "@/stores/useUIStore";
import { FolderNode } from "./FolderNode";

export function FolderTree({ userId }: { userId: string }) {
	const { data: tree, isLoading } = useFoldersAndPages(userId);
	const { setActivePageId } = useUIStore();
	const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
	const [editingId, setEditingId] = useState<string | null>(null);

	const { mutate: createPage } = useCreatePage();
	const { mutate: renameNode } = useRenameNode();
	const { mutate: deleteNode } = useDeleteNode();

	const toggleExpanded = (id: string) => {
		const newSet = new Set(expandedIds);
		if (newSet.has(id)) {
			newSet.delete(id);
		} else {
			newSet.add(id);
		}
		setExpandedIds(newSet);
	};

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
		deleteNode({ type: node.type, id: node.id, user_id: userId });
	};

	const handleSelectPage = (node: TreeNode) => {
		if (node.type === "page") {
			setActivePageId(node.id);
		}
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
				<button
					type="button"
					onClick={() =>
						createPage(
							{ user_id: userId, title: "Untitled", page_type: "page" },
							{
								onSuccess: (page) => {
									setActivePageId(page.id);
								},
							},
						)
					}
					aria-label="New page"
					className="p-1 rounded hover:bg-muted"
				>
					<Plus className="h-4 w-4" />
				</button>
			</div>

			{/* Tree or Empty State */}
			{tree && tree.length === 0 ? (
				<div className="flex-1 flex items-center justify-center p-4">
					<EmptyState
						icon={FileText}
						title="No pages yet"
						description="Create a page to get started."
					/>
				</div>
			) : (
				<div className="flex-1 overflow-y-auto px-1">
					{tree?.map((node) => (
						<FolderNode
							key={node.id}
							node={node}
							expanded={expandedIds.has(node.id)}
							onToggleExpand={toggleExpanded}
							editing={editingId === node.id}
							onStartEdit={() => setEditingId(node.id)}
							onRename={handleRename}
							onDelete={handleDelete}
							onSelect={handleSelectPage}
							depth={0}
							allNodes={tree}
						/>
					))}
				</div>
			)}
		</div>
	);
}
