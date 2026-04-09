import { useRouter } from "@tanstack/react-router";
import { FileText, ListTodo, Table } from "lucide-react";
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
import { supabase } from "@/utils/supabase";

interface SearchResult {
	id: string;
	title: string;
	type: "page" | "task" | "folder" | "table_row";
	path?: string;
	context?: string;
	tableId?: string;
}

interface CommandDialogProps {
	mode?: "navigation" | "link";
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	onLinkSelect?: (result: SearchResult) => void;
}

export function CommandDialogComponent({
	mode = "navigation",
	open: controlledOpen,
	onOpenChange: onControlledOpenChange,
	onLinkSelect,
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
			const { data, error } = await supabase
				.from("pages")
				.select("id, title, folder_id")
				.eq("user_id", userId)
				.ilike("title", `%${term}%`)
				.limit(10)
				.throwOnError();

			if (error) throw error;

			return data.map((page) => ({
				id: page.id,
				title: page.title,
				path: page.folder_id ? `Folder` : `Unfoldered`,
				context: page.folder_id ? `Folder` : `Unfoldered`,
			}));
		},
		[],
	);

	const searchTasks = useCallback(
		async (term: string, userId: string): Promise<SearchResult[]> => {
			const { data, error } = await supabase
				.from("tasks")
				.select("id, title, priority")
				.eq("user_id", userId)
				.ilike("title", `%${term}%`)
				.limit(10)
				.throwOnError();

			if (error) throw error;

			return data.map((task) => ({
				id: task.id,
				title: task.title,
				path: task.priority ?? undefined,
				context: task.priority ?? undefined,
			}));
		},
		[],
	);

	const searchFolders = useCallback(
		async (term: string, userId: string): Promise<SearchResult[]> => {
			const { data, error } = await supabase
				.from("folders")
				.select("id, name")
				.eq("user_id", userId)
				.ilike("name", `%${term}%`)
				.limit(10)
				.throwOnError();

			if (error) throw error;

			return data.map((folder) => ({
				id: folder.id,
				title: folder.name,
				path: "Folder",
				context: "Folder",
			}));
		},
		[],
	);

	const searchTableRows = useCallback(
		async (term: string, userId: string): Promise<SearchResult[]> => {
			const { data, error } = await supabase
				.from("table_rows")
				.select("id, table_id, data")
				.eq("user_id", userId)
				.limit(10)
				.throwOnError();

			if (error) throw error;

			// Filter rows based on content in data JSONB
			const filteredRows = data.filter((row) => {
				const rowData = row.data;
				if (!rowData) return false;

				// Convert all values to string and check if term is present
				const flatData = JSON.stringify(rowData).toLowerCase();
				return flatData.includes(term.toLowerCase());
			});

			return filteredRows.map((row) => ({
				id: row.id,
				title: `Row in ${row.table_id}`,
				path: "Table",
				context: "Table row",
				tableId: row.table_id,
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
				// Search all four groups in parallel
				const [pages, tasks, folders, tableRows] = await Promise.all([
					searchPages(searchTerm, user.id),
					searchTasks(searchTerm, user.id),
					searchFolders(searchTerm, user.id),
					searchTableRows(searchTerm, user.id),
				]);

				// Combine and sort results
				const allResults = [
					...pages.map((p) => ({ ...p, type: "page" as const })),
					...tasks.map((t) => ({ ...t, type: "task" as const })),
					...folders.map((f) => ({ ...f, type: "folder" as const })),
					...tableRows.map((r) => ({ ...r, type: "table_row" as const })),
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
	}, [
		searchTerm,
		user,
		searchPages,
		searchTasks,
		searchFolders,
		searchTableRows,
	]);

	const handleSelect = (result: SearchResult) => {
		if (mode === "link" && onLinkSelect) {
			onLinkSelect(result);
		} else {
			switch (result.type) {
				case "page":
					router.navigate({ to: `/pages/${result.id}` });
					break;
				case "task":
					// Navigate to task-related destination (could be a specific task view)
					router.navigate({ to: `/tasks` });
					break;
				case "table_row":
					// Navigate to table row detail
					router.navigate({
						to: "/tables/$tableId/rows/$rowId",
						params: { tableId: result.tableId ?? "", rowId: result.id },
					});
					break;
			}
		}
		setOpen(false);
	};

	return (
		<CommandDialog open={open} onOpenChange={setOpen}>
			<CommandInput
				placeholder="Search pages, tasks, folders, and table rows..."
				value={searchTerm}
				onValueChange={setSearchTerm}
			/>
			<CommandList>
				<CommandEmpty>
					{isLoading ? "Searching..." : "No results found"}
				</CommandEmpty>

				{results.length > 0 && (
					<>
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
											{result.path}
										</span>
									</CommandItem>
								))}
						</CommandGroup>

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

						<CommandGroup heading="Table Rows">
							{results
								.filter((r) => r.type === "table_row")
								.map((result) => (
									<CommandItem
										key={result.id}
										onSelect={() => handleSelect(result)}
										className="flex items-center gap-2"
									>
										<Table className="h-4 w-4" />
										<span>{result.title}</span>
										<span className="ml-auto text-xs text-muted-foreground">
											{result.context}
										</span>
									</CommandItem>
								))}
						</CommandGroup>
					</>
				)}
			</CommandList>
		</CommandDialog>
	);
}
