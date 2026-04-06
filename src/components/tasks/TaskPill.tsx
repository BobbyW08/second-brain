import { Circle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Database } from "@/types/database.types";

type Task = Database["public"]["Tables"]["tasks"]["Row"];

interface TaskPillProps {
	task: Task;
	onComplete: (taskId: string) => void;
}

export function TaskPill({ task, onComplete }: TaskPillProps) {
	return (
		<div
			className="task-pill flex items-center gap-2 rounded-md px-2 py-1 hover:bg-sidebar-accent"
			data-task-id={task.id}
			data-title={task.title}
			data-block-size={task.block_size}
			data-priority={task.priority}
		>
			{/* Complete button — 44×44px tap target via padding */}
			<button
				type="button"
				onClick={() => onComplete(task.id)}
				className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-full hover:text-primary"
				aria-label="Mark complete"
			>
				<Circle className="h-4 w-4 text-muted-foreground" />
			</button>

			<span className="flex-1 truncate text-sm">{task.title}</span>

			<Badge variant="outline" className="shrink-0 text-xs">
				{task.block_size}
			</Badge>
		</div>
	);
}
