import { Check, ChevronDown } from "lucide-react";
import { useState } from "react";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useCompletedTodayTasks } from "@/queries/tasks";

interface CompletedTodaySectionProps {
	userId: string;
}

export function CompletedTodaySection({ userId }: CompletedTodaySectionProps) {
	const [isOpen, setIsOpen] = useState(false);
	const { data: tasks = [] } = useCompletedTodayTasks(userId);

	if (tasks.length === 0) return null;

	return (
		<Collapsible
			open={isOpen}
			onOpenChange={setIsOpen}
			className="mt-4 border-t border-[#2a2a30]"
		>
			<CollapsibleTrigger className="group flex w-full items-center justify-between px-3 py-4 text-left">
				<span className="text-[10px] font-medium uppercase tracking-[0.06em] text-[#666672] transition-colors group-hover:text-[#aaaaB8]">
					Completed today ({tasks.length})
				</span>
				<ChevronDown
					className={`h-3 w-3 text-[#666672] transition-transform duration-150 ${
						isOpen ? "" : "-rotate-90"
					}`}
				/>
			</CollapsibleTrigger>
			<CollapsibleContent className="flex flex-col gap-1 px-3 pb-4">
				{tasks.map((task) => (
					<div key={task.id} className="flex items-center gap-2 py-1">
						<Check className="h-3 w-3 shrink-0 text-[#3A8A3A]" />
						<span className="flex-1 text-[13px] text-[#666672] line-through">
							{task.title}
						</span>
						{task.completed_at && (
							<span className="shrink-0 font-mono text-[11px] text-[#666672]">
								{new Date(task.completed_at)
									.toLocaleTimeString("en-US", {
										hour: "numeric",
										minute: "2-digit",
										hour12: true,
									})
									.toLowerCase()
									.replace(/\s/g, "")}
							</span>
						)}
					</div>
				))}
			</CollapsibleContent>
		</Collapsible>
	);
}
