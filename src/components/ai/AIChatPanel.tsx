import { useChat } from "@ai-sdk/react";
import { TextStreamChatTransport } from "ai";
import { Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAIContext } from "@/hooks/useAIContext";
import { useUIStore } from "@/stores/useUIStore";

export function AIChatPanel() {
	const chatPanelOpen = useUIStore((s) => s.chatPanelOpen);
	const setChatPanelOpen = useUIStore((s) => s.setChatPanelOpen);
	const context = useAIContext();
	const isMobile = useIsMobile();
	const bottomRef = useRef<HTMLDivElement>(null);
	const [inputValue, setInputValue] = useState("");

	const { messages, sendMessage, status } = useChat({
		transport: new TextStreamChatTransport({
			api: "/api/ai-chat",
			body: { context },
		}),
	});

	// Auto-scroll to latest message
	// biome-ignore lint/correctness/useExhaustiveDependencies: messages triggers scroll
	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!inputValue.trim() || status === "streaming" || status === "submitted")
			return;
		sendMessage({ text: inputValue });
		setInputValue("");
	};

	const getMessageText = (m: (typeof messages)[number]) =>
		m.parts
			.filter((p) => p.type === "text")
			.map((p) => (p as { type: "text"; text: string }).text)
			.join("");

	return (
		<Sheet open={chatPanelOpen} onOpenChange={setChatPanelOpen}>
			<SheetContent
				side="right"
				className={`${isMobile ? "w-full" : "w-[400px] sm:w-[540px]"} flex flex-col p-0`}
			>
				<SheetHeader className="px-4 py-3 border-b flex-shrink-0">
					<SheetTitle>AI Assistant</SheetTitle>
				</SheetHeader>

				{/* Messages */}
				<div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
					{messages.length === 0 && (
						<p className="text-sm text-muted-foreground text-center mt-8">
							Ask me anything about your notes, tasks, or schedule.
						</p>
					)}
					{messages.map((m) => (
						<div
							key={m.id}
							className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
						>
							<div
								className={`max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
									m.role === "user"
										? "bg-primary text-primary-foreground"
										: "bg-muted text-foreground"
								}`}
							>
								{getMessageText(m)}
							</div>
						</div>
					))}
					{status === "submitted" && (
						<div className="flex justify-start">
							<div className="bg-muted rounded-lg px-3 py-2 text-sm text-muted-foreground">
								Thinking…
							</div>
						</div>
					)}
					<div ref={bottomRef} />
				</div>

				{/* Input */}
				<form
					onSubmit={handleSubmit}
					className="flex gap-2 px-4 py-3 border-t flex-shrink-0"
				>
					<Input
						value={inputValue}
						onChange={(e) => setInputValue(e.target.value)}
						placeholder="Message AI Assistant…"
						className="flex-1"
						disabled={status === "streaming" || status === "submitted"}
					/>
					<Button
						type="submit"
						size="icon"
						disabled={
							!inputValue.trim() ||
							status === "streaming" ||
							status === "submitted"
						}
					>
						<Send className="h-4 w-4" />
					</Button>
				</form>
			</SheetContent>
		</Sheet>
	);
}
