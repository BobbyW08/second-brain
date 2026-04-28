import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
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
} from "@/components/tasks/TaskFields";
import {
	useDeleteBlock,
	useUndoDeleteCalendarBlock,
} from "@/queries/calendarBlocks";
import { useUpdateTask } from "@/queries/tasks";
import type { Database } from "@/types/database.types";
import { supabase } from "@/utils/supabase";

type Task = Database["public"]["Tables"]["tasks"]["Row"];

interface EventSidePanelProps {
	blockId: string;
	onClose: () => void;
	userId: string;
}

export function EventSidePanel({
	blockId,
	onClose,
	userId,
}: EventSidePanelProps) {
	const [isClosing, setIsClosing] = useState(false);

	const { data: block, isLoading } = useQuery({
		queryKey: ["calendar-block", blockId],
		queryFn: async () => {
			const { data } = await supabase
				.from("calendar_blocks")
				.select("*, task:tasks(*)")
				.eq("id", blockId)
				.single()
				.throwOnError();
			return data;
		},
	});

	const deleteBlock = useDeleteBlock();
	const undoDelete = useUndoDeleteCalendarBlock();
	const updateTask = useUpdateTask(userId);

	const handleClose = () => {
		setIsClosing(true);
		setTimeout(onClose, 200);
	};

	const handleRemove = () => {
		if (!block) return;
		deleteBlock.mutate(blockId);

		// Restore task status to 'active' if this block is linked to a task
		if (block.task_id && task) {
			updateTask.mutate({
				taskId: block.task_id,
				updates: { status: "active" },
			});
		}

		toast("Removed from calendar", {
			action: {
				label: "Undo",
				onClick: () => undoDelete.mutate(block),
			},
		});
		handleClose();
	};

	if (isLoading || !block) return null;

	const isTask = !!block.task_id;
	const task = block.task as Task | null;

	return (
		<div
			style={{
				position: "absolute",
				right: 0,
				top: 0,
				height: "100%",
				width: "320px",
				background: "hsl(var(--card))",
				borderLeft: "1px solid hsl(var(--border))",
				borderRadius: "12px 0 0 12px",
				boxShadow: "0 0 24px rgba(0,0,0,0.4)",
				zIndex: 10,
				overflowY: "auto",
				transform: isClosing ? "translateX(100%)" : "translateX(0)",
				transition: "transform 200ms ease",
			}}
			className="flex flex-col p-4 gap-6"
		>
			<div className="flex items-center justify-between">
				<X
					className="h-5 w-5 cursor-pointer text-muted-foreground hover:text-foreground"
					onClick={handleClose}
				/>
				<h2 className="text-[16px] font-medium text-foreground">
					{isTask ? "Edit task" : "Event details"}
				</h2>
				<div className="w-5" />
			</div>

			<div className="flex flex-col gap-4">
				{isTask && task ? (
					<>
						<TitleField task={task} userId={userId} />
						<DescriptionField task={task} userId={userId} />
						<div className="h-[1px] bg-border my-2" />
						<BucketSelector task={task} userId={userId} />
						<ColorSwatches task={task} userId={userId} />
						<LabelsField task={task} userId={userId} />
						<DateTimeField task={task} userId={userId} />
						<RecurringField task={task} userId={userId} />
						<LocationField task={task} userId={userId} />
						<AttendeesField task={task} userId={userId} />
						<LinksField task={task} />

						<div className="mt-8 border-t border-border pt-4">
							<button
								type="button"
								className="text-[11px] text-muted-foreground hover:text-destructive transition-colors"
								onClick={handleRemove}
							>
								Remove from calendar
							</button>
						</div>
					</>
				) : (
					// Google Calendar Read-only View
					<div className="flex flex-col gap-4">
						<div className="text-[16px] font-medium text-foreground">
							{block.title}
						</div>
						<div className="flex flex-col gap-1">
							<span className="text-[10px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
								Date & time
							</span>
							<div className="text-[11px] font-mono text-foreground">
								{new Date(block.start_time).toLocaleString()} -{" "}
								{new Date(block.end_time).toLocaleTimeString()}
							</div>
						</div>
						<div className="flex items-center gap-2 py-1">
							<div className="h-2 w-2 rounded-full bg-[var(--color-google-event)]" />
							<span className="text-[11px] text-[var(--color-google-event)]">
								Google Calendar event
							</span>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
