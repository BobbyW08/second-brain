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
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TagsInput } from "@notion-kit/tags-input";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
	CalendarIcon,
	Check,
	CheckCircle2,
	Copy,
	GripVertical,
	Paperclip,
	Trash2,
} from "lucide-react";
import { useState } from "react";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	useCompleteTask,
	useDeleteTask,
	useReorderSubtasks,
	useUpdateTask,
} from "@/queries/tasks";
import { useUIStore } from "@/stores/useUIStore";
import type { Database } from "@/types/database.types";
import { supabase } from "@/utils/supabase";

type Task = Database["public"]["Tables"]["tasks"]["Row"];

interface TaskCardProps {
	task: Task;
	userId: string;
}

function formatTaskDate(dateStr: string | null): string {
	if (!dateStr) return "";
	const d = new Date(dateStr);
	return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatDateForEdit(dateStr: string | null): string {
	if (!dateStr) return "";
	const d = new Date(dateStr);
	return d.toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
}

// ─── SubtaskRow ───────────────────────────────────────────

function SubtaskRow({ subtask, userId }: { subtask: Task; userId: string }) {
	const { attributes, listeners, setNodeRef, transform, transition } =
		useSortable({ id: subtask.id });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
	};

	const { mutate: completeSubtask } = useCompleteTask(userId);
	const { mutate: deleteSubtask } = useDeleteTask(userId);

	const borderColor = subtask.color || "#666672";

	return (
		<div
			ref={setNodeRef}
			style={{ ...style, borderLeftColor: borderColor }}
			className="group relative flex items-start gap-2 rounded-lg bg-[#1a1a20] px-3 py-2 border-l-[3px]"
			data-task-id={subtask.id}
			data-title={subtask.title}
		>
			{/* biome-ignore lint/a11y/useSemanticElements: dnd-kit requires span element, not button */}
			<span
				{...listeners}
				{...attributes}
				role="button"
				tabIndex={0}
				className="mt-[3px] shrink-0 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing text-[#444450]"
				onClick={(e) => e.stopPropagation()}
				onKeyDown={(e) => e.key === "Enter" && e.stopPropagation()}
			>
				<GripVertical size={14} />
			</span>

			<span className="flex-1 min-w-0 text-[13px] text-[#e8e8f0] leading-snug break-words">
				{subtask.title}
			</span>

			<button
				type="button"
				className="shrink-0 mt-[2px] w-[18px] h-[18px] rounded-full border border-[#444450] hover:border-[#3A8FD4] transition-colors"
				onClick={(e) => {
					e.stopPropagation();
					completeSubtask(subtask.id);
				}}
				aria-label="Complete subtask"
			/>

			<button
				type="button"
				className="shrink-0 text-[#444450] hover:text-[#E05555] transition-colors"
				onClick={(e) => {
					e.stopPropagation();
					deleteSubtask(subtask.id);
				}}
				aria-label="Delete subtask"
			>
				<Trash2 size={12} />
			</button>
		</div>
	);
}

// ─── TaskCard ────────────────────────────────────────────────────

export function TaskCard({ task, userId }: TaskCardProps) {
	const { openTaskId, setOpenTaskId } = useUIStore();
	const isOpen = openTaskId === task.id;

	const { mutate: completeTask } = useCompleteTask(userId);
	const { mutate: deleteTask } = useDeleteTask(userId);
	const { mutate: updateTask } = useUpdateTask(userId);

	const { attributes, listeners, setNodeRef, transform, transition } =
		useSortable({ id: task.id });

	const borderColor = task.color ?? "#666672";

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		borderLeftColor: borderColor,
	};

	const toggle = () => setOpenTaskId(isOpen ? null : task.id);
	const close = () => setOpenTaskId(null);

	// ── Closed card ───────────────────────────────────────
	if (!isOpen) {
		return (
			// biome-ignore lint/a11y/useSemanticElements: card contains nested interactive elements
			<div
				ref={setNodeRef}
				style={style}
				role="button"
				tabIndex={0}
				className="group relative flex items-start gap-2 rounded-lg bg-[#1a1a20] px-3 py-2.5 hover:bg-[#1e1e24] transition-colors cursor-pointer border-l-[3px]"
				onClick={toggle}
				onKeyDown={(e) => e.key === "Enter" && toggle()}
				data-task-id={task.id}
				data-title={task.title}
				data-duration={
					task.block_size === "L" ? 60 : task.block_size === "S" ? 15 : 30
				}
			>
				{/* Drag handle */}
				{/* biome-ignore lint/a11y/useKeyWithClickEvents: dnd-kit listeners provide keyboard handling */}
				{/* biome-ignore lint/a11y/useSemanticElements: dnd-kit requires span element, not button */}
				<span
					{...listeners}
					{...attributes}
					role="button"
					tabIndex={0}
					className="mt-[3px] shrink-0 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing text-[#444450]"
					onClick={(e) => e.stopPropagation()}
				>
					<GripVertical size={14} />
				</span>

				<div className="flex-1 min-w-0">
					<p className="text-[13px] text-[#e8e8f0] leading-snug break-words">
						{task.title || <span className="text-[#444450]">Untitled</span>}
					</p>

					{/* Metadata row - only renders if something exists */}
					{(task.due_at || (task.labels && task.labels.length > 0)) && (
						<div className="flex items-center gap-2 mt-1 flex-wrap">
							{task.due_at && (
								<span className="font-mono text-[11px] text-[#666672]">
									{formatTaskDate(task.due_at)}
								</span>
							)}
							{task.labels?.map((label) => (
								<span
									key={label}
									className="text-[11px] text-[#aaaaB8] bg-[#2a2a30] rounded px-1.5 py-0.5"
								>
									{label}
								</span>
							))}
						</div>
					)}
				</div>

				{task.google_event_id && (
					<CalendarIcon
						size={12}
						className="shrink-0 mt-[3px] text-[#3A8A3A]"
					/>
				)}

				{/* Complete button */}
				<button
					type="button"
					className="shrink-0 mt-[2px] w-[18px] h-[18px] rounded-full border border-[#444450] hover:border-[#3A8FD4] transition-colors"
					onClick={(e) => {
						e.stopPropagation();
						completeTask(task.id);
					}}
					aria-label="Mark complete"
				/>
			</div>
		);
	}

	// ── Open card ─────────────────────────────────────────────────
	return (
		<OpenCard
			task={task}
			userId={userId}
			onClose={close}
			onComplete={() => {
				completeTask(task.id);
				close();
			}}
			onDelete={() => deleteTask(task.id)}
			updateTask={updateTask}
		/>
	);
}

// ─── OpenCard ───────────────────────────────────────────────────

function OpenCard({
	task,
	userId,
	onClose,
	onComplete,
	onDelete,
	updateTask,
}: {
	task: Task;
	userId: string;
	onClose: () => void;
	onComplete: () => void;
	onDelete: () => void;
	updateTask: (input: { taskId: string; updates: Partial<Task> }) => void;
}) {
	const reorderSubtasks = useReorderSubtasks(userId);

	const [title, setTitle] = useState(task.title);
	const [description, setDescription] = useState(task.description ?? "");
	const [isEditingDate, setIsEditingDate] = useState(false);
	const [dateInput, setDateInput] = useState("");
	const [dateError, setDateError] = useState(false);
	const [showLinks, setShowLinks] = useState(false);

	const handleTitleBlur = () => {
		if (title !== task.title) {
			updateTask({ taskId: task.id, updates: { title } });
		}
	};

	const handleDescriptionBlur = () => {
		if (description !== (task.description ?? "")) {
			updateTask({ taskId: task.id, updates: { description } });
		}
	};

	const handleDateBlur = () => {
		import("chrono-node").then((chrono) => {
			const parsed = chrono.parseDate(dateInput);
			if (parsed) {
				updateTask({
					taskId: task.id,
					updates: { due_at: parsed.toISOString() },
				});
				setIsEditingDate(false);
				setDateError(false);
			} else if (dateInput) {
				setDateError(true);
			}
		});
	};

	const handleDateClick = () => {
		setDateInput(formatDateForEdit(task.due_at));
		setIsEditingDate(true);
	};

	// Subtasks query
	const { data: allTasks = [] } = useQuery({
		queryKey: ["tasks", userId],
		enabled: !!userId,
		queryFn: async () => {
			const { data } = await supabase
				.from("tasks")
				.select("*")
				.eq("user_id", userId)
				.eq("status", "active")
				.order("position")
				.throwOnError();
			return data ?? [];
		},
	});

	const subtasks = allTasks.filter((t) => t.parent_task_id === task.id);

	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
	);

	const handleSubtaskReorder = (event: DragEndEvent) => {
		const { active, over } = event;
		if (over && active.id !== over.id) {
			reorderSubtasks.mutate({
				taskId: String(active.id),
				overId: String(over.id),
				parentTaskId: task.id,
			});
		}
	};

	const borderColor = task.color ?? "#666672";

	return (
		<div
			className="rounded-lg bg-[#1a1a20] border border-[#2a2a30] flex flex-col"
			style={{ borderLeftColor: borderColor, borderLeftWidth: 3 }}
		>
			{/* Header with close */}
			<div className="flex items-center justify-between px-3 pt-3 pb-1">
				<input
					value={title}
					onChange={(e) => setTitle(e.target.value)}
					onBlur={handleTitleBlur}
					className="w-full text-[16px] text-[#e8e8f0] font-medium bg-transparent border-none outline-none placeholder:text-[#444450]"
					placeholder="Task title"
				/>
				<button
					type="button"
					className="ml-2 shrink-0 text-[#444450] hover:text-[#aaaaB8] transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
					onClick={onClose}
					aria-label="Close"
				>
					<svg
						width={16}
						height={16}
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth={2}
						aria-hidden="true"
					>
						<path d="M18 6L6 18M6 6l12 12" />
					</svg>
				</button>
			</div>

			{/* Fields */}
			<div className="flex flex-col gap-3 px-3 pb-3">
				{/* Description */}
				<textarea
					value={description}
					onChange={(e) => setDescription(e.target.value)}
					onBlur={handleDescriptionBlur}
					className="w-full text-[13px] text-[#aaaaB8] bg-transparent border-none outline-none resize-none placeholder:text-[#444450] leading-relaxed"
					placeholder="Add a note..."
					rows={2}
				/>

				<div className="h-[1px] bg-[#2a2a30]/60" />

				{/* Bucket field - popover */}
				<BucketPopover task={task} userId={userId} />

				{/* Color swatches */}
				<ColorSwatches task={task} userId={userId} />

				{/* Labels - @notion-kit/tags-input */}
				<div>
					<TagsInput
						value={{
							tags: (task.labels ?? []).map((l: string) => ({
								value: l,
								label: l,
							})),
							input: "",
						}}
						onTagsChange={(tags: string[]) =>
							updateTask({ taskId: task.id, updates: { labels: tags } })
						}
						placeholder="Add label..."
					/>
				</div>

				{/* Date field */}
				<div className="flex items-center gap-2">
					<CalendarIcon size={13} className="text-[#444450] shrink-0" />
					{isEditingDate || !task.due_at ? (
						<input
							value={dateInput}
							onChange={(e) => {
								setDateInput(e.target.value);
								setDateError(false);
							}}
							onFocus={() => setIsEditingDate(true)}
							onBlur={handleDateBlur}
							className={`text-[12px] bg-transparent border-none outline-none w-full ${
								dateError ? "border-b border-[#E05555]" : ""
							} text-[#aaaaB8] placeholder:text-[#444450]`}
							placeholder="Set a date..."
						/>
					) : (
						<button
							type="button"
							className="font-mono text-[11px] text-[#aaaaB8] cursor-pointer bg-transparent border-none p-0 h-auto min-h-[44px] min-w-[44px] flex items-center justify-center"
							onClick={handleDateClick}
						>
							{formatTaskDate(task.due_at)}
						</button>
					)}
				</div>
				{dateError && (
					<p className="text-[11px] text-[#E05555] ml-5">
						Try: tomorrow 3pm or apr 18 4-5pm
					</p>
				)}

				{/* Links - collapsed by default */}
				{!showLinks ? (
					<button
						type="button"
						onClick={() => setShowLinks(true)}
						className="flex items-center gap-2 text-[11px] text-[#444450] hover:text-[#666672] transition-colors"
					>
						<Paperclip size={12} /> Add link
					</button>
				) : (
					<LinksSection task={task} userId={userId} />
				)}

				{/* Short ID */}
				<div className="flex items-center gap-1.5">
					<span className="font-mono text-[11px] text-[#444450]">
						#{task.short_id}
					</span>
					<button
						type="button"
						onClick={() => navigator.clipboard.writeText(task.short_id ?? "")}
						className="text-[#444450] hover:text-[#666672] transition-colors"
					>
						<Copy size={10} />
					</button>
				</div>

				{/* Subtasks */}
				{subtasks.length > 0 && (
					<>
						<div className="h-[1px] bg-[#2a2a30]/60" />
						<div className="flex flex-col gap-1">
							<p className="text-[10px] uppercase tracking-[0.06em] text-[#444450]">
								Subtasks
							</p>
							<DndContext
								sensors={sensors}
								collisionDetection={closestCenter}
								onDragEnd={handleSubtaskReorder}
							>
								<SortableContext
									items={subtasks.map((s) => s.id)}
									strategy={verticalListSortingStrategy}
								>
									{subtasks.map((sub) => (
										<SubtaskRow key={sub.id} subtask={sub} userId={userId} />
									))}
								</SortableContext>
							</DndContext>
						</div>
					</>
				)}
			</div>

			{/* Action row */}
			<div className="flex items-center justify-between pt-2 px-3 pb-3 border-t border-[#2a2a30]/60">
				<button
					type="button"
					onClick={onComplete}
					className="flex items-center gap-1.5 text-[12px] text-[#666672] hover:text-[#3A8FD4] transition-colors min-h-[44px] px-1"
				>
					<CheckCircle2 size={14} /> Mark complete
				</button>
				<button
					type="button"
					onClick={onDelete}
					className="text-[#444450] hover:text-[#E05555] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
				>
					<Trash2 size={14} />
				</button>
			</div>
		</div>
	);
}

// ─── BucketPopover ──────────────────────────────────────────────

function BucketPopover({ task, userId }: { task: Task; userId: string }) {
	const [open, setOpen] = useState(false);
	const { data: buckets = [] } = useQuery({
		queryKey: ["buckets", userId],
		enabled: !!userId,
		queryFn: async () => {
			const { data } = await supabase
				.from("buckets")
				.select("*")
				.eq("user_id", userId)
				.order("position")
				.throwOnError();
			return data ?? [];
		},
	});

	const { mutate: updateTask } = useUpdateTask(userId);

	const currentBucket = buckets.find((b) => b.id === task.bucket_id);

	return (
		<div className="flex items-center gap-2">
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<button
						type="button"
						className="flex items-center gap-1.5 text-[11px] text-[#aaaaB8] hover:text-[#e8e8f0] transition-colors py-1"
					>
						<span
							className="w-1.5 h-1.5 rounded-full shrink-0"
							style={{ backgroundColor: currentBucket?.color ?? "#666672" }}
						/>
						{currentBucket?.name ?? "No bucket"}
						<Check size={10} className="text-[#444450]" />
					</button>
				</PopoverTrigger>
				<PopoverContent className="w-44 p-1 bg-[#1e1e24] border border-[#2a2a30] shadow-lg">
					{buckets.map((bucket) => (
						<button
							key={bucket.id}
							type="button"
							onClick={() => {
								updateTask({
									taskId: task.id,
									updates: { bucket_id: bucket.id },
								});
								setOpen(false);
							}}
							className={`flex items-center gap-2 w-full px-2 py-1.5 rounded text-[12px] transition-colors ${
								task.bucket_id === bucket.id
									? "text-[#e8e8f0]"
									: "text-[#666672] hover:text-[#aaaaB8] hover:bg-[#2a2a30]"
							}`}
						>
							<span
								className="w-1.5 h-1.5 rounded-full shrink-0"
								style={{ backgroundColor: bucket.color ?? "#666672" }}
							/>
							{bucket.name}
							{task.bucket_id === bucket.id && (
								<Check size={10} className="ml-auto" />
							)}
						</button>
					))}
				</PopoverContent>
			</Popover>
		</div>
	);
}

// ─── ColorSwatches ───────────────────────────────────────────────

function ColorSwatches({ task, userId }: { task: Task; userId: string }) {
	const colors = [
		"#E05555",
		"#D4943A",
		"#3A8FD4",
		"#3A8A3A",
		"#8B5CF6",
		"#666672",
	];
	const { mutate: updateTask } = useUpdateTask(userId);

	return (
		<div className="flex items-center gap-2">
			{colors.map((c) => (
				<button
					key={c}
					type="button"
					onClick={() => updateTask({ taskId: task.id, updates: { color: c } })}
					className={`w-6 h-6 rounded-full transition-transform ${
						task.color === c
							? "ring-2 ring-offset-1 ring-offset-[#1a1a20] ring-white/40 scale-110"
							: "hover:scale-105"
					}`}
					style={{ backgroundColor: c }}
					aria-label={`Set color to ${c}`}
				/>
			))}
		</div>
	);
}

// ─── LinksSection ───────────────────────────────────────────────

interface LinksSectionProps {
	task: Task;
	userId: string;
}

function LinksSection({ task, userId }: LinksSectionProps) {
	const queryClient = useQueryClient();
	const [linkInput, setLinkInput] = useState("");

	const { data: links = [] } = useQuery({
		queryKey: ["links", task.id],
		queryFn: async () => {
			const { data } = await supabase
				.from("links")
				.select("*")
				.eq("source_id", task.id)
				.throwOnError();
			return data ?? [];
		},
	});

	const handleAddLink = async () => {
		if (!linkInput.trim()) return;
		await supabase
			.from("links")
			.insert({
				source_id: task.id,
				source_type: "task",
				target_id: linkInput.trim(),
				target_type: "url",
				user_id: userId,
			})
			.throwOnError();
		setLinkInput("");
		queryClient.invalidateQueries({ queryKey: ["links", task.id] });
	};

	return (
		<div className="flex flex-col gap-1">
			<input
				value={linkInput}
				onChange={(e) => setLinkInput(e.target.value)}
				onKeyDown={(e) => e.key === "Enter" && handleAddLink()}
				placeholder="Paste a URL..."
				className="text-[12px] text-[#aaaaB8] bg-[#1e1e24] rounded px-2 py-1.5 border border-[#2a2a30] outline-none"
			/>
			{links.map((link: { id: string; target_id: string }) => (
				<a
					key={link.id}
					href={link.target_id}
					target="_blank"
					rel="noopener noreferrer"
					className="text-[11px] text-[#3A8FD4] hover:underline"
				>
					{link.target_id}
				</a>
			))}
		</div>
	);
}
