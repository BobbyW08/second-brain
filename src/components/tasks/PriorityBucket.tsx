import { Draggable } from "@fullcalendar/interaction";
import { Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { CompletedTodaySection } from "@/components/tasks/CompletedTodaySection";
import { InlineTaskInput } from "@/components/tasks/InlineTaskInput";
import { TaskPill } from "@/components/tasks/TaskPill";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";
import {
	BLOCK_SIZE_DURATIONS,
	PRIORITY_LABELS,
	PRIORITY_ORDER,
} from "@/lib/taskConstants";
import {
	useCompleteTask,
	useCreateTask,
	useTasksByPriority,
} from "@/queries/tasks";

interface PriorityBucketProps {
	userId: string;
}

export function PriorityBucket({ userId }: PriorityBucketProps) {
	const bucketRef = useRef<HTMLDivElement>(null);
	// bucketRef used by Phase 3 — FullCalendar Draggable init
	const [creating, setCreating] = useState<string | null>(null);
	const { user } = useAuth();
	const tasksByPriorityQuery = useTasksByPriority(userId);
	const tasksByPriority = tasksByPriorityQuery.data ?? [];

	// Group tasks by priority
	const tasksByPriorityGrouped: Record<string, typeof tasksByPriority> = {};
	if (tasksByPriority && Array.isArray(tasksByPriority)) {
		tasksByPriority.forEach((task) => {
			if (!tasksByPriorityGrouped[task.priority]) {
				tasksByPriorityGrouped[task.priority] = [];
			}
			tasksByPriorityGrouped[task.priority].push(task);
		});
	}
	const createTask = useCreateTask();
	const completeTask = useCompleteTask(user?.id ?? "");

	// Initialize FullCalendar Draggable for task pills
	useEffect(() => {
		if (!bucketRef.current) return;

		const draggable = new Draggable(bucketRef.current, {
			itemSelector: ".task-pill",
			eventData: (el) => ({
				id: el.dataset.taskId,
				title: el.dataset.title,
				duration: BLOCK_SIZE_DURATIONS[el.dataset.blockSize as "S" | "M" | "L"],
			}),
		});

		return () => draggable.destroy();
	}, []);

	const handleCreate = (title: string, priority: string) => {
		// Get the count of tasks for this priority from the grouped data
		const tasksForPriority = tasksByPriorityGrouped[priority] || [];
		createTask.mutate({
			user_id: userId,
			title,
			priority,
			block_size: "M",
			position: tasksForPriority.length,
		});
		setCreating(null);
	};

	const handleComplete = (taskId: string) => {
		completeTask.mutate(taskId);
	};

	if (tasksByPriorityQuery.isLoading) {
		return (
			<div className="space-y-2 p-2">
				{[1, 2, 3].map((i) => (
					<Skeleton key={i} className="h-12 w-full rounded-md" />
				))}
			</div>
		);
	}

	if (!tasksByPriority) {
		return (
			<div className="space-y-2 p-2">
				{[1, 2, 3].map((i) => (
					<Skeleton key={i} className="h-12 w-full rounded-md" />
				))}
			</div>
		);
	}

	return (
		<div ref={bucketRef} className="flex flex-col gap-4">
			<CompletedTodaySection userId={userId} />

			{PRIORITY_ORDER.map((priority) => {
				const tasksForPriority = tasksByPriorityGrouped[priority] || [];
				return (
					<section key={priority} className="flex flex-col gap-1">
						<div className="flex items-center justify-between px-2 py-1">
							<h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
								{PRIORITY_LABELS[priority]}
							</h2>
							<button
								type="button"
								onClick={() => setCreating(priority)}
								aria-label="Add task"
								className="p-1 rounded-md hover:bg-muted"
							>
								<Plus className="h-4 w-4" />
							</button>
						</div>

						{creating === priority && (
							<InlineTaskInput
								onSave={(title) => handleCreate(title, priority)}
								onCancel={() => setCreating(null)}
							/>
						)}

						{tasksForPriority.map((task) => (
							<TaskPill key={task.id} task={task} onComplete={handleComplete} />
						))}
					</section>
				);
			})}
		</div>
	);
}
