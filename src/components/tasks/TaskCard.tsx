import { useQueryClient } from "@tanstack/react-query";
import { Check, X } from "lucide-react";
import { useCompleteTask } from "@/queries/tasks";
import { useUIStore } from "@/stores/useUIStore";
import type { Database } from "@/types/database.types";
import { supabase } from "@/utils/supabase";
import {
	AttendeesField,
	BucketSelector,
	ColorSwatches,
	DateTimeField,
	DescriptionField,
	LabelsField,
	LinksField,
	LocationField,
	RecurringField,
	TitleField,
} from "./TaskFields";

type Task = Database["public"]["Tables"]["tasks"]["Row"];

const PRIORITY_COLORS: Record<string, string> = {
	urgent: "#E05555",
	important: "#D4943A",
	someday: "#3A8FD4",
	unsorted: "#666672",
};

function formatChip(start: string | null): string {
	if (!start) return "";
	const d = new Date(start);
	return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function TaskCard({ task, userId }: { task: Task; userId: string }) {
	const queryClient = useQueryClient();
	const { openTaskId, setOpenTaskId } = useUIStore();
	const isOpen = openTaskId === task.id;

	const { mutate: completeTask } = useCompleteTask(userId);

	const borderColor = task.color || PRIORITY_COLORS[task.priority] || "#666672";

	const close = () => setOpenTaskId(null);
	const toggle = () => setOpenTaskId(isOpen ? null : task.id);

	const handleComplete = (e: React.MouseEvent) => {
		e.stopPropagation();
		completeTask(task.id);
		close();
	};

	const handlePaperclipClick = (e: React.MouseEvent) => {
		e.stopPropagation();
		useUIStore.getState().openLinkPicker(async (result) => {
			await supabase
				.from("links")
				.insert({
					source_id: task.id,
					source_type: "task",
					target_id: result.id,
					target_type: result.type,
					user_id: userId,
				})
				.throwOnError();
			queryClient.invalidateQueries({ queryKey: ["links", task.id] });
		});
	};

	if (isOpen) {
		return (
			<div
				className="rounded-[8px] bg-[#1a1a20] border border-[#2a2a30] flex flex-col"
				style={{ borderLeftColor: borderColor, borderLeftWidth: 2 }}
			>
				{/* Open header */}
				<div className="flex items-center justify-between px-3 pt-3 pb-1">
					<TitleField task={task} userId={userId} />
					<button
						type="button"
						className="ml-2 shrink-0 text-[#666672] hover:text-[#aaaaB8] transition-colors"
						onClick={close}
						aria-label="Close"
					>
						<X className="h-4 w-4" />
					</button>
				</div>

				{/* Fields */}
				<div className="flex flex-col gap-3 px-3 pb-3">
					<DescriptionField task={task} userId={userId} />
					<div className="h-[1px] bg-[#2a2a30]" />
					<BucketSelector task={task} userId={userId} />
					<ColorSwatches task={task} userId={userId} />
					<LabelsField task={task} userId={userId} />
					<DateTimeField task={task} userId={userId} />
					<RecurringField task={task} userId={userId} />
					<LocationField task={task} userId={userId} />
					<AttendeesField task={task} userId={userId} />
					<LinksField task={task} />
				</div>

				{/* Complete button */}
				<div className="border-t border-[#2a2a30] px-3 py-2">
					<button
						type="button"
						className="flex items-center gap-1.5 text-[11px] text-[#666672] hover:text-[#3A8A3A] transition-colors"
						onClick={handleComplete}
					>
						<Check className="h-3.5 w-3.5" />
						Mark complete
					</button>
				</div>
			</div>
		);
	}

	return (
		// biome-ignore lint/a11y/useSemanticElements: card contains nested interactive elements
		<div
			role="button"
			tabIndex={0}
			className="group flex items-center gap-2 rounded-[8px] bg-[#1a1a20] px-3 py-2 hover:bg-[#1e1e24] transition-colors cursor-pointer"
			style={{ borderLeft: `2px solid ${borderColor}` }}
			onClick={toggle}
			onKeyDown={(e) => e.key === "Enter" && toggle()}
		>
			{/* Complete checkbox */}
			<button
				type="button"
				className="shrink-0 h-4 w-4 rounded-full border border-[#444450] hover:border-[#3A8A3A] hover:bg-[#3A8A3A]/10 transition-colors flex items-center justify-center"
				onClick={handleComplete}
				aria-label="Complete task"
			>
				<Check className="h-2.5 w-2.5 text-transparent group-hover:text-[#3A8A3A]" />
			</button>

			{/* Title */}
			<span className="flex-1 truncate text-[13px] text-[#e8e8f0]">
				{task.title}
			</span>

			{/* Date chip */}
			{task.start_time && (
				<span className="shrink-0 font-['JetBrains_Mono'] text-[11px] text-[#666672]">
					{formatChip(task.start_time)}
				</span>
			)}

			{/* Paperclip */}
			<button
				type="button"
				className="shrink-0 text-[#444450] hover:text-[#aaaaB8] transition-colors opacity-0 group-hover:opacity-100"
				onClick={handlePaperclipClick}
				aria-label="Link"
			>
				<svg
					className="h-3.5 w-3.5"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth={2}
					aria-hidden="true"
				>
					<path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
				</svg>
			</button>
		</div>
	);
}
