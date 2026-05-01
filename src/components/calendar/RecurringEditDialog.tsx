import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface RecurringEditDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onJustThisTime: () => void;
	onAllTimes: () => void;
}

export function RecurringEditDialog({
	open,
	onOpenChange,
	onJustThisTime,
	onAllTimes,
}: RecurringEditDialogProps) {
	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Adjust recurring event</AlertDialogTitle>
					<AlertDialogDescription>
						Would you like to adjust just this occurrence, or all occurrences in
						this series?
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter className="flex-col sm:flex-row gap-2">
					<Button
						variant="outline"
						onClick={() => {
							onJustThisTime();
							onOpenChange(false);
						}}
						style={{ minWidth: "44px", minHeight: "44px" }}
						className="w-full sm:w-auto"
					>
						Just this time
					</Button>
					<Button
						onClick={() => {
							onAllTimes();
							onOpenChange(false);
						}}
						style={{ minWidth: "44px", minHeight: "44px" }}
						className="w-full sm:w-auto"
					>
						All times in this series
					</Button>
					<AlertDialogCancel
						onClick={() => onOpenChange(false)}
						style={{ minWidth: "44px", minHeight: "44px" }}
						className="w-full sm:w-auto"
					>
						Keep as-is
					</AlertDialogCancel>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
