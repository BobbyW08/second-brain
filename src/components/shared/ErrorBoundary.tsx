import { Component, type ErrorInfo, type ReactNode } from "react";

interface ErrorBoundaryProps {
	children: ReactNode;
}

interface ErrorBoundaryState {
	hasError: boolean;
	error?: Error;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
	constructor(props: ErrorBoundaryProps) {
		super(props);
		this.state = { hasError: false };
	}

	static getDerivedStateFromError(error: Error): ErrorBoundaryState {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		console.error("ErrorBoundary caught an error:", error, errorInfo);
	}

	render() {
		if (this.state.hasError) {
			return (
				<div className="flex flex-col items-center justify-center h-full p-8 text-center">
					<h2 className="text-xl font-semibold text-foreground">
						Something went wrong
					</h2>
					<p className="mt-2 text-muted-foreground">
						Something went wrong loading this section.
					</p>
					<button
						type="button"
						className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
						onClick={() => window.location.reload()}
					>
						Try again
					</button>
				</div>
			);
		}

		return this.props.children;
	}
}

export { ErrorBoundary };
export default ErrorBoundary;
