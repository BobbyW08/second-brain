import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import "@blocknote/mantine/style.css";
import type { PartialBlock } from "@blocknote/core";
import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAutosave } from "@/hooks/useAutosave";
import { usePage, useUpdatePage } from "@/queries/pages";
import type { Json } from "@/types/database.types";

export function PageView({ pageId }: { pageId: string }) {
	const { theme } = useTheme();
	const resolvedPageId = pageId;

	const { data: page, isLoading } = usePage(resolvedPageId);
	const { mutate: updatePage } = useUpdatePage();

	const [title, setTitle] = useState(page?.title ?? "Untitled");

	const editor = useCreateBlockNote({
		initialContent: (page?.content ?? undefined) as PartialBlock[] | undefined,
	});

	// Autosave content
	const { save: saveContent, isSaving: isSavingContent } = useAutosave(
		(content: unknown) =>
			updatePage({
				pageId: resolvedPageId,
				updates: { content: content as unknown as Json },
			}),
		800,
	);

	// Autosave title
	const { save: saveTitle } = useAutosave(
		(t: string) =>
			updatePage({ pageId: resolvedPageId, updates: { title: t } }),
		800,
	);

	// Update title when page data changes
	useEffect(() => {
		if (page?.title) {
			setTitle(page.title);
		}
	}, [page?.title]);

	return (
		<div className="flex-1 min-h-0 overflow-y-auto w-full">
			<div className="mx-auto w-full max-w-[720px] px-8 py-12 flex flex-col h-full">
				{/* Top bar with saving indicator */}
				<div className="flex justify-end mb-2 h-5">
					{isSavingContent && (
						<span className="flex items-center gap-1 text-xs text-muted-foreground">
							<Loader2 className="h-3 w-3 animate-spin" />
							Saving...
						</span>
					)}
				</div>

				{/* Inline editable title or skeleton */}
				{isLoading ? (
					<>
						<Skeleton className="h-[32px] w-48 bg-accent mb-6" />
						<div className="flex flex-col gap-3">
							<Skeleton className="h-4 w-full bg-accent" />
							<Skeleton className="h-4 w-5/6 bg-accent" />
							<Skeleton className="h-4 w-4/6 bg-accent" />
							<Skeleton className="h-4 w-full bg-accent" />
							<Skeleton className="h-4 w-3/4 bg-accent" />
						</div>
					</>
				) : (
					<>
						<input
							value={title}
							onChange={(e) => {
								setTitle(e.target.value);
								saveTitle(e.target.value);
							}}
							className="text-[22px] font-medium bg-transparent border-none outline-none placeholder:text-muted-foreground w-full mb-4"
							placeholder="Untitled"
							aria-label="Page title"
						/>

						{/* BlockNote editor */}
						<BlockNoteView
							editor={editor}
							onChange={() => saveContent(editor.document)}
							theme={theme === "dark" ? "dark" : "light"}
							slashMenu={true}
						/>
					</>
				)}
			</div>
		</div>
	);
}
