import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export function Route() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-bold mb-4">Tasks</h1>
        <p className="text-muted-foreground mb-6">
          Select a task to get started, or drag one to the calendar.
        </p>
        <Button asChild>
          <Link to="/dashboard">Go to Calendar</Link>
        </Button>
      </div>
    </div>
  );
}