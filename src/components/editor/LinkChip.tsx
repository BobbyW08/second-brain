import { FileText, Folder, ListTodo, Table } from "lucide-react";
import { useEffect, useState } from "react";

interface LinkChipProps {
	data: {
		type: "page" | "task" | "folder" | "table_row";
		id: string;
		title: string;
	};
}

export function LinkChip({ data }: LinkChipProps) {
	const [title, setTitle] = useState(data.title);

	// Update title if it changes in the data
	useEffect(() => {
		setTitle(data.title);
	}, [data.title]);

	const getIcon = () => {
		switch (data.type) {
			case "page":
				return <FileText className="h-4 w-4" />;
			case "task":
				return <ListTodo className="h-4 w-4" />;
			case "folder":
				return <Folder className="h-4 w-4" />;
			case "table_row":
				return <Table className="h-4 w-4" />;
			default:
				return <FileText className="h-4 w-4" />;
		}
	};

	return (
		<span className="inline-flex items-center gap-1 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 rounded-md px-2 py-1 text-xs font-medium cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors">
			{getIcon()}
			<span className="truncate max-w-[120px]">{title}</span>
		</span>
	);
}
