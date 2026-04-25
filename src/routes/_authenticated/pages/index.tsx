import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { FilePlus, FolderPlus } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { useCurrentUser } from "../../../hooks/useCurrentUser";
import { useCreateFolder } from "../../../queries/folders";
import { useCreatePage } from "../../../queries/pages";

export const Route = createFileRoute("/_authenticated/pages/")({
	head: () => ({
		meta: [{ title: "Files | Second Brain" }],
	}),
	component: FilesIndex,
});

export default function FilesIndex() {
	const { userId } = useCurrentUser();
	const navigate = useNavigate();
	const { mutate: createFolder } = useCreateFolder();
	const { mutate: createPage } = useCreatePage();

	if (!userId) return null;

	return (
		<div className="flex flex-col items-center justify-center h-full gap-6 text-center p-8">
			<div>
				<h2 className="text-lg font-semibold mb-1">No file selected</h2>
				<p className="text-sm text-muted-foreground">
					Choose a file from the sidebar or create something new.
				</p>
			</div>
			<div className="flex gap-3">
				<Button
					variant="outline"
					onClick={() => createFolder({ user_id: userId, name: "New Folder" })}
					className="flex items-center gap-2"
				>
					<FolderPlus className="h-4 w-4" />
					New Folder
				</Button>
				<Button
					onClick={() =>
						createPage(
							{ user_id: userId, title: "Untitled", page_type: "page" },
							{
								onSuccess: (page) => {
									if (page?.id) {
										navigate({
											to: "/pages/$pageId",
											params: { pageId: page.id },
										});
									}
								},
							},
						)
					}
					className="flex items-center gap-2"
				>
					<FilePlus className="h-4 w-4" />
					New File
				</Button>
			</div>
		</div>
	);
}
