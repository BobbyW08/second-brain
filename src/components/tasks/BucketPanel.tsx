import type { DragEndEvent } from "@dnd-kit/core";
import {
	closestCenter,
	DndContext,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import {
	SortableContext,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Layers } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { EmptyState } from "@/components/shared/EmptyState";
import { AddTaskInline } from "@/components/tasks/AddTaskInline";
import { BucketHeader } from "@/components/tasks/BucketHeader";
import { CompletedTodaySection } from "@/components/tasks/CompletedTodaySection";
import { TaskCard } from "@/components/tasks/TaskCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import {
	useBuckets,
	useCreateBucket,
	useDeleteBucket,
	useUpdateBucket,
} from "@/queries/buckets";
import {
	useCreateTask,
	useReorderTasks,
	useTasksByPriority,
} from "@/queries/tasks";
import { useUIStore } from "@/stores/useUIStore";

export function BucketPanel() {
	const { userId } = useCurrentUser();
	const { scrollToTaskId, setScrollToTaskId } = useUIStore();
	const [expandedBuckets, setExpandedBuckets] = useState<Set<string>>(
		new Set(),
	);
	const [newBucketId, setNewBucketId] = useState<string | null>(null);
	const bucketListRef = useRef<HTMLDivElement>(null);

	const { data: buckets = [], isLoading: loadingBuckets } = useBuckets(userId);
	const { data: tasks = [] } = useTasksByPriority(userId);
	const reorderTasks = useReorderTasks(userId);

	const createBucket = useCreateBucket(userId);
	const updateBucket = useUpdateBucket(userId);
	const deleteBucket = useDeleteBucket(userId);
	const createTask = useCreateTask();

	const tasksByBucket: Record<string, typeof tasks> = {};
	for (const task of tasks) {
		const bid = task.bucket_id || "unsorted";
		if (!tasksByBucket[bid]) tasksByBucket[bid] = [];
		tasksByBucket[bid].push(task);
	}

	// dnd-kit sensors for task reorder
	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
	);

	const handleDragEnd = (bucketId: string) => {
		return (event: DragEndEvent) => {
			const { active, over } = event;
			if (over && active.id !== over.id) {
				reorderTasks.mutate({
					taskId: String(active.id),
					overId: String(over.id),
					bucketId,
				});
			}
		};
	};

	useEffect(() => {
		if (buckets.length > 0 && expandedBuckets.size === 0) {
			setExpandedBuckets(new Set(buckets.map((b) => b.id)));
		}
	}, [buckets, expandedBuckets.size]);

	useEffect(() => {
		if (!scrollToTaskId) return;

		const task = tasks.find((t) => t.id === scrollToTaskId);
		if (task?.bucket_id) {
			setExpandedBuckets((prev) => {
				const next = new Set(prev);
				next.add(task.bucket_id as string);
				return next;
			});

			setTimeout(() => {
				const taskElement = document.querySelector(
					`[data-task-id="${scrollToTaskId}"]`,
				);
				if (taskElement) {
					taskElement.scrollIntoView({ behavior: "smooth", block: "center" });
				}
				setScrollToTaskId(null);
			}, 100);
		}
	}, [scrollToTaskId, tasks, setScrollToTaskId]);

	const toggleExpand = (id: string) => {
		const next = new Set(expandedBuckets);
		if (next.has(id)) {
			next.delete(id);
		} else {
			next.add(id);
		}
		setExpandedBuckets(next);
	};

	const handleAddBucket = () => {
		createBucket.mutate(
			{
				name: "New bucket",
				color: "#666672",
				position: buckets.length,
			},
			{
				onSuccess: (data) => {
					if (data) {
						setNewBucketId(data.id);
						const next = new Set(expandedBuckets);
						next.add(data.id);
						setExpandedBuckets(next);
					}
				},
			},
		);
	};

	if (loadingBuckets) {
		return (
			<div className="flex h-full flex-col gap-4 bg-[hsl(var(--secondary))] p-4">
				{["a", "b", "c"].map((id) => (
					<div key={`bucket-skeleton-${id}`} className="flex flex-col gap-2">
						<Skeleton className="h-8 w-24 bg-accent" />
						<Skeleton className="h-12 w-full bg-accent" />
						<Skeleton className="h-12 w-full bg-accent" />
					</div>
				))}
			</div>
		);
	}

	return (
		<div className="flex h-full flex-col bg-[hsl(var(--secondary))]">
			<div className="flex-1 overflow-y-auto" ref={bucketListRef}>
				{buckets.map((bucket) => {
					const bucketTasks = tasksByBucket[bucket.id] || [];
					const isExpanded = expandedBuckets.has(bucket.id);

					return (
						<div key={bucket.id} className="border-b border-border/50">
							<BucketHeader
								bucket={bucket}
								taskCount={bucketTasks.length}
								isExpanded={isExpanded}
								onToggleExpand={() => toggleExpand(bucket.id)}
								onRename={(name) =>
									updateBucket.mutate({ id: bucket.id, name })
								}
								onDelete={() => deleteBucket.mutate(bucket.id)}
								initialRenameMode={bucket.id === newBucketId}
							/>
							{isExpanded && (
								<div className="flex flex-col gap-1 px-2 pb-2">
									<DndContext
										sensors={sensors}
										collisionDetection={closestCenter}
										onDragEnd={handleDragEnd(bucket.id)}
									>
										<SortableContext
											items={bucketTasks.map((t) => t.id)}
											strategy={verticalListSortingStrategy}
										>
											{bucketTasks.map((task) => (
												<TaskCard key={task.id} task={task} userId={userId} />
											))}
										</SortableContext>
									</DndContext>

									<AddTaskInline
										bucketId={bucket.id}
										onAdd={(title) =>
											createTask.mutate({
												user_id: userId,
												title,
												priority: "unsorted",
												position: bucketTasks.length,
												bucket_id: bucket.id,
											})
										}
									/>
								</div>
							)}
						</div>
					);
				})}

				{buckets.length === 0 && (
					<EmptyState
						icon={Layers}
						title="No buckets yet"
						description="Add your first bucket to organize tasks."
					/>
				)}

				<button
					type="button"
					onClick={handleAddBucket}
					className="w-full px-3 py-2 text-left text-[11px] text-muted-foreground transition-colors hover:text-muted-foreground"
				>
					+ Add bucket
				</button>

				<CompletedTodaySection userId={userId} />
			</div>
		</div>
	);
}
