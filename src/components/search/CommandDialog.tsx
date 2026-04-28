import { useRouter } from "@tanstack/react-router";
import { FileText, Folder, ListTodo } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import { useAuth } from "@/context/AuthContext";
import { useUIStore } from "@/stores/useUIStore";
import { supabase } from "@/utils/supabase";

interface SearchResult {
	id: string;
	title: string;
	type: "page" | "task" | "folder";
	path?: string;
	context?: string;
}

interface CommandDialogProps {
	mode?: "navigation" | "link";
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
}

export function CommandDialogComponent({
	mode = "navigation",
	open: controlledOpen,
	onOpenChange: onControlledOpenChange,
}: CommandDialogProps) {
	const [internalOpen, setInternalOpen] = useState(false);
	const isControlled = controlledOpen !== undefined;
	const open = isControlled ? controlledOpen : internalOpen;

	const setOpen = useCallback(
		(value: boolean) => {
			if (isControlled) {
				onControlledOpenChange?.(value);
			} else {
				setInternalOpen(value);
			}
		},
		[isControlled, onControlledOpenChange],
	);

	const [searchTerm, setSearchTerm] = useState("");
	const [results, setResults] = useState<SearchResult[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const router = useRouter();
	const { user } = useAuth();

	// Handle keyboard shortcuts
	useEffect(() => {
		const down = (e: KeyboardEvent) => {
			if (e.key === "k" && (e.ctrlKey || e.metaKey)) {
				e.preventDefault();
				setOpen(!open);
			}
			if (e.key === "Escape" && open) {
				e.preventDefault();
				setOpen(false);
			}
		};

		document.addEventListener("keydown", down);
		return () => document.removeEventListener("keydown", down);
	}, [open, setOpen]);

	// Search functions using useCallback to avoid dependency issues
	const searchPages = useCallback(
		async (term: string, userId: string): Promise<SearchResult[]> => {
			const { data } = await supabase
				.from("pages")
				.select("id, title, folder_id")
				.eq("user_id", userId)
				.ilike("title", `%${term}%`)
				.limit(10)
				.throwOnError();

			return data.map((page) => ({
				id: page.id,
				title: page.title,
				type: "page" as const,
				context: page.folder_id ? "In folder" : "Unfoldered",
			}));
		},
		[],
	);

	const searchTasks = useCallback(
		async (term: string, userId: string): Promise<SearchResult[]> => {
			const { data } = await supabase
				.from("tasks")
				.select("id, title, priority")
				.eq("user_id", userId)
				.eq("status", "active")
				.ilike("title", `%${term}%`)
				.limit(10)
				.throwOnError();

			return data.map((task) => ({
				id: task.id,
				title: task.title,
				type: "task" as const,
				context: task.priority ?? undefined,
			}));
		},
		[],
	);

	const searchFolders = useCallback(
		async (term: string, userId: string): Promise<SearchResult[]> => {
			const { data } = await supabase
				.from("folders")
				.select("id, name")
				.eq("user_id", userId)
				.ilike("name", `%${term}%`)
				.limit(10)
				.throwOnError();

			return data.map((folder) => ({
				id: folder.id,
				title: folder.name,
				type: "folder" as const,
				context: "Folder",
			}));
		},
		[],
	);

	// Perform search when debounced term changes
	useEffect(() => {
		if (!searchTerm.trim() || !user) {
			setResults([]);
			setIsLoading(false);
			return;
		}

		setIsLoading(true);

		const performSearch = async () => {
			try {
				// Search all three groups in parallel
				const [pages, tasks, folders] = await Promise.all([
					searchPages(searchTerm, user.id),
					searchTasks(searchTerm, user.id),
					searchFolders(searchTerm, user.id),
				]);

				// Combine and sort results
				const allResults = [
					...pages.map((p) => ({ ...p, type: "page" as const })),
					...tasks.map((t) => ({ ...t, type: "task" as const })),
					...folders.map((f) => ({ ...f, type: "folder" as const })),
				];

				setResults(allResults);
			} catch (error) {
				console.error("Search error:", error);
				setResults([]);
			} finally {
				setIsLoading(false);
			}
		};

		performSearch();
	}, [searchTerm, user, searchPages, searchTasks, searchFolders]);

	const { resolveLinkPicker, setActivePageId } = useUIStore((state) => ({
		resolveLinkPicker: state.resolveLinkPicker,
		setActivePageId: state.setActivePageId,
	}));

	const handleSelect = (result: SearchResult) => {
		if (mode === "link") {
			resolveLinkPicker(result);
		} else {
			switch (result.type) {
				case "page":
					setActivePageId(result.id);
					router.navigate({ to: "/dashboard" });
					break;
				case "task":
					// Navigate to dashboard where tasks live
					router.navigate({ to: "/dashboard" });
					break;
				case "folder":
					// Navigate to dashboard (folder selection is handled by FolderTree navigation)
					router.navigate({ to: "/dashboard" });
					break;
			}
		}
		setOpen(false);
	};

	return (
		<CommandDialog open={open} onOpenChange={setOpen}>
			<CommandInput
				placeholder="Search pages, tasks, and folders..."
				value={searchTerm}
				onValueChange={setSearchTerm}
			/>
			<CommandList>
				<CommandEmpty>
					{isLoading ? "Searching..." : "No results found"}
				</CommandEmpty>

				{results.filter((r) => r.type === "page").length > 0 && (
					<CommandGroup heading="Pages">
						{results
							.filter((r) => r.type === "page")
							.map((result) => (
								<CommandItem
									key={result.id}
									onSelect={() => handleSelect(result)}
									className="flex items-center gap-2"
								>
									<FileText className="h-4 w-4" />
									<span>{result.title}</span>
									<span className="ml-auto text-xs text-muted-foreground">
										{result.context}
									</span>
								</CommandItem>
							))}
					</CommandGroup>
				)}

				{results.filter((r) => r.type === "task").length > 0 && (
					<CommandGroup heading="Tasks">
						{results
							.filter((r) => r.type === "task")
							.map((result) => (
								<CommandItem
									key={result.id}
									onSelect={() => handleSelect(result)}
									className="flex items-center gap-2"
								>
									<ListTodo className="h-4 w-4" />
									<span>{result.title}</span>
									<span className="ml-auto text-xs text-muted-foreground">
										{result.context}
									</span>
								</CommandItem>
							))}
					</CommandGroup>
				)}

				{results.filter((r) => r.type === "folder").length > 0 && (
					<CommandGroup heading="Folders">
						{results
							.filter((r) => r.type === "folder")
							.map((result) => (
								<CommandItem
									key={result.id}
									onSelect={() => handleSelect(result)}
									className="flex items-center gap-2"
								>
									<Folder className="h-4 w-4" />
									<span>{result.title}</span>
								</CommandItem>
							))}
					</CommandGroup>
				)}
			</CommandList>
		</CommandDialog>
	);
}
