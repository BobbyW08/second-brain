import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

interface GoogleSyncDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onConnect: () => void;
}

export function GoogleSyncDialog({
	open,
	onOpenChange,
	onConnect,
}: GoogleSyncDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>Connect Google Calendar</DialogTitle>
					<DialogDescription className="mt-2 text-sm text-muted-foreground">
						Your Google Calendar events will appear here alongside your
						scheduled tasks. Changes you make here will reflect in Google
						Calendar, and vice versa.
					</DialogDescription>
				</DialogHeader>
				<DialogFooter className="gap-2 sm:gap-0">
					<Button
						variant="ghost"
						onClick={() => onOpenChange(false)}
						style={{ minWidth: "44px", minHeight: "44px" }}
					>
						Maybe later
					</Button>
					<Button
						onClick={() => {
							onConnect();
							onOpenChange(false);
						}}
						style={{ minWidth: "44px", minHeight: "44px" }}
					>
						Connect
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
