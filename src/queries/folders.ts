import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Database } from "@/types/database.types";
import { supabase } from "@/utils/supabase";

// Define the types for our tree nodes
export type TreeNode = {
	id: string;
	name: string;
	type: "folder" | "page";
	children?: TreeNode[];
	folder_id?: string | null;
	position?: number;
	page_type?: string;
};

export function useFoldersAndPages(userId: string) {
	return useQuery({
		queryKey: ["folders-pages", userId],
		queryFn: async () => {
			const { data: folders } = await supabase
				.from("folders")
				.select("*")
				.eq("user_id", userId)
				.order("position")
				.throwOnError();

			const { data: pages } = await supabase
				.from("pages")
				.select("id, title, folder_id, page_type")
				.eq("user_id", userId)
				.neq("page_type", "journal") // journal pages live in /journal, not the tree
				.throwOnError();

			return buildTree(folders ?? [], pages ?? []);
		},
	});
}

type PageTreeRow = Pick<
	Database["public"]["Tables"]["pages"]["Row"],
	"id" | "title" | "folder_id" | "page_type"
>;

export function buildTree(
	folders: Database["public"]["Tables"]["folders"]["Row"][],
	pages: PageTreeRow[],
) {
	// Create a map of folders for quick lookup
	const folderMap = new Map<string, TreeNode>();

	// Create folder nodes
	folders.forEach((folder) => {
		folderMap.set(folder.id, {
			id: folder.id,
			name: folder.name,
			type: "folder",
			children: [],
		});
	});

	// Create page nodes
	const pageNodes: TreeNode[] = pages.map((page) => ({
		id: page.id,
		name: page.title,
		type: "page",
		folder_id: page.folder_id,
		page_type: page.page_type ?? undefined,
	}));

	// Group pages by their folder_id
	const pagesByFolder: Record<string, TreeNode[]> = {};
	pageNodes.forEach((page) => {
		const folderId = page.folder_id || "root";
		if (!pagesByFolder[folderId]) {
			pagesByFolder[folderId] = [];
		}
		pagesByFolder[folderId].push(page);
	});

	// Add pages to their respective folders
	folders.forEach((folder) => {
		const folderNode = folderMap.get(folder.id);
		if (folderNode && pagesByFolder[folder.id]) {
			// Sort pages by position
			const sortedPages = pagesByFolder[folder.id].sort(
				(a, b) => (a.position || 0) - (b.position || 0),
			);
			folderNode.children = sortedPages;
		}
	});

	// Create root level pages (no folder_id)
	const rootPages: TreeNode[] = [];
	if (pagesByFolder.root) {
		// Sort root pages by position
		const sortedRootPages = pagesByFolder.root.sort(
			(a, b) => (a.position || 0) - (b.position || 0),
		);
		rootPages.push(...sortedRootPages);
	}

	// Create the final tree structure
	const tree: TreeNode[] = [];

	// Add folders to root
	folders.forEach((folder) => {
		const folderNode = folderMap.get(folder.id);
		if (folderNode) {
			tree.push(folderNode);
		}
	});

	// Add root pages to root
	tree.push(...rootPages);

	// Sort the entire tree by position (folders first, then pages)
	tree.sort((a, b) => {
		// If both are folders, sort by position
		if (a.type === "folder" && b.type === "folder") {
			return (a.position || 0) - (b.position || 0);
		}
		// If only a is a folder, it comes first
		if (a.type === "folder" && b.type === "page") {
			return -1;
		}
		// If only b is a folder, it comes first
		if (a.type === "page" && b.type === "folder") {
			return 1;
		}
		// Both are pages, sort by position
		return (a.position || 0) - (b.position || 0);
	});

	return tree;
}

export function useCreateFolder() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({
			user_id,
			name,
			parent_id,
			position,
		}: {
			user_id: string;
			name: string;
			parent_id?: string | null;
			position?: number;
		}) => {
			const { data } = await supabase
				.from("folders")
				.insert({
					user_id,
					name,
					parent_id,
					position,
				})
				.select()
				.single()
				.throwOnError();

			return data;
		},
		onSuccess: (_data, { user_id }) => {
			queryClient.invalidateQueries({ queryKey: ["folders-pages", user_id] });
		},
	});
}

export function useCreatePage() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({
			user_id,
			title,
			folder_id,
			position,
			page_type = "page",
		}: {
			user_id: string;
			title: string;
			folder_id?: string | null;
			position?: number;
			page_type?: string;
		}) => {
			const { data } = await supabase
				.from("pages")
				.insert({
					user_id,
					title,
					folder_id,
					position,
					page_type,
				})
				.select()
				.single()
				.throwOnError();

			return data;
		},
		onSuccess: (_data, { user_id }) => {
			queryClient.invalidateQueries({ queryKey: ["folders-pages", user_id] });
		},
	});
}

export function useRenameNode() {
	return useMutation({
		mutationFn: async ({
			type,
			id,
			name,
		}: {
			type: "folder" | "page";
			id: string;
			name: string;
		}) => {
			if (type === "folder") {
				const { data } = await supabase
					.from("folders")
					.update({ name })
					.eq("id", id)
					.select()
					.single()
					.throwOnError();
				return data;
			} else {
				const { data } = await supabase
					.from("pages")
					.update({ title: name })
					.eq("id", id)
					.select()
					.single()
					.throwOnError();
				return data;
			}
		},
		onSuccess: (_data, { type: _type, id: _id, name: _name }) => {
			// We don't know the user_id here, so we can't invalidate the query
			// This would need to be handled at a higher level or we'd need to pass user_id
		},
	});
}

export function useMoveNode() {
	return useMutation({
		mutationFn: async ({
			type,
			id,
			parent_id,
			position,
		}: {
			type: "folder" | "page";
			id: string;
			parent_id: string | null;
			position: number;
		}) => {
			if (type === "folder") {
				const { data } = await supabase
					.from("folders")
					.update({ parent_id, position })
					.eq("id", id)
					.select()
					.single()
					.throwOnError();
				return data;
			} else {
				const { data } = await supabase
					.from("pages")
					.update({ folder_id: parent_id, position })
					.eq("id", id)
					.select()
					.single()
					.throwOnError();
				return data;
			}
		},
		onSuccess: (_data, { type: _type, id: _id }) => {
			// We don't know the user_id here, so we can't invalidate the query
			// This would need to be handled at a higher level or we'd need to pass user_id
		},
	});
}

export function useDeleteNode() {
	return useMutation({
		mutationFn: async ({
			type,
			id,
		}: {
			type: "folder" | "page";
			id: string;
		}) => {
			if (type === "folder") {
				const { data } = await supabase
					.from("folders")
					.delete()
					.eq("id", id)
					.select()
					.single()
					.throwOnError();
				return data;
			} else {
				const { data } = await supabase
					.from("pages")
					.delete()
					.eq("id", id)
					.select()
					.single()
					.throwOnError();
				return data;
			}
		},
		onSuccess: (_data, { type: _type, id: _id }) => {
			// We don't know the user_id here, so we can't invalidate the query
			// This would need to be handled at a higher level or we'd need to pass user_id
		},
	});
}
