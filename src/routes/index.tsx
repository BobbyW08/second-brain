import { createFileRoute, redirect } from "@tanstack/react-router";

// Placeholder — will be replaced in Phase 1 with the app shell / dashboard redirect
export const Route = createFileRoute("/")({
	beforeLoad: async () => {
		throw redirect({ to: "/login" });
	},
});
