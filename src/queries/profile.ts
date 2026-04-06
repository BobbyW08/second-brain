import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Database } from "@/types/database.types";
import { supabase } from "@/utils/supabase";

export function useProfile(userId: string) {
	return useQuery({
		queryKey: ["profile", userId],
		enabled: !!userId,
		queryFn: async () => {
			const { data } = await supabase
				.from("profiles")
				.select("*")
				.eq("id", userId)
				.single()
				.throwOnError();
			return data;
		},
	});
}

export function useUpdateProfile() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({
			userId,
			updates,
		}: {
			userId: string;
			updates: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
		}) => {
			await supabase
				.from("profiles")
				.update(updates)
				.eq("id", userId)
				.throwOnError();
		},
		onSuccess: (_data, { userId }) => {
			queryClient.invalidateQueries({ queryKey: ["profile", userId] });
		},
	});
}
