import { useBlockNoteEditor } from "@blocknote/react";
import { CornerDownLeft, Loader2 } from "lucide-react";
import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { getAIContext } from "@/server/aiContext";

export interface AIPromptBarRef {
	focusWithPrompt: (text: string) => void;
}

export const AIPromptBar = forwardRef<
	AIPromptBarRef,
	{ pageId: string; userId: string }
>(({ pageId, userId }, ref) => {
	const [prompt, setPrompt] = useState("");
	const [response, setResponse] = useState("");
	const [loading, setLoading] = useState(false);
	const editor = useBlockNoteEditor();
	const inputRef = useRef<HTMLInputElement>(null);

	useImperativeHandle(ref, () => ({
		focusWithPrompt: (text: string) => {
			setPrompt(text);
			setTimeout(() => inputRef.current?.focus(), 0);
		},
	}));

	const handleSubmit = async () => {
		if (!prompt.trim()) return;
		setLoading(true);
		setResponse("");

		try {
			const selectedText = editor ? editor.getSelectedText() : "";
			const context = await getAIContext({ data: { userId, pageId } });

			const res = await fetch("/api/ai-prompt", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ prompt, context, selectedText }),
			});

			const reader = res.body?.getReader();
			const decoder = new TextDecoder();

			if (reader) {
				while (true) {
					const { done, value } = await reader.read();
					if (done) break;
					setResponse((prev) => prev + decoder.decode(value, { stream: true }));
				}
			}
		} catch (error) {
			console.error("AI prompt error:", error);
		}

		setLoading(false);
		setPrompt("");
	};

	const insertIntoEditor = () => {
		if (!editor || !response) return;
		editor.insertInlineContent([response]);
	};

	return (
		<div className="border-t border-[#2a2a30] bg-[#18181c] px-4 py-3">
			{response && (
				<div className="mb-3 text-[13px] text-[#aaaaB8] leading-relaxed bg-[#1e1e24] rounded-lg p-3 border border-[#2a2a30]">
					{response}
					<button
						type="button"
						onClick={insertIntoEditor}
						className="text-[11px] text-[#3A8FD4] mt-2 block hover:underline"
					>
						Insert into page
					</button>
				</div>
			)}

			<div className="flex items-center gap-2">
				<span className="text-[#3A8FD4] shrink-0 text-[14px]">✦</span>
				<input
					ref={inputRef}
					value={prompt}
					onChange={(e) => setPrompt(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter" && !e.shiftKey) {
							e.preventDefault();
							handleSubmit();
						}
					}}
					placeholder="Ask anything about this page or your day..."
					className="flex-1 text-[13px] text-[#e8e8f0] bg-transparent border-none outline-none placeholder:text-[#444450]"
					disabled={loading}
				/>
				<button
					type="button"
					onClick={handleSubmit}
					disabled={loading || !prompt.trim()}
					className="text-[11px] text-[#3A8FD4] hover:text-[#5AAEF8] disabled:text-[#444450] transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
				>
					{loading ? (
						<Loader2 size={13} className="animate-spin" />
					) : (
						<CornerDownLeft size={13} />
					)}
				</button>
			</div>
		</div>
	);
});

AIPromptBar.displayName = "AIPromptBar";
