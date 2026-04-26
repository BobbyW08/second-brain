import { FileText, Plus } from "lucide-react";
import { Tree } from "react-arborist";
import { EmptyState } from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import {
	useDeleteNode,
	useFoldersAndPages,
	useMoveNode,
	useRenameNode,
} from "@/queries/folders";
import { useCreatePage } from "@/queries/pages";
import { useUIStore } from "@/stores/useUIStore";
import { FolderNode } from "./FolderNode";

export function FolderTree({ userId }: { userId: string }) {
	const { data: tree, isLoading } = useFoldersAndPages(userId);
	const { setActivePageId } = useUIStore();

	const { mutate: createPage } = useCreatePage();
	const { mutate: renameNode } = useRenameNode();
	const { mutate: moveNode } = useMoveNode();
	const { mutate: deleteNode } = useDeleteNode();

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
				<Tree
					data={tree ?? []}
					onRename={({ id, name, node }) =>
						renameNode({ type: node.data.type, id, name, user_id: userId })
					}
					onMove={({ dragIds, parentId, index }) =>
						dragIds.forEach((id) => {
							const node = tree.find((n) => n.id === id);
							if (node) {
								moveNode({
									type: node.type,
									id,
									parent_id: parentId,
									position: index,
									user_id: userId,
								});
							}
						})
					}
					onDelete={({ ids, nodes }) =>
						ids.forEach((id, i) => {
							deleteNode({ type: nodes[i].data.type, id, user_id: userId });
						})
					}
					onSelect={(nodes) => {
						const node = nodes[0];
						if (node && node.data.type === "page") {
							setActivePageId(node.id);
						}
					}}
					openByDefault={false}
					width="100%"
					height={600}
					indent={16}
					rowHeight={32}
				>
					{FolderNode}
				</Tree>
			)}
		</div>
	);
}
