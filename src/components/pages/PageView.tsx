import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import "@blocknote/mantine/style.css";
import type { PartialBlock } from "@blocknote/core";
import { AIExtension } from "@blocknote/xl-ai";
import { ChevronRight, Link2, Loader2 } from "lucide-react";
import { editorSchema } from "@/components/editor/linkChipSpec";
import { CommandDialogComponent } from "@/components/search/CommandDialog";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useAutosave } from "@/hooks/useAutosave";
import { useBacklinks } from "@/queries/links";
import { usePage, useUpdatePage } from "@/queries/pages";
import type { Json } from "@/types/database.types";

export function PageView() {
	const { pageId } = useParams({ strict: false });
	const resolvedPageId = pageId ?? "";

	const { data: page } = usePage(resolvedPageId);
	const { mutate: updatePage } = useUpdatePage();

	const [title, setTitle] = useState(page?.title ?? "Untitled");
	const [linkDialogOpen, setLinkDialogOpen] = useState(false);
	const navigate = useNavigate();
	const { data: backlinks } = useBacklinks(resolvedPageId);
	const [backlinksOpen, setBacklinksOpen] = useState(false);

	const editor = useCreateBlockNote({
		initialContent: (page?.content ?? undefined) as PartialBlock[] | undefined,
		schema: editorSchema,
		extensions: [AIExtension()],
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
				className="text-3xl font-bold bg-transparent border-none outline-none placeholder:text-muted-foreground w-full mb-4"
				placeholder="Untitled"
				aria-label="Page title"
			/>

			{/* BlockNote editor */}
			<BlockNoteView
				editor={editor}
				onChange={() => saveContent(editor.document)}
				theme="dark"
				slashMenu={true}
			/>

			<CommandDialogComponent
				mode="link"
				open={linkDialogOpen}
				onOpenChange={setLinkDialogOpen}
				onLinkSelect={(result) => {
					editor.insertInlineContent([
						{
							type: "linkChip" as "linkChip",
							props: {
								itemType: result.type,
								itemId: result.id,
								itemTitle: result.title,
							},
						},
					]);
					setLinkDialogOpen(false);
				}}
			/>

			{backlinks && backlinks.length > 0 && (
				<Collapsible
					open={backlinksOpen}
					onOpenChange={setBacklinksOpen}
					className="mt-8 border-t pt-4"
				>
					<CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
						<Link2 className="h-4 w-4" />
						Linked from ({backlinks.length})
						<ChevronRight
							className={`h-3 w-3 transition-transform ${backlinksOpen ? "rotate-90" : ""}`}
						/>
					</CollapsibleTrigger>
					<CollapsibleContent>
						<ul className="mt-2 space-y-1">
							{backlinks.map((link) => (
								<li key={link.id}>
									<button
										type="button"
										className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
										onClick={() =>
											navigate({
												to: "/pages/$pageId",
												params: { pageId: link.source_id },
											})
										}
									>
										{link.source_type}
									</button>
								</li>
							))}
						</ul>
					</CollapsibleContent>
				</Collapsible>
			)}
		</div>
	);
}
