import { useEffect, useRef, useState } from "react";

interface AddTaskInlineProps {
	bucketId: string;
	onAdd: (title: string) => void;
}

export function AddTaskInline({ bucketId, onAdd }: AddTaskInlineProps) {
	const [isAdding, setIsAdding] = useState(false);
	const [title, setTitle] = useState("");
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (isAdding) {
			inputRef.current?.focus();
		}
	}, [isAdding]);

	const handleAdd = () => {
		const trimmed = title.trim();
		if (trimmed) {
			onAdd(trimmed);
		}
		setTitle("");
		setIsAdding(false);
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			handleAdd();
		} else if (e.key === "Escape") {
			setTitle("");
			setIsAdding(false);
		}
	};

	if (!isAdding) {
		return (
			<button
				type="button"
				onClick={() => setIsAdding(true)}
				className="flex w-full items-center px-3 py-2 text-[11px] text-muted-foreground transition-colors hover:text-muted-foreground"
				data-bucket-id={bucketId}
			>
				+ Add task
			</button>
		);
	}

	return (
		<div className="px-3 py-1" data-bucket-id={bucketId}>
			<input
				ref={inputRef}
				type="text"
				value={title}
				onChange={(e) => setTitle(e.target.value)}
				onBlur={handleAdd}
				onKeyDown={handleKeyDown}
				placeholder="Task name"
				className="w-full rounded-[8px] border border-border bg-accent px-[10px] py-[6px] text-[13px] text-foreground outline-none focus:border-[#3A8FD4]"
			/>
		</div>
	);
}
