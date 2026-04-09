import { Input } from "@/components/ui/input";

interface TextCellProps {
	value: string;
	onChange: (value: string) => void;
	onKeyDown?: (e: React.KeyboardEvent) => void;
}

export const TextCell = ({ value, onChange, onKeyDown }: TextCellProps) => {
	return (
		<Input
			type="text"
			value={value || ""}
			onChange={(e) => onChange(e.target.value)}
			onKeyDown={onKeyDown}
			autoFocus
		/>
	);
};
