import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";

interface InlineTaskInputProps {
	onSave: (title: string) => void;
	onCancel: () => void;
}

export function InlineTaskInput({ onSave, onCancel }: InlineTaskInputProps) {
	const [value, setValue] = useState("");
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		inputRef.current?.focus();
	}, []);

	function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
		if (e.key === "Enter" && value.trim()) {
			onSave(value.trim());
			setValue("");
		} else if (e.key === "Escape") {
			onCancel();
		}
	}

	return (
		<Input
			ref={inputRef}
			value={value}
			onChange={(e) => setValue(e.target.value)}
			onKeyDown={handleKeyDown}
			onBlur={onCancel}
			placeholder="Task title…"
			className="mx-2 my-1 h-8 w-[calc(100%-1rem)] text-sm"
		/>
	);
}
