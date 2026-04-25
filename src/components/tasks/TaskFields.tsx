import * as chrono from "chrono-node";
import { FileIcon, Globe, LinkIcon, Paperclip, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useBuckets } from "@/queries/buckets";
import { useDeleteLink, useTaskLinks } from "@/queries/links";
import { useUpdateTask } from "@/queries/tasks";
import { useUIStore } from "@/stores/useUIStore";
import type { Database } from "@/types/database.types";

type Task = Database["public"]["Tables"]["tasks"]["Row"];

interface FieldProps {
	task: Task;
	userId: string;
}

const COLORS = [
	{ color: "#E05555", name: "red" },
	{ color: "#D4943A", name: "amber" },
	{ color: "#3A8FD4", name: "blue" },
	{ color: "#3A8A3A", name: "green" },
	{ color: "#8A3A8A", name: "purple" },
	{ color: "#666672", name: "gray" },
];

const URL_REGEX = /(https?:\/\/[^\s]+)/g;

function formatDateRange(start: string | null, end: string | null): string {
	if (!start) return "";
	const s = new Date(start);
	const dateStr = s.toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
	});
	const startTime = s.toLocaleTimeString("en-US", {
		hour: "numeric",
		minute: "2-digit",
	});
	if (!end) return `${dateStr} · ${startTime}`;
	const e = new Date(end);
	const endTime = e.toLocaleTimeString("en-US", {
		hour: "numeric",
		minute: "2-digit",
	});
	return `${dateStr} · ${startTime} – ${endTime}`;
}

export function TitleField({ task, userId }: FieldProps) {
	const [title, setTitle] = useState(task.title);
	const updateTask = useUpdateTask(userId);

	const handleBlur = () => {
		const trimmed = title.trim();
		if (trimmed && trimmed !== task.title) {
			updateTask.mutate({ taskId: task.id, updates: { title: trimmed } });
		} else {
			setTitle(task.title);
		}
	};

	return (
		<input
			className="w-full bg-transparent text-[16px] font-medium text-[#e8e8f0] focus:outline-none"
			value={title}
			onChange={(e) => setTitle(e.target.value)}
			onBlur={handleBlur}
		/>
	);
}

export function DescriptionField({ task, userId }: FieldProps) {
	const [description, setDescription] = useState(task.description || "");
	const updateTask = useUpdateTask(userId);
	const detectedUrls = useMemo(() => {
		return (task.description || "").match(URL_REGEX) || [];
	}, [task.description]);

	const handleBlur = () => {
		if (description !== (task.description || "")) {
			updateTask.mutate({ taskId: task.id, updates: { description } });
		}
	};

	return (
		<div className="flex flex-col gap-2">
			<Textarea
				placeholder="Add details..."
				className="min-h-[60px] w-full resize-none rounded-lg border border-[#2a2a30] bg-[#1e1e24] p-2 text-[13px] text-[#e8e8f0] focus-visible:ring-0 placeholder:text-[#444450]"
				value={description}
				onChange={(e) => setDescription(e.target.value)}
				onBlur={handleBlur}
			/>
			{detectedUrls.length > 0 && (
				<div className="flex flex-wrap gap-2">
					{detectedUrls.map((url) => (
						<a
							key={url}
							href={url}
							target="_blank"
							rel="noopener noreferrer"
							className="flex items-center gap-1 rounded bg-[#1e1e24] px-2 py-1 text-[11px] text-[#3A8FD4] hover:bg-[#2e2e38]"
						>
							<Globe className="h-3 w-3" />
							{new URL(url).hostname}
						</a>
					))}
				</div>
			)}
		</div>
	);
}

export function BucketSelector({ task, userId }: FieldProps) {
	const { data: buckets = [] } = useBuckets(userId);
	const updateTask = useUpdateTask(userId);

	return (
		<div className="flex flex-col gap-1">
			<span className="text-[10px] font-medium uppercase tracking-[0.06em] text-[#666672]">
				Bucket
			</span>
			<div className="flex flex-wrap gap-1">
				{buckets.map((b) => (
					<button
						key={b.id}
						type="button"
						onClick={() =>
							updateTask.mutate({
								taskId: task.id,
								updates: { bucket_id: b.id },
							})
						}
						className={cn(
							"flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] transition-colors",
							task.bucket_id === b.id
								? "bg-[#2e2e38] text-white"
								: "bg-[#1e1e24] text-[#aaaaB8] hover:bg-[#2e2e38]",
						)}
					>
						<div
							className="h-1.5 w-1.5 rounded-full"
							style={{ backgroundColor: b.color || "#666672" }}
						/>
						{b.name}
					</button>
				))}
			</div>
		</div>
	);
}

export function ColorSwatches({ task, userId }: FieldProps) {
	const updateTask = useUpdateTask(userId);
	return (
		<div className="flex flex-col gap-1">
			<span className="text-[10px] font-medium uppercase tracking-[0.06em] text-[#666672]">
				Color
			</span>
			<div className="flex gap-2.5">
				{COLORS.map((c) => (
					<button
						key={c.color}
						type="button"
						onClick={() =>
							updateTask.mutate({
								taskId: task.id,
								updates: { color: c.color },
							})
						}
						className={cn(
							"h-[18px] w-[18px] rounded-full transition-all",
							task.color === c.color &&
								"outline outline-2 outline-white outline-offset-2",
						)}
						style={{ backgroundColor: c.color }}
					/>
				))}
			</div>
		</div>
	);
}

export function LabelsField({ task, userId }: FieldProps) {
	const [labelInput, setLabelInput] = useState("");
	const updateTask = useUpdateTask(userId);

	const handleAddLabel = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" || e.key === ",") {
			e.preventDefault();
			const val = labelInput.trim().replace(/,$/, "");
			if (val) {
				const labels = [...(task.labels || []), val];
				updateTask.mutate({ taskId: task.id, updates: { labels } });
				setLabelInput("");
			}
		}
	};

	return (
		<div className="flex flex-col gap-1">
			<span className="text-[10px] font-medium uppercase tracking-[0.06em] text-[#666672]">
				Labels
			</span>
			<div className="flex flex-wrap gap-1 items-center">
				{(task.labels || []).map((l) => (
					<div
						key={l}
						className="flex items-center gap-1 rounded bg-[#1e1e24] border border-[#2a2a30] px-1.5 py-0.5 text-[11px] text-[#e8e8f0]"
					>
						{l}
						<X
							className="h-2.5 w-2.5 cursor-pointer text-[#666672] hover:text-[#aaaaB8]"
							onClick={() =>
								updateTask.mutate({
									taskId: task.id,
									updates: {
										labels: (task.labels || []).filter((label) => label !== l),
									},
								})
							}
						/>
					</div>
				))}
				<input
					className="h-6 w-20 bg-transparent text-[11px] text-[#e8e8f0] focus:outline-none focus:w-32 transition-all placeholder:text-[#444450]"
					placeholder="+ Label"
					value={labelInput}
					onChange={(e) => setLabelInput(e.target.value)}
					onKeyDown={handleAddLabel}
				/>
			</div>
		</div>
	);
}

export function DateTimeField({ task, userId }: FieldProps) {
	const [isEditingDate, setIsEditingDate] = useState(false);
	const [dateInput, setDateInput] = useState("");
	const [dateError, setDateError] = useState(false);
	const updateTask = useUpdateTask(userId);

	const handleDateBlur = () => {
		if (!dateInput.trim()) {
			setIsEditingDate(false);
			setDateError(false);
			return;
		}
		const results = chrono.parse(dateInput, new Date(), { forwardDate: true });
		if (results.length > 0) {
			const result = results[0];
			const start = result.start.date();
			let end: Date | null = null;
			if (result.end) {
				end = result.end.date();
			} else if (result.start.isCertain("hour")) {
				end = new Date(start.getTime() + 60 * 60 * 1000);
			}
			updateTask.mutate({
				taskId: task.id,
				updates: {
					start_time: start.toISOString(),
					end_time: end?.toISOString() || null,
				},
			});
			setIsEditingDate(false);
			setDateError(false);
		} else {
			setDateError(true);
		}
	};

	return (
		<div className="flex flex-col gap-1">
			<span className="text-[10px] font-medium uppercase tracking-[0.06em] text-[#666672]">
				Date & time
			</span>
			{isEditingDate ? (
				<div className="flex flex-col gap-1">
					<Input
						autoFocus
						className={cn(
							"h-8 border-[#2a2a30] bg-[#1e1e24] px-2 font-mono text-[11px] text-[#e8e8f0] focus-visible:ring-0",
							dateError && "border-[rgba(224,85,85,0.6)]",
						)}
						placeholder="e.g. tomorrow 3pm"
						value={dateInput}
						onChange={(e) => setDateInput(e.target.value)}
						onBlur={handleDateBlur}
						onKeyDown={(e) => e.key === "Enter" && handleDateBlur()}
					/>
					{dateError && (
						<p className="text-[11px] text-[#666672]">
							Try: tomorrow 3pm or 04/18 1600
						</p>
					)}
				</div>
			) : (
				<div className="flex items-center gap-2">
					<button
						type="button"
						className="text-[11px] font-mono text-[#e8e8f0] hover:text-white"
						onClick={() => {
							setDateInput(formatDateRange(task.start_time, task.end_time));
							setIsEditingDate(true);
						}}
					>
						{task.start_time
							? formatDateRange(task.start_time, task.end_time)
							: "+ Set date"}
					</button>
					{task.start_time && (
						<X
							className="h-3 w-3 cursor-pointer text-[#666672] hover:text-[#aaaaB8]"
							onClick={() =>
								updateTask.mutate({
									taskId: task.id,
									updates: { start_time: null, end_time: null },
								})
							}
						/>
					)}
				</div>
			)}
		</div>
	);
}

export function RecurringField({ task, userId }: FieldProps) {
	const updateTask = useUpdateTask(userId);
	if (!task.start_time) return null;
	return (
		<div className="flex flex-col gap-1">
			<span className="text-[10px] font-medium uppercase tracking-[0.06em] text-[#666672]">
				Repeats
			</span>
			<Select
				value={task.recurring || "none"}
				onValueChange={(val) =>
					updateTask.mutate({ taskId: task.id, updates: { recurring: val } })
				}
			>
				<SelectTrigger className="h-8 border-[#2a2a30] bg-[#1e1e24] text-[11px] text-[#e8e8f0]">
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="none">None</SelectItem>
					<SelectItem value="daily">Daily</SelectItem>
					<SelectItem value="weekly">Weekly</SelectItem>
					<SelectItem value="monthly">Monthly</SelectItem>
				</SelectContent>
			</Select>
		</div>
	);
}

export function LocationField({ task, userId }: FieldProps) {
	const updateTask = useUpdateTask(userId);
	if (!task.start_time) return null;
	return (
		<div className="flex flex-col gap-1">
			<span className="text-[10px] font-medium uppercase tracking-[0.06em] text-[#666672]">
				Location
			</span>
			<Input
				className="h-8 border-[#2a2a30] bg-[#1e1e24] px-2 text-[13px] text-[#e8e8f0] focus-visible:ring-0"
				value={task.location || ""}
				onChange={(e) =>
					updateTask.mutate({
						taskId: task.id,
						updates: { location: e.target.value },
					})
				}
			/>
		</div>
	);
}

export function AttendeesField({ task, userId }: FieldProps) {
	const [attendeeInput, setAttendeeInput] = useState("");
	const updateTask = useUpdateTask(userId);
	if (!task.start_time) return null;

	const handleAddAttendee = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" || e.key === ",") {
			e.preventDefault();
			const val = attendeeInput.trim().replace(/,$/, "");
			if (val?.includes("@") && val.includes(".")) {
				const attendees = [
					...(Array.isArray(task.attendees)
						? (task.attendees as string[])
						: []),
					val,
				];
				updateTask.mutate({ taskId: task.id, updates: { attendees } });
				setAttendeeInput("");
			}
		}
	};

	return (
		<div className="flex flex-col gap-1">
			<span className="text-[10px] font-medium uppercase tracking-[0.06em] text-[#666672]">
				Attendees
			</span>
			<div className="flex flex-wrap gap-1 items-center">
				{(Array.isArray(task.attendees)
					? (task.attendees as string[])
					: []
				).map((email) => (
					<div
						key={email}
						className="flex items-center gap-1 rounded bg-[#1e1e24] border border-[#2a2a30] px-1.5 py-0.5 text-[11px] text-[#e8e8f0]"
					>
						{email}
						<X
							className="h-2.5 w-2.5 cursor-pointer text-[#666672] hover:text-[#aaaaB8]"
							onClick={() =>
								updateTask.mutate({
									taskId: task.id,
									updates: {
										attendees: (task.attendees as string[]).filter(
											(a) => a !== email,
										),
									},
								})
							}
						/>
					</div>
				))}
				<input
					className="h-6 w-28 bg-transparent text-[11px] text-[#e8e8f0] focus:outline-none placeholder:text-[#444450]"
					placeholder="+ invite email"
					value={attendeeInput}
					onChange={(e) => setAttendeeInput(e.target.value)}
					onKeyDown={handleAddAttendee}
				/>
			</div>
		</div>
	);
}

export function LinksField({ task }: { task: Task }) {
	const [linkInput, setLinkInput] = useState("");
	const { setCommandOpen, setCommandMode } = useUIStore();
	const { data: links = [] } = useTaskLinks(task.id);
	const deleteLink = useDeleteLink();

	return (
		<div className="flex flex-col gap-1">
			<span className="text-[10px] font-medium uppercase tracking-[0.06em] text-[#666672]">
				Links
			</span>
			<div className="flex flex-wrap gap-2 items-center">
				<button
					type="button"
					className="rounded-full bg-[#1e1e24] p-1.5 text-[#666672] hover:text-[#e8e8f0]"
					onClick={() => {
						setCommandMode("link");
						setCommandOpen(true);
					}}
				>
					<Paperclip className="h-4 w-4" />
				</button>
				<Input
					className="h-8 flex-1 border-[#2a2a30] bg-[#1e1e24] px-2 text-[11px] text-[#e8e8f0] focus-visible:ring-0"
					placeholder="Paste a URL..."
					value={linkInput}
					onChange={(e) => setLinkInput(e.target.value)}
					onBlur={() => {
						if (linkInput.startsWith("http")) {
							setLinkInput("");
						}
					}}
				/>
			</div>
			<div className="flex flex-wrap gap-1 mt-1">
				{links.map((link) => (
					<div
						key={link.id}
						className="flex items-center gap-1.5 rounded-full bg-[#1e1e24] border border-[#2a2a30] px-2 py-0.5 text-[11px]"
					>
						{link.target_type === "page" ? (
							<FileIcon className="h-3 w-3" />
						) : (
							<LinkIcon className="h-3 w-3" />
						)}
						<span className="text-[#e8e8f0]">
							{link.target_type === "page" ? "Page" : "Link"}
						</span>
						<X
							className="h-3 w-3 cursor-pointer text-[#666672] hover:text-[#aaaaB8]"
							onClick={() =>
								deleteLink.mutate({
									linkId: link.id,
									targetId: link.target_id || "",
								})
							}
						/>
					</div>
				))}
			</div>
		</div>
	);
}
