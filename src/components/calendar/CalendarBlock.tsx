import type { EventApi } from "@fullcalendar/core";

interface CalendarBlockProps {
	event: EventApi;
	timeText: string;
	isMirror: boolean;
}

export function CalendarBlock({ event, timeText }: CalendarBlockProps) {
	const source = event.extendedProps.source as "task" | "google";
	const borderColor =
		source === "task" ? "var(--color-task-event)" : "var(--color-google-event)";

	// Show time if duration >= 45 minutes
	const start = event.start;
	const end = event.end;
	const showTime =
		start && end && end.getTime() - start.getTime() >= 45 * 60 * 1000;

	return (
		<div
			style={{
				borderLeft: `3px solid ${borderColor}`,
				background: "hsl(var(--card))",
				borderRadius: "4px",
				padding: "3px 6px",
				height: "100%",
				width: "100%",
				overflow: "hidden",
				cursor: "pointer",
				display: "flex",
				flexDirection: "column",
				gap: "2px",
			}}
		>
			<div
				style={{
					fontSize: "13px",
					fontWeight: 400,
					color: "hsl(var(--foreground))",
					wordBreak: "break-word",
					lineHeight: "1.2",
				}}
			>
				{event.title}
			</div>
			{showTime && (
				<div
					style={{
						fontSize: "11px",
						fontFamily: "JetBrains Mono",
						color: "hsl(var(--muted-foreground))",
					}}
				>
					{timeText}
				</div>
			)}
		</div>
	);
}
