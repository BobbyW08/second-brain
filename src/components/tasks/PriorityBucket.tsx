import { useState, useRef } from "react";
import { useTasksByPriority } from "@/queries/tasks";
import { useCreateTask, useCompleteTask, useCompletedTodayTasks } from "@/queries/tasks";
import { PRIORITY_ORDER, PRIORITY_LABELS } from "@/lib/taskConstants";
import { Plus, CalendarCheck } from "lucide-react";
import { InlineTaskInput } from "@/components/tasks/InlineTaskInput";
import { TaskPill } from "@/components/tasks/TaskPill";

interface PriorityBucketProps {
  userId: string;
}

export function PriorityBucket({ userId }: PriorityBucketProps) {
  const bucketRef = useRef<HTMLDivElement>(null);
  // bucketRef used by Phase 3 — FullCalendar Draggable init
  const [creating, setCreating] = useState<string | null>(null);
  const tasksByPriorityQuery = useTasksByPriority(userId);
  const completedTodayTasksQuery = useCompletedTodayTasks(userId);
  const tasksByPriority = tasksByPriorityQuery.data ?? [];
  const completedTodayTasks = completedTodayTasksQuery.data ?? [];
  
  // Group tasks by priority
  const tasksByPriorityGrouped: Record<string, typeof tasksByPriority> = {};
  if (tasksByPriority && Array.isArray(tasksByPriority)) {
    tasksByPriority.forEach(task => {
      if (!tasksByPriorityGrouped[task.priority]) {
        tasksByPriorityGrouped[task.priority] = [];
      }
      tasksByPriorityGrouped[task.priority].push(task);
    });
  }
  const createTask = useCreateTask();
  const completeTask = useCompleteTask();

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

  return (
    <div ref={bucketRef} className="flex flex-col gap-4">
      {/* Completed Today Section */}
      <section className="flex flex-col gap-1">
        <div className="flex items-center justify-between px-2 py-1">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
            <CalendarCheck className="h-3 w-3" />
            Completed Today
          </h2>
        </div>
        {completedTodayTasks.length > 0 ? (
          completedTodayTasks.map((task) => (
            <TaskPill
              key={task.id}
              task={task}
              onComplete={handleComplete}
            />
          ))
        ) : (
          <div className="px-2 py-1 text-xs text-muted-foreground">
            No tasks completed today
          </div>
        )}
      </section>

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
              <TaskPill
                key={task.id}
                task={task}
                onComplete={handleComplete}
              />
            ))}
          </section>
        );
      })}
    </div>
  );
}
