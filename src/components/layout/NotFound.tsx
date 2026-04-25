import { useRouter } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

interface NotFoundProps {
	message?: string;
}

export function NotFound({ message = "Page not found" }: NotFoundProps) {
	const router = useRouter();

	return (
		<div className="flex flex-col items-center justify-center min-h-96 p-4 text-center">
			<div className="mb-4">
				<h1 className="text-[22px] font-medium text-muted-foreground">404</h1>
				<p className="text-[13px] text-muted-foreground mt-2">{message}</p>
			</div>
			<Button onClick={() => router.history.back()}>Go Back</Button>
		</div>
	);
}
