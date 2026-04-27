import { TanStackDevtools } from "@tanstack/react-devtools";
import { QueryClientProvider } from "@tanstack/react-query";
import { createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { Toaster } from "../components/ui/sonner";
import { ThemeProvider } from "../components/ui/theme-provider";
import { AuthProvider } from "../context/AuthContext";
import { queryClient } from "../lib/queryClient";

import appCss from "../styles.css?url";

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{ name: "viewport", content: "width=device-width, initial-scale=1" },
			{ title: "Second Brain" },
			{
				name: "description",
				content: "Your personal second brain.",
			},
			{ name: "theme-color", content: "#0a0a0a" },
		],
		links: [
			{ rel: "stylesheet", href: appCss },
			{ rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
			{ rel: "apple-touch-icon", href: "/logo192.svg" },
			{ rel: "manifest", href: "/manifest.json" },
		],
	}),
	shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<HeadContent />
			</head>
			<body>
				<ThemeProvider defaultTheme="system" storageKey="second-brain-theme">
					<QueryClientProvider client={queryClient}>
						<AuthProvider>
							{children}
							<Toaster />
							<TanStackDevtools
								config={{
									position: "bottom-right",
								}}
								plugins={[
									{
										name: "Tanstack Router",
										render: <TanStackRouterDevtoolsPanel />,
									},
								]}
							/>
							<Scripts />
						</AuthProvider>
					</QueryClientProvider>
				</ThemeProvider>
			</body>
		</html>
	);
}
