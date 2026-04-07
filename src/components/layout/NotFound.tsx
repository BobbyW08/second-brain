import { Button } from "@/components/ui/button";
import { useRouter } from "@tanstack/react-router";

interface NotFoundProps {
  message?: string;
}

export function NotFound({ message = "Page not found" }: NotFoundProps) {
  const router = useRouter();
  
  return (
    <div className="flex flex-col items-center justify-center min-h-96 p-4 text-center">
      <div className="mb-4">
        <h1 className="text-3xl font-bold text-muted-foreground">404</h1>
        <p className="text-lg text-muted-foreground mt-2">{message}</p>
      </div>
      <Button onClick={() => router.history.back()}>Go Back</Button>
    </div>
  );
}