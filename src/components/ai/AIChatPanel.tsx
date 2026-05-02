import {
	AssistantRuntimeProvider,
	ComposerPrimitive,
	MessagePrimitive,
	ThreadPrimitive,
} from "@assistant-ui/react";
import {
	AssistantChatTransport,
	useChatRuntime,
} from "@assistant-ui/react-ai-sdk";
import { X } from "lucide-react";
import { useMemo } from "react";
import { useUIStore } from "@/stores/useUIStore";

export function AIChatPanel() {
	const { setAiPanelOpen } = useUIStore();
	const transport = useMemo(
		() => new AssistantChatTransport({ api: "/api/chat" }),
		[],
	);
	const runtime = useChatRuntime({ transport });

	return (
		<AssistantRuntimeProvider runtime={runtime}>
			<div className="flex flex-col h-full">
				{/* Header */}
				<div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2a30] shrink-0">
					<span className="text-[12px] font-medium text-[#aaaaB8] uppercase tracking-[0.06em]">
						Assistant
					</span>
					<button
						type="button"
						onClick={() => setAiPanelOpen(false)}
						className="text-[#444450] hover:text-[#aaaaB8] transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
					>
						<X size={14} />
					</button>
				</div>

				{/* Thread */}
				<ThreadPrimitive.Root className="flex flex-col flex-1 min-h-0">
					<ThreadPrimitive.Viewport className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
						<ThreadPrimitive.Empty>
							<div className="flex flex-col items-center justify-center h-full py-12 text-center">
								<p className="text-[13px] text-[#666672]">
									Ask me anything about your tasks, schedule, or notes.
								</p>
							</div>
						</ThreadPrimitive.Empty>
						<ThreadPrimitive.Messages components={{ Message: ChatMessage }} />
						<ThreadPrimitive.ViewportFooter>
							<ThreadPrimitive.ScrollToBottom />
						</ThreadPrimitive.ViewportFooter>
					</ThreadPrimitive.Viewport>

					{/* Composer */}
					<div className="shrink-0 px-3 pb-3 pt-2 border-t border-[#2a2a30]">
						<ComposerPrimitive.Root className="flex items-end gap-2 rounded-lg border border-[#2a2a30] bg-[#1e1e24] px-3 py-2 focus-within:border-[#3A8FD4] transition-colors">
							<ComposerPrimitive.Input
								autoFocus
								placeholder="Message Assistant..."
								className="flex-1 bg-transparent text-[13px] text-[#e8e8f0] placeholder:text-[#444450] outline-none resize-none min-h-[20px] max-h-[120px]"
							/>
							<ComposerPrimitive.Send className="shrink-0 text-[#3A8FD4] hover:text-[#5aaaf4] disabled:text-[#444450] transition-colors">
								<SendIcon />
							</ComposerPrimitive.Send>
						</ComposerPrimitive.Root>
					</div>
				</ThreadPrimitive.Root>
			</div>
		</AssistantRuntimeProvider>
	);
}

function ChatMessage() {
	return (
		<MessagePrimitive.Root className="flex gap-3">
			<div className="flex-1 text-[13px] leading-relaxed text-[#e8e8f0]">
				<MessagePrimitive.Parts />
			</div>
		</MessagePrimitive.Root>
	);
}

function SendIcon() {
	return (
		<svg
			width="14"
			height="14"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			aria-label="Send message"
		>
			<title>Send message</title>
			<line x1="22" y1="2" x2="11" y2="13" />
			<polygon points="22 2 15 22 11 13 2 9 22 2" />
		</svg>
	);
}
