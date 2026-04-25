import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps
	extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
	({ className, ...props }, ref) => {
		return (
			<textarea
				className={cn(
					"flex min-h-[80px] w-full rounded-md border border-[#2a2a30] bg-[#1e1e24] px-3 py-2 text-sm text-[#e8e8f0] placeholder:text-[#444450] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#3A8FD4] disabled:cursor-not-allowed disabled:opacity-50",
					className,
				)}
				ref={ref}
				{...props}
			/>
		);
	},
);
Textarea.displayName = "Textarea";

export { Textarea };
