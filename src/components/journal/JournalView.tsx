import { useNavigate } from "@tanstack/react-router";
import { Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";
import { useLogAIUsage } from "@/queries/aiUsage";
import { useCreateJournalPage, useTodayJournalPage } from "@/queries/pages";
import { getJournalPrompt } from "@/server/journalPrompt";

export function JournalView() {
	const { user } = useAuth();
	const { data: todayPage, isLoading } = useTodayJournalPage(user?.id ?? "");
	const { mutate: createJournalPage } = useCreateJournalPage();
	const navigate = useNavigate();

	// AI prompt state
	const [aiPrompt, setAiPrompt] = useState<string | null>(null);
	const [promptDismissed, setPromptDismissed] = useState(false);
	const { mutate: logUsage } = useLogAIUsage();

	// Auto-create today's entry if it doesn't exist
	useEffect(() => {
		if (isLoading) return;

		if (!todayPage) {
			const today = new Date().toISOString().split("T")[0];

			createJournalPage(
				{ user_id: user?.id ?? "", journal_date: today },
				{
					onSuccess: (page) => {
						if (page?.id) {
							navigate({ to: "/journal/$pageId", params: { pageId: page.id } });
						}
					},
				},
			);
		} else {
			if (todayPage?.id) {
				navigate({ to: "/journal/$pageId", params: { pageId: todayPage.id } });
			}
		}
	}, [isLoading, todayPage, user?.id, navigate, createJournalPage]);

	// Fetch AI prompt when today's page is created
	useEffect(() => {
		if (!todayPage || promptDismissed) return;

		// Check if page is new/empty (no content or content is just the default block)
		const firstBlock = Array.isArray(todayPage.content)
			? (todayPage.content[0] as Record<string, unknown> | undefined)
			: undefined;
		const isEmptyPage =
			!todayPage.content ||
			(Array.isArray(todayPage.content) && todayPage.content.length === 0) ||
			(Array.isArray(todayPage.content) &&
				todayPage.content.length === 1 &&
				firstBlock?.type === "paragraph" &&
				(!firstBlock?.content ||
					(firstBlock.content as unknown[]).length === 0));

		if (isEmptyPage) {
			const today = new Date().toISOString().split("T")[0];

			getJournalPrompt({ data: { journalDate: today } })
				.then((result) => {
					if (result?.prompt) {
						setAiPrompt(result.prompt);
						// Log usage
						logUsage({
							userId: user?.id ?? "",
							feature: "journal",
							tokensUsed: 50,
						});
					}
				})
				.catch((error) => {
					console.error("Error fetching journal prompt:", error);
				});
		}
	}, [todayPage, promptDismissed, user?.id, logUsage]);

	// While creating/redirecting, show a skeleton
	if (isLoading || !todayPage) {
		return (
			<div className="flex flex-col h-full p-4">
				<Skeleton className="h-8 w-48 mb-4" />
				<Skeleton className="h-64 w-full" />
			</div>
		);
	}

	// For now, just return the page view - we'll add the AI prompt UI in a separate component
	// that would be rendered in the PageView component when it's a journal page
	return (
		<div className="flex flex-col h-full">
			{/* AI Prompt Banner */}
			{aiPrompt && !promptDismissed && (
				<div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-3 mb-4 text-sm">
					<Sparkles className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
					<p className="italic text-amber-800 dark:text-amber-200 flex-1">
						{aiPrompt}
					</p>
					<button type="button" onClick={() => setPromptDismissed(true)}>
						<X className="h-4 w-4 text-amber-500" />
					</button>
				</div>
			)}

			{/* Page content would be rendered here by the PageView component */}
			{/* This is a placeholder for now - in practice, the PageView component would be rendered */}
			<div className="flex-1">
				{/* The PageView component will be rendered by the route */}
			</div>
		</div>
	);
}
