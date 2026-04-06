import { CheckCircle, ChevronRight, Plus } from "lucide-react";
import { useRef, useState } from "react";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { PRIORITY_LABELS, PRIORITY_ORDER } from "@/lib/taskConstants";
import {
	useCompletedTodayTasks,
	useCompleteTask,
	useCreateTask,
	useTasksByPriority,
} from "@/queries/tasks";
import { InlineTaskInput } from "./InlineTaskInput";
import { TaskPill } from "./TaskPill";

interface PriorityBucketProps {
	userId: string;
}

export function PriorityBucket({ userId }: PriorityBucketProps) {
	// bucketRef used by Phase 3 — FullCalendar Draggable init
	const bucketRef = useRef<HTMLDivElement>(null);
	const [creating, setCreating] = useState<string | null>(null);

	const { data: activeTasks = [] } = useTasksByPriority(userId);
	const { data: completedTasks = [] } = useCompletedTodayTasks(userId);

	const createTask = useCreateTask();
	const completeTask = useCompleteTask(userId);

	async function handleCreate(title: string, priority: string) {
		const tasksForPriority = activeTasks.filter((t) => t.priority === priority);
		await createTask.mutateAsync({
			user_id: userId,
			title,
			priority,
			block_size: "M",
			position: tasksForPriority.length,
		});
		setCreating(null);
	}

	function handleComplete(taskId: string) {
		completeTask.mutate(taskId);
	}

	return (
		<div ref={bucketRef} className="flex flex-col gap-3 px-1">
			{PRIORITY_ORDER.map((priority) => {
				const tasksForPriority = activeTasks.filter(
					(t) => t.priority === priority,
				);
				const completedForPriority = completedTasks.filter(
					(t) => t.priority === priority,
				);

				return (
					<section key={priority}>
						{/* Section header */}
						<div className="flex items-center justify-between px-2 py-1">
							<h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
								{PRIORITY_LABELS[priority]}
							</h2>
							<button
								type="button"
								onClick={() =>
									setCreating(creating === priority ? null : priority)
								}
								aria-label={`Add task to ${PRIORITY_LABELS[priority]}`}
								className="rounded p-0.5 hover:bg-sidebar-accent"
							>
								<Plus className="h-4 w-4 text-muted-foreground" />
							</button>
						</div>

						{/* Inline create input */}
						{creating === priority && (
							<InlineTaskInput
								onSave={(title) => handleCreate(title, priority)}
								onCancel={() => setCreating(null)}
							/>
						)}

						{/* Active task pills */}
						{tasksForPriority.map((task) => (
							<TaskPill key={task.id} task={task} onComplete={handleComplete} />
						))}

						{/* Completed today collapsible */}
						<Collapsible defaultOpen={false}>
							<CollapsibleTrigger className="flex w-full items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-foreground">
								<ChevronRight className="h-3 w-3 transition-transform data-[state=open]:rotate-90" />
								Completed today ({completedForPriority.length})
							</CollapsibleTrigger>
							<CollapsibleContent>
								{completedForPriority.length === 0 ? (
									<p className="px-2 py-1 text-xs text-muted-foreground">
										Nothing completed in this list yet today.
									</p>
								) : (
									completedForPriority.map((task) => (
										<div
											key={task.id}
											className="flex items-center gap-2 px-2 py-1 opacity-50"
										>
											<CheckCircle className="h-4 w-4 shrink-0 text-muted-foreground" />
											<span className="text-sm line-through text-muted-foreground">
												{task.title}
											</span>
										</div>
									))
								)}
							</CollapsibleContent>
						</Collapsible>
					</section>
				);
			})}
		</div>
	);
}
