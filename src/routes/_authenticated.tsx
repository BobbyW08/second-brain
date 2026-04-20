import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "../components/layout/AppLayout";
import { requireAuth } from "../utils/auth";

export const Route = createFileRoute("/_authenticated")({
	beforeLoad: () => requireAuth(),
	component: AppLayout,
});
