import { Sparkles } from "lucide-react";
import type { FC } from "react";

interface AIFocusButtonProps {
	onClick: () => void;
}

export const AIFocusButton: FC<AIFocusButtonProps> = ({ onClick }) => {
	return (
		<button
			type="button"
			onClick={onClick}
			className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-[#3A8FD4] hover:bg-[#2a2a30] rounded transition-colors"
			title="Rewrite with AI"
		>
			<Sparkles size={12} />
			AI
		</button>
	);
};
