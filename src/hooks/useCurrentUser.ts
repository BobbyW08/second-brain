import { useAuth } from "@/context/AuthContext";

export function useCurrentUser() {
	const { user } = useAuth();
	return {
		user,
		userId: user?.id ?? "",
	};
}
