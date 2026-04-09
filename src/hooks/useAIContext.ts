import { useRouterState } from "@tanstack/react-router";

export function useAIContext(): string {
	const location = useRouterState({ select: (s) => s.location });
	const pathname = location.pathname;

	if (pathname.startsWith("/journal")) {
		const today = new Date().toLocaleDateString("en-US", {
			weekday: "long",
			year: "numeric",
			month: "long",
			day: "numeric",
		});
		return `The user is in their journal. Today is ${today}.`;
	}

	if (pathname.startsWith("/pages/")) {
		return "The user is editing a page in their second brain.";
	}

	if (pathname.startsWith("/tables/")) {
		return "The user is working with a table.";
	}

	if (pathname === "/dashboard" || pathname === "/calendar") {
		const today = new Date().toLocaleDateString("en-US", {
			weekday: "long",
			year: "numeric",
			month: "long",
			day: "numeric",
		});
		return `The user is viewing their calendar. Today is ${today}.`;
	}

	return "The user is in their second brain app.";
}
