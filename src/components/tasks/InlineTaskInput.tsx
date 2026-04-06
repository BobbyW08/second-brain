import { useRef, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";

interface InlineTaskInputProps {
  onSave: (title: string) => void;
  onCancel: () => void;
}

export function InlineTaskInput({ onSave, onCancel }: InlineTaskInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && value.trim()) {
      onSave(value.trim());
      setValue("");
    } else if (e.key === "Escape") {
      onCancel();
      setValue("");
    }
  };

  const handleBlur = () => {
    onCancel();
    setValue("");
  };

  return (
    <div className="px-2 py-1">
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        autoFocus
        placeholder="Enter task title..."
        className="w-full text-sm"
      />
    </div>
  );
}