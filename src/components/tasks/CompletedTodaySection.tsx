import { useQuery } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { TaskStub } from "@/components/tasks/TaskStub";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { supabase } from "@/utils/supabase";

interface CompletedTodaySectionProps {
	userId: string;
}

export function CompletedTodaySection({ userId }: CompletedTodaySectionProps) {
	const [isOpen, setIsOpen] = useState(false);

	const { data: tasks = [] } = useQuery({
		queryKey: ["tasks-completed-today", userId],
		queryFn: async () => {
			const today = new Date().toISOString().split("T")[0];
			const { data } = await supabase
				.from("tasks")
				.select("*")
				.eq("user_id", userId)
				.eq("status", "completed_today")
				.gte("updated_at", `${today}T00:00:00Z`)
				.throwOnError();
			return data ?? [];
		},
		enabled: !!userId,
	});

	if (tasks.length === 0) return null;

	return (
		<Collapsible open={isOpen} onOpenChange={setIsOpen} className="mt-4">
			<CollapsibleTrigger className="group flex w-full items-center justify-between px-3 py-2 text-left">
				<span className="text-[10px] font-medium uppercase tracking-[0.06em] text-[#666672] transition-colors group-hover:text-[#aaaaB8]">
					Completed today ({tasks.length})
				</span>
				<ChevronDown
					className={`h-3 w-3 text-[#666672] transition-transform duration-150 ${
						isOpen ? "" : "-rotate-90"
					}`}
				/>
			</CollapsibleTrigger>
			<CollapsibleContent className="flex flex-col gap-1 px-2 pb-2">
				{tasks.map((task) => (
					<TaskStub key={task.id} task={task} bucketColor="#666672" />
				))}
			</CollapsibleContent>
		</Collapsible>
	);
}
