import { Input } from "@/components/ui/input";

interface UrlCellProps {
	value: string;
	onChange: (value: string) => void;
	onKeyDown?: (e: React.KeyboardEvent) => void;
}

export const UrlCell = ({ value, onChange, onKeyDown }: UrlCellProps) => {
	return (
		<Input
			type="url"
			value={value || ""}
			onChange={(e) => onChange(e.target.value)}
			onKeyDown={onKeyDown}
			autoFocus
		/>
	);
};
