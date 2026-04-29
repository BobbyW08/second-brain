import { useQuery, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useDeleteBlock } from "@/queries/calendarBlocks";
import type { Database } from "@/types/database.types";
import { supabase } from "@/utils/supabase";

type Block = Database["public"]["Tables"]["calendar_blocks"]["Row"];

interface EventSidePanelProps {
	blockId: string;
	onClose: () => void;
	userId: string;
}

export function EventSidePanel({ blockId, onClose }: EventSidePanelProps) {
	const [isClosing, setIsClosing] = useState(false);
	const queryClient = useQueryClient();
	const { mutate: deleteBlock } = useDeleteBlock();

	const { data: block, isLoading } = useQuery({
		queryKey: ["calendar-block", blockId],
		queryFn: async () => {
			const { data } = await supabase
				.from("calendar_blocks")
				.select("*")
				.eq("id", blockId)
				.single()
				.throwOnError();
			return data as Block;
		},
	});

	if (isLoading || !block) {
		return null;
	}

	const handleClose = () => {
		setIsClosing(true);
		setTimeout(onClose, 200);
	};

	const handleDelete = () => {
		deleteBlock(blockId, {
			onSuccess: () => {
				toast.success("Event deleted");
				queryClient.invalidateQueries({ queryKey: ["calendar-blocks"] });
				handleClose();
			},
			onError: (error: Error) => {
				toast.error(`Failed to delete: ${error.message}`);
			},
		});
	};

	const isGoogleEvent = block.google_event_id !== null;
	const startTime = new Date(block.start_time);
	const endTime = block.end_time ? new Date(block.end_time) : null;

	return (
		<div
			className={`absolute right-0 top-0 bottom-0 w-80 bg-background border-l border-border shadow-lg transform transition-transform duration-200 ${
				isClosing ? "translate-x-full" : "translate-x-0"
			} overflow-y-auto z-50`}
		>
			<div className="sticky top-0 flex items-center justify-between p-4 border-b border-border bg-card">
				<h2 className="font-semibold text-lg truncate">{block.title}</h2>
				<button
					type="button"
					onClick={handleClose}
					className="p-1 hover:bg-muted rounded-md transition flex-shrink-0"
					aria-label="Close event panel"
				>
					<X className="w-5 h-5" />
				</button>
			</div>

			<div className="p-4 space-y-4">
				<div>
					<div className="text-sm font-medium text-muted-foreground">Start</div>
					<p className="text-sm">{startTime.toLocaleString()}</p>
				</div>

				{endTime && (
					<div>
						<div className="text-sm font-medium text-muted-foreground">End</div>
						<p className="text-sm">{endTime.toLocaleString()}</p>
					</div>
				)}

				{block.task_id && (
					<div>
						<div className="text-sm font-medium text-muted-foreground">
							Task ID
						</div>
						<p className="text-xs font-mono text-muted-foreground">
							{block.task_id}
						</p>
					</div>
				)}

				{isGoogleEvent && (
					<div className="p-3 bg-muted rounded-md border border-border">
						<p className="text-sm text-muted-foreground">
							📅 Google Calendar Event
						</p>
					</div>
				)}

				{!isGoogleEvent && (
					<div className="pt-4 border-t">
						<button
							type="button"
							onClick={handleDelete}
							className="w-full px-3 py-2 text-sm bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition"
						>
							Delete Event
						</button>
					</div>
				)}
			</div>
		</div>
	);
}
