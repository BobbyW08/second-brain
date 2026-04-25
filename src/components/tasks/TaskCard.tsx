import { useQueryClient } from "@tanstack/react-query";
import { useUIStore } from "@/stores/useUIStore";
import type { Database } from "@/types/database.types";
import { supabase } from "@/utils/supabase";

type Task = Database["public"]["Tables"]["tasks"]["Row"];

export function TaskCard({ task, userId }: { task: Task; userId: string }) {
	const queryClient = useQueryClient();
	const { openTaskId } = useUIStore();
	const isOpen = openTaskId === task.id;

	async function addLink(params: {
		sourceId: string;
		sourceType: string;
		targetId: string;
		targetType: string;
		userId: string;
	}) {
		await supabase
			.from("links")
			.insert({
				source_id: params.sourceId,
				source_type: params.sourceType,
				target_id: params.targetId,
				target_type: params.targetType,
				user_id: params.userId,
			})
			.throwOnError();
		queryClient.invalidateQueries({ queryKey: ["links", params.sourceId] });
	}

	const handlePaperclipClick = () => {
		useUIStore.getState().openLinkPicker((result) => {
			addLink({
				sourceId: task.id,
				sourceType: "task",
				targetId: result.id,
				targetType: result.type,
				userId,
			});
		});
	};

	const toggleOpen = () =>
		useUIStore.getState().setOpenTaskId(isOpen ? null : task.id);

	return (
		// biome-ignore lint/a11y/useSemanticElements: card contains a nested button, so outer cannot be <button>
		<div
			role="button"
			tabIndex={0}
			className={`task-card${isOpen ? " task-card--open" : ""}`}
			onClick={toggleOpen}
			onKeyDown={(e) => e.key === "Enter" && toggleOpen()}
		>
			<div className="task-card__title">{task.title}</div>
			<button
				type="button"
				className="task-card__paperclip"
				onClick={(e) => {
					e.stopPropagation();
					handlePaperclipClick();
				}}
				aria-label="Link"
			>
				📎
			</button>
		</div>
	);
}
