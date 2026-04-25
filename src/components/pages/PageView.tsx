import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import { useParams } from "@tanstack/react-router";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import "@blocknote/mantine/style.css";
import type { PartialBlock } from "@blocknote/core";
import { Loader2 } from "lucide-react";
import { useAutosave } from "@/hooks/useAutosave";
import { usePage, useUpdatePage } from "@/queries/pages";
import type { Json } from "@/types/database.types";

export function PageView() {
	const { theme } = useTheme();
	const { pageId } = useParams({ strict: false });
	const resolvedPageId = pageId ?? "";

	const { data: page } = usePage(resolvedPageId);
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
		<div className="flex flex-col h-full max-w-3xl mx-auto px-6 py-8">
			{/* Top bar with saving indicator */}
			<div className="flex justify-end mb-2 h-5">
				{isSavingContent && (
					<span className="flex items-center gap-1 text-xs text-muted-foreground">
						<Loader2 className="h-3 w-3 animate-spin" />
						Saving...
					</span>
				)}
			</div>

			{/* Inline editable title */}
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
		</div>
	);
}
