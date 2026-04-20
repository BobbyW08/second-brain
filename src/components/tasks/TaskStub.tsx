import type { Database } from "@/types/database.types";

type Task = Database["public"]["Tables"]["tasks"]["Row"];

interface TaskStubProps {
	task: Task;
	bucketColor: string;
}

const durationFromBlockSize = (blockSize: string | null) => {
	switch (blockSize) {
		case "small":
			return "00:30";
		case "medium":
			return "01:00";
		case "large":
			return "02:00";
		default:
			return "01:00";
	}
};

export function TaskStub({ task, bucketColor }: TaskStubProps) {
	return (
		<div
			className="task-stub group flex items-start gap-3 rounded-lg bg-[#1a1a20] p-2 py-2 px-3 transition-colors hover:bg-[#1e1e24] cursor-default"
			data-task-id={task.id}
			data-title={task.title}
			data-duration={durationFromBlockSize(task.block_size)}
		>
			<div
				className="mt-0.5 h-4 w-[3px] shrink-0 rounded-full"
				style={{ backgroundColor: bucketColor }}
			/>
			<span className="text-[13px] font-normal leading-tight text-[#e8e8f0] break-words">
				{task.title}
			</span>
		</div>
	);
}
