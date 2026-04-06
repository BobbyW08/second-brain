import { Circle } from "lucide-react";
import type { Database } from "@/types/database.types";
import { Button } from "@/components/ui/button";

type Task = Database["public"]["Tables"]["tasks"]["Row"];

interface TaskPillProps {
  task: Task;
  onComplete: (taskId: string) => void;
}

export function TaskPill({ task, onComplete }: TaskPillProps) {
  return (
    <div
      className="task-pill flex items-center gap-2 p-2 rounded-md hover:bg-muted transition-colors"
      data-task-id={task.id}
      data-title={task.title}
      data-block-size={task.block_size}
      data-priority={task.priority}
    >
      <Button
        onClick={() => onComplete(task.id)}
        className="h-11 w-11 flex items-center justify-center p-1"
        variant="outline"
        size="icon"
        aria-label="Mark complete"
      >
        <Circle className="h-4 w-4" />
      </Button>
      <span className="flex-1 text-sm">{task.title}</span>
      <div className="flex items-center">
        <div className="bg-secondary text-secondary-foreground text-xs px-2 py-1 rounded-md">
          {task.block_size}
        </div>
      </div>
    </div>
  );
}