import {
	createFileRoute,
	Link,
	redirect,
	useNavigate,
} from "@tanstack/react-router";
import { useEffect, useId, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSessionReady, supabase } from "@/utils/supabase";

const GOOGLE_CALLBACK_URL = `${typeof window !== "undefined" ? window.location.origin : ""}/auth/callback`;

export const Route = createFileRoute("/login")({
	head: () => ({
		meta: [
			{ title: "Sign In | Second Brain" },
			{
				name: "description",
				content: "Sign in or create an account to access your dashboard.",
			},
		],
	}),
	async beforeLoad() {
		const session = await getSessionReady();

		if (session) {
			throw redirect({ to: "/dashboard" });
		}
	},
	component: LoginPage,
});

function LoginPage() {
	const navigate = useNavigate();

	// Client-side fallback: on a full page load (e.g. page.goto), beforeLoad runs
	// on the server where there's no localStorage session. This effect catches the
	// case where the client has a valid session after hydration.
	useEffect(() => {
		getSessionReady().then((session) => {
			if (session) {
				navigate({ to: "/dashboard" });
			}
		});
	}, [navigate]);

	const emailId = useId();
	const passwordId = useId();
	const confirmPasswordId = useId();
	const displayNameId = useId();
	const [mode, setMode] = useState<"login" | "signup">("login");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [displayName, setDisplayName] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [signupSuccess, setSignupSuccess] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

	async function handleGoogleSignIn() {
		setError(null);
		const { error } = await supabase.auth.signInWithOAuth({
			provider: "google",
			options: {
				scopes: "https://www.googleapis.com/auth/calendar",
				queryParams: {
					access_type: "offline",
					prompt: "consent",
				},
				redirectTo: GOOGLE_CALLBACK_URL,
				shouldCreateUser: false,
			},
		});
		if (error) setError(error.message);
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		setIsSubmitting(true);

		if (mode === "signup") {
			if (password !== confirmPassword) {
				setError("Passwords do not match.");
				setIsSubmitting(false);
				return;
			}

			const { error } = await supabase.auth.signUp({
				email,
				password,
				options: { data: { display_name: displayName } },
			});

			setIsSubmitting(false);

			if (error) {
				setError(error.message);
				return;
			}

			setSignupSuccess(true);
			return;
		}

		const { error } = await supabase.auth.signInWithPassword({
			email,
			password,
		});

		setIsSubmitting(false);

		if (error) {
			setError(error.message);
			return;
		}

		navigate({ to: "/dashboard" });
	}

	function toggleMode() {
		setMode((m) => (m === "login" ? "signup" : "login"));
		setError(null);
		setSignupSuccess(false);
	}

	if (signupSuccess) {
		return (
			<div className="flex min-h-[calc(100vh-64px)] items-center justify-center p-4">
				<Card className="w-full max-w-md">
					<CardHeader>
						<CardTitle className="text-2xl">Check your email</CardTitle>
						<CardDescription>
							We've sent a confirmation link to <strong>{email}</strong>.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Alert>
							<AlertDescription>
								Click the link in your email to activate your account.
								{import.meta.env.DEV && (
									<>
										{" "}
										Local dev: check Mailpit at{" "}
										<a
											href="http://127.0.0.1:54324"
											target="_blank"
											rel="noreferrer"
											className="underline font-medium"
										>
											http://127.0.0.1:54324
										</a>
									</>
								)}
							</AlertDescription>
						</Alert>
					</CardContent>
					<CardFooter>
						<button
							type="button"
							onClick={toggleMode}
							className="text-sm text-muted-foreground hover:underline"
						>
							Back to login
						</button>
					</CardFooter>
				</Card>
			</div>
		);
	}

	return (
		<div className="flex min-h-[calc(100vh-64px)] items-center justify-center p-4">
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle className="text-2xl">
						{mode === "login" ? "Welcome back" : "Create account"}
					</CardTitle>
					<CardDescription>
						{mode === "login"
							? "Sign in to your Second Brain."
							: "Create an account to get started."}
					</CardDescription>
				</CardHeader>
				<CardContent className="pb-0">
					<Button
						type="button"
						variant="outline"
						className="w-full"
						onClick={handleGoogleSignIn}
					>
						<svg
							className="mr-2 h-4 w-4"
							viewBox="0 0 24 24"
							aria-hidden="true"
						>
							<path
								d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
								fill="#4285F4"
							/>
							<path
								d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
								fill="#34A853"
							/>
							<path
								d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
								fill="#FBBC05"
							/>
							<path
								d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
								fill="#EA4335"
							/>
						</svg>
						Continue with Google
					</Button>
					<div className="relative my-4">
						<div className="absolute inset-0 flex items-center">
							<span className="w-full border-t" />
						</div>
						<div className="relative flex justify-center text-xs uppercase">
							<span className="bg-card px-2 text-muted-foreground">or</span>
						</div>
					</div>
				</CardContent>
				<form onSubmit={handleSubmit}>
					<CardContent className="space-y-4 pt-0">
						{error && (
							<Alert variant="destructive">
								<AlertDescription>{error}</AlertDescription>
							</Alert>
						)}
						{mode === "signup" && (
							<div className="space-y-2">
								<Label htmlFor={displayNameId}>Display name</Label>
								<Input
									id={displayNameId}
									type="text"
									placeholder="Your name"
									value={displayName}
									onChange={(e) => setDisplayName(e.target.value)}
									required
								/>
							</div>
						)}
						<div className="space-y-2">
							<Label htmlFor={emailId}>Email</Label>
							<Input
								id={emailId}
								type="email"
								placeholder="you@example.com"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor={passwordId}>Password</Label>
							<Input
								id={passwordId}
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
							/>
						</div>
						{mode === "signup" && (
							<div className="space-y-2">
								<Label htmlFor={confirmPasswordId}>Confirm password</Label>
								<Input
									id={confirmPasswordId}
									type="password"
									value={confirmPassword}
									onChange={(e) => setConfirmPassword(e.target.value)}
									required
								/>
							</div>
						)}
					</CardContent>
					<CardFooter className="flex flex-col gap-4">
						<Button type="submit" className="w-full" disabled={isSubmitting}>
							{isSubmitting
								? mode === "login"
									? "Logging in..."
									: "Creating account..."
								: mode === "login"
									? "Log in"
									: "Create account"}
						</Button>
						<div className="flex flex-col items-center gap-2">
							<button
								type="button"
								onClick={toggleMode}
								className="text-sm text-muted-foreground hover:underline"
							>
								{mode === "login"
									? "Don't have an account? Sign up"
									: "Already have an account? Log in"}
							</button>
							{mode === "login" && (
								<Link
									to="/forgot-password"
									className="text-sm text-muted-foreground hover:underline"
								>
									Forgot your password?
								</Link>
							)}
						</div>
					</CardFooter>
				</form>
			</Card>
		</div>
	);
}
