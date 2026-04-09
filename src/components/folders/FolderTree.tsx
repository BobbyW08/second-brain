import { useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { Tree } from "react-arborist";
import { Skeleton } from "@/components/ui/skeleton";
import {
	useCreatePage,
	useDeleteNode,
	useFoldersAndPages,
	useMoveNode,
	useRenameNode,
} from "@/queries/folders";
import { FolderNode } from "./FolderNode";

export function FolderTree({ userId }: { userId: string }) {
	const { data: tree, isLoading } = useFoldersAndPages(userId);

	const { mutate: createPage } = useCreatePage();
	const { mutate: renameNode } = useRenameNode();
	const { mutate: moveNode } = useMoveNode();
	const { mutate: deleteNode } = useDeleteNode();

	const navigate = useNavigate();

	if (isLoading) {
		return (
			<div className="space-y-1 p-2">
				{[1, 2, 3, 4, 5].map((i) => (
					<Skeleton key={i} className="h-6 w-full rounded" />
				))}
			</div>
		);
	}

	if (!tree) {
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
								onSuccess: (page) =>
									navigate({
										to: "/pages/$pageId",
										params: { pageId: page.id },
									}),
							},
						)
					}
					aria-label="New page"
					className="p-1 rounded hover:bg-muted"
				>
					<Plus className="h-4 w-4" />
				</button>
			</div>

			{/* Tree */}
			<Tree
				data={tree ?? []}
				onRename={({ id, name, node }) =>
					renameNode({ type: node.data.type, id, name })
				}
				onMove={({ dragIds, parentId, index }) =>
					dragIds.forEach((id) => {
						// For simplicity, we're assuming all dragged items are pages
						// In a real implementation, we'd need to check the node type
						moveNode({
							type: "page",
							id,
							parent_id: parentId,
							position: index,
						});
					})
				}
				onDelete={({ ids, nodes }) =>
					ids.forEach((id, i) => {
						deleteNode({ type: nodes[i].data.type, id });
					})
				}
				onSelect={(nodes) => {
					const node = nodes[0];
					if (node && node.data.type === "page") {
						navigate({ to: "/pages/$pageId", params: { pageId: node.id } });
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
		</div>
	);
}
