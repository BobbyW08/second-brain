import { EmptyState } from "@/components/shared/EmptyState";
import { FileText } from "lucide-react";

export default function PagesIndex() {
  return (
    <EmptyState 
      icon={FileText}
      title="Select a page"
      description="Choose a page from the sidebar or create one."
    />
  );
}