import { createFileRoute } from "@tanstack/react-router";
import { PageView } from "@/components/pages/PageView";

export const Route = createFileRoute("/_authenticated/journal/$pageId")({
	component: PageView,
});
