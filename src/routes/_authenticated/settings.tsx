import { createFileRoute } from "@tanstack/react-router";
import { SettingsPage } from "../../components/settings/SettingsPage";

export const Route = createFileRoute("/_authenticated/settings")({
	head: () => ({
		meta: [{ title: "Settings | Second Brain" }],
	}),
	component: SettingsPage,
});
