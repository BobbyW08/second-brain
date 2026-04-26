import { useQuery } from "@tanstack/react-query";
import { Calendar, FileText } from "lucide-react";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useUIStore } from "@/stores/useUIStore";
import { supabase } from "@/utils/supabase";

function formatRelativeTime(isoString: string): string {
	const date = new Date(isoString);
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffMins = Math.floor(diffMs / 60000);
	const diffHours = Math.floor(diffMins / 60);
	const diffDays = Math.floor(diffHours / 24);

	if (diffMins < 1) return "just now";
	if (diffMins < 60) return `${diffMins}m ago`;
	if (diffHours < 24) return `${diffHours}h ago`;
	if (diffDays === 1) return "yesterday";
	if (diffDays < 7) return `${diffDays} days ago`;
	return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function FilesLandingPage({ userId }: { userId: string }) {
	const { setActivePageId } = useUIStore();
	const [showAllPages, setShowAllPages] = useState(false);

	const { data: recentPages, isLoading: isLoadingPages } = useQuery({
		queryKey: ["pages", "recent", userId],
		queryFn: async () => {
			const { data } = await supabase
				.from("pages")
				.select("id, title, updated_at")
				.eq("user_id", userId)
				.order("updated_at", { ascending: false })
				.limit(10)
				.throwOnError();
			return data ?? [];
		},
		enabled: !!userId,
	});

	const now = new Date();
	const fiveDaysFromNow = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);

	const { data: linkedBlocks, isLoading: isLoadingBlocks } = useQuery({
		queryKey: ["calendar_blocks", "linked", userId],
		queryFn: async () => {
			const { data } = await supabase
				.from("calendar_blocks")
				.select(`
          id,
          start_time,
          linked_page_id,
          task:tasks(title),
          page:pages!linked_page_id(id, title)
        `)
				.eq("user_id", userId)
				.not("linked_page_id", "is", null)
				.gte("start_time", now.toISOString())
				.lte("start_time", fiveDaysFromNow.toISOString())
				.order("start_time", { ascending: true })
				.throwOnError();
			return data ?? [];
		},
		enabled: !!userId,
	});

	return (
		<div
			className="p-6 h-full overflow-y-auto"
			style={{
				display: "flex",
				flexDirection: "column",
				gap: 32,
			}}
		>
			{/* Recent Pages Section */}
			<div>
				<h2 className="text-[16px] font-medium text-[#e8e8f0] mb-4">Recent</h2>
				{isLoadingPages ? (
					<div className="flex flex-col gap-2">
						{Array.from({ length: 3 }).map((_) => (
							<Skeleton
								key={`page-skeleton-${Math.random()}`}
								className="h-12 w-full bg-[#1e1e24]"
							/>
						))}
					</div>
				) : recentPages && recentPages.length > 0 ? (
					<>
						{(showAllPages ? recentPages : recentPages.slice(0, 5)).map(
							(page) => (
								<button
									key={page.id}
									type="button"
									onClick={() => setActivePageId(page.id)}
									className="w-full text-left bg-[#1a1a20] rounded-[8px] p-[12px] mb-[4px] cursor-pointer hover:bg-[#1e1e24] transition-colors"
								>
									<div className="text-[13px] font-medium text-[#e8e8f0]">
										{page.title || "Untitled"}
									</div>
									<div className="text-[11px] font-['JetBrains_Mono'] text-[#666672] mt-[2px]">
										{formatRelativeTime(page.updated_at)}
									</div>
								</button>
							),
						)}
						{recentPages.length > 5 && !showAllPages && (
							<button
								type="button"
								onClick={() => setShowAllPages(true)}
								className="text-[11px] text-[#666672] hover:text-[#aaaaB8] transition-colors"
							>
								Show more
							</button>
						)}
					</>
				) : (
					<p className="text-[13px] text-[#666672] text-center">
						No pages yet. Create one from the folder tree.
					</p>
				)}
			</div>

			{/* Upcoming Events Section */}
			<div>
				<h2 className="text-[16px] font-medium text-[#e8e8f0] mb-4">
					Upcoming
				</h2>
				{isLoadingBlocks ? (
					<div className="flex flex-col gap-2">
						{Array.from({ length: 3 }).map((_) => (
							<Skeleton
								key={`block-skeleton-${Math.random()}`}
								className="h-12 w-full bg-[#1e1e24]"
							/>
						))}
					</div>
				) : linkedBlocks && linkedBlocks.length > 0 ? (
					linkedBlocks.map((block) => (
						<button
							key={block.id}
							type="button"
							onClick={() => block.page && setActivePageId(block.page.id)}
							className="w-full text-left flex items-center gap-2 p-[12px] rounded-[8px] bg-[#1a1a20] mb-[4px] cursor-pointer hover:bg-[#1e1e24] transition-colors"
						>
							<div className="flex-1">
								<div className="flex items-center gap-2">
									<Calendar className="h-[12px] w-[12px] text-[#aaaaB8]" />
									<span className="text-[13px]">
										{block.task?.title || "Event"}
									</span>
									<span className="text-[11px] font-['JetBrains_Mono'] text-[#666672] ml-1">
										·{" "}
										{new Date(block.start_time).toLocaleString("en-US", {
											month: "short",
											day: "numeric",
											hour: "2-digit",
											minute: "2-digit",
											hour12: true,
										})}
									</span>
								</div>
								<div className="flex items-center gap-2 mt-1">
									<FileText className="h-[12px] w-[12px] text-[#666672]" />
									<span className="text-[13px] text-[#e8e8f0]">
										{block.page?.title || "Untitled"}
									</span>
								</div>
							</div>
						</button>
					))
				) : (
					<p className="text-[13px] text-[#666672] text-center">
						No documents tied to upcoming events.
					</p>
				)}
			</div>
		</div>
	);
}
