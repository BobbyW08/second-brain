import { Moon, Sun } from "lucide-react";
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import { Button } from "./button";

export function ThemeProvider({
	children,
	...props
}: React.ComponentProps<typeof NextThemesProvider>) {
	return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}

export function ModeToggle() {
	const { theme, setTheme } = useTheme();
	function toggle() {
		setTheme(theme === "dark" ? "light" : "dark");
	}
	return (
		<Button
			variant="outline"
			size="icon"
			onClick={toggle}
			aria-label="Toggle theme"
		>
			<Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
			<Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
		</Button>
	);
}
