import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Database } from "@/types/database.types";
import { supabase } from "@/utils/supabase";

export type Bucket = Database["public"]["Tables"]["buckets"]["Row"];
export type CreateBucketInput = {
	name: string;
	color: string;
	position: number;
};
export type UpdateBucketInput = { id: string; name?: string; color?: string };
export type ReorderBucketsInput = Array<{ id: string; position: number }>;

export const useBuckets = (userId: string) =>
	useQuery({
		queryKey: ["buckets", userId],
		queryFn: async () => {
			const { data } = await supabase
				.from("buckets")
				.select("*")
				.eq("user_id", userId)
				.order("position", { ascending: true })
				.throwOnError();
			return data ?? [];
		},
		enabled: !!userId,
	});

export const useCreateBucket = (userId: string) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (input: CreateBucketInput) => {
			const { data } = await supabase
				.from("buckets")
				.insert({ ...input, user_id: userId })
				.select()
				.single()
				.throwOnError();
			return data;
		},
		onMutate: async (input) => {
			await queryClient.cancelQueries({ queryKey: ["buckets", userId] });
			const previous = queryClient.getQueryData<Bucket[]>(["buckets", userId]);
			queryClient.setQueryData<Bucket[]>(["buckets", userId], (old = []) => [
				...old,
				{
					id: crypto.randomUUID(),
					user_id: userId,
					created_at: new Date().toISOString(),
					updated_at: new Date().toISOString(),
					...input,
				} as Bucket,
			]);
			return { previous };
		},
		onError: (_err, _input, context) => {
			if (context?.previous) {
				queryClient.setQueryData(["buckets", userId], context.previous);
			}
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: ["buckets", userId] });
		},
	});
};

export const useUpdateBucket = (userId: string) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (input: UpdateBucketInput) => {
			const { id, ...updates } = input;
			const { data } = await supabase
				.from("buckets")
				.update(updates)
				.eq("id", id)
				.select()
				.single()
				.throwOnError();
			return data;
		},
		onMutate: async (input) => {
			await queryClient.cancelQueries({ queryKey: ["buckets", userId] });
			const previous = queryClient.getQueryData<Bucket[]>(["buckets", userId]);
			queryClient.setQueryData<Bucket[]>(["buckets", userId], (old = []) =>
				old.map((b) => (b.id === input.id ? { ...b, ...input } : b)),
			);
			return { previous };
		},
		onError: (_err, _input, context) => {
			if (context?.previous) {
				queryClient.setQueryData(["buckets", userId], context.previous);
			}
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: ["buckets", userId] });
		},
	});
};

export const useDeleteBucket = (userId: string) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (bucketId: string) => {
			await supabase.from("buckets").delete().eq("id", bucketId).throwOnError();
		},
		onMutate: async (bucketId) => {
			await queryClient.cancelQueries({ queryKey: ["buckets", userId] });
			const previous = queryClient.getQueryData<Bucket[]>(["buckets", userId]);
			queryClient.setQueryData<Bucket[]>(["buckets", userId], (old = []) =>
				old.filter((b) => b.id !== bucketId),
			);
			return { previous };
		},
		onError: (_err, _input, context) => {
			if (context?.previous) {
				queryClient.setQueryData(["buckets", userId], context.previous);
			}
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: ["buckets", userId] });
		},
	});
};

export const useReorderBuckets = (userId: string) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (input: ReorderBucketsInput) => {
			await Promise.all(
				input.map(({ id, position }) =>
					supabase
						.from("buckets")
						.update({ position })
						.eq("id", id)
						.throwOnError(),
				),
			);
		},
		onMutate: async (input) => {
			await queryClient.cancelQueries({ queryKey: ["buckets", userId] });
			const previous = queryClient.getQueryData<Bucket[]>(["buckets", userId]);

			queryClient.setQueryData<Bucket[]>(["buckets", userId], (old = []) => {
				const updated = old.map((b) => {
					const match = input.find((item) => item.id === b.id);
					return match ? { ...b, position: match.position } : b;
				});
				return [...updated].sort(
					(a, b) => (a.position ?? 0) - (b.position ?? 0),
				);
			});

			return { previous };
		},
		onError: (_err, _input, context) => {
			if (context?.previous) {
				queryClient.setQueryData(["buckets", userId], context.previous);
			}
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: ["buckets", userId] });
		},
	});
};
