import { CalendarCheck } from "lucide-react";
import { TaskPill } from "@/components/tasks/TaskPill";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useCompletedTodayTasks } from "@/queries/tasks";

interface CompletedTodaySectionProps {
	userId: string;
	onComplete: (taskId: string) => void;
}

export function CompletedTodaySection({
	userId,
	onComplete,
}: CompletedTodaySectionProps) {
	const completedTodayTasksQuery = useCompletedTodayTasks(userId);
	const completedTodayTasks = completedTodayTasksQuery.data ?? [];

	return (
		<Collapsible defaultOpen={false}>
			<section className="flex flex-col gap-1">
				<div className="flex items-center justify-between px-2 py-1">
					<CollapsibleTrigger className="flex items-center justify-between w-full">
						<h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
							<CalendarCheck className="h-3 w-3" />
							Completed Today
						</h2>
					</CollapsibleTrigger>
				</div>
				<CollapsibleContent>
					{completedTodayTasks.length > 0 ? (
						completedTodayTasks.map((task) => (
							<TaskPill key={task.id} task={task} onComplete={onComplete} />
						))
					) : (
						<div className="px-2 py-1 text-xs text-muted-foreground">
							No tasks completed today
						</div>
					)}
				</CollapsibleContent>
			</section>
		</Collapsible>
	);
}
