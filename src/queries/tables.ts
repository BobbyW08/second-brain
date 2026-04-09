import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Database, Json } from "@/types/database.types";
import { supabase } from "@/utils/supabase";

// Define valid column types as a type
export type TableColumnType =
	| "text"
	| "checkbox"
	| "select"
	| "date"
	| "number"
	| "url";

// Define column type for better type safety
export interface TableColumn {
	id: string;
	name: string;
	type: TableColumnType;
	options?: string[]; // For select type
	required?: boolean;
}

type TableSchema = Database["public"]["Tables"]["tables_schema"]["Row"];

// ─── Read ────────────────────────────────────────────────────────────────────

/**
 * Fetch all tables for the current user, ordered by created_at
 */
export function useTables(userId: string) {
	return useQuery({
		queryKey: ["tables", userId],
		enabled: !!userId,
		queryFn: async () => {
			const { data } = await supabase
				.from("tables_schema")
				.select("*")
				.eq("user_id", userId)
				.order("created_at")
				.throwOnError();
			return data ?? [];
		},
	});
}

/**
 * Fetch a single table schema by id
 */
export function useTableSchema(tableId: string) {
	return useQuery({
		queryKey: ["table-schema", tableId],
		enabled: !!tableId,
		queryFn: async () => {
			const { data } = await supabase
				.from("tables_schema")
				.select("*")
				.eq("id", tableId)
				.single()
				.throwOnError();
			return data;
		},
	});
}

/**
 * Fetch all rows for the given table, ordered by position
 */
export function useTableRows(tableId: string) {
	return useQuery({
		queryKey: ["table-rows", tableId],
		enabled: !!tableId,
		queryFn: async () => {
			const { data } = await supabase
				.from("table_rows")
				.select("*")
				.eq("table_id", tableId)
				.order("position")
				.throwOnError();
			return data ?? [];
		},
	});
}

// ─── Create ──────────────────────────────────────────────────────────────────

/**
 * Insert a new table into tables_schema
 */
export function useCreateTable(userId: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (input: {
			name: string;
			folder_id?: string | null;
			columns?: TableColumn[];
		}) => {
			const { data } = await supabase
				.from("tables_schema")
				.insert({
					user_id: userId,
					name: input.name,
					folder_id: input.folder_id ?? null,
					columns: (input.columns ?? []) as unknown as Json,
				})
				.select()
				.single()
				.throwOnError();
			return data;
		},
		onMutate: async (input) => {
			await queryClient.cancelQueries({ queryKey: ["tables", userId] });
			const previous = queryClient.getQueryData<TableSchema[]>([
				"tables",
				userId,
			]);
			const optimistic: TableSchema = {
				id: `temp-${Date.now()}`,
				user_id: userId,
				name: input.name,
				folder_id: input.folder_id ?? null,
				columns: (input.columns ?? []) as unknown as Json,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			};
			queryClient.setQueryData<TableSchema[]>(["tables", userId], (old) => [
				...(old ?? []),
				optimistic,
			]);
			return { previous };
		},
		onError: (_err, _input, context) => {
			queryClient.setQueryData(["tables", userId], context?.previous);
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: ["tables", userId] });
		},
	});
}

// ─── Update ──────────────────────────────────────────────────────────────────

/**
 * Update a table schema (name or columns) — used by 5-B schema builder
 */
export function useUpdateTable(userId: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (input: {
			tableId: string;
			updates: { name?: string; columns?: TableColumn[] };
		}) => {
			const dbUpdates: { name?: string; columns?: Json } = {};
			if (input.updates.name !== undefined) dbUpdates.name = input.updates.name;
			if (input.updates.columns !== undefined)
				dbUpdates.columns = input.updates.columns as unknown as Json;
			await supabase
				.from("tables_schema")
				.update(dbUpdates)
				.eq("id", input.tableId)
				.throwOnError();
		},
		onMutate: async ({ tableId, updates }) => {
			await queryClient.cancelQueries({ queryKey: ["tables", userId] });
			await queryClient.cancelQueries({ queryKey: ["table-schema", tableId] });
			const previous = queryClient.getQueryData<TableSchema[]>([
				"tables",
				userId,
			]);
			queryClient.setQueryData<TableSchema[]>(["tables", userId], (old) =>
				(old ?? []).map((t) =>
					t.id === tableId
						? {
								...t,
								name: updates.name ?? t.name,
								columns:
									updates.columns !== undefined
										? (updates.columns as unknown as Json)
										: t.columns,
								updated_at: new Date().toISOString(),
							}
						: t,
				),
			);
			return { previous };
		},
		onError: (_err, _input, context) => {
			queryClient.setQueryData(["tables", userId], context?.previous);
		},
		onSettled: (_data, _err, { tableId }) => {
			queryClient.invalidateQueries({ queryKey: ["tables", userId] });
			queryClient.invalidateQueries({ queryKey: ["table-schema", tableId] });
		},
	});
}

// ─── Delete ──────────────────────────────────────────────────────────────────

/**
 * Delete a table and all its rows (cascade via FK on table_rows)
 */
export function useDeleteTable(userId: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (tableId: string) => {
			await supabase
				.from("tables_schema")
				.delete()
				.eq("id", tableId)
				.throwOnError();
		},
		onMutate: async (tableId) => {
			await queryClient.cancelQueries({ queryKey: ["tables", userId] });
			const previous = queryClient.getQueryData<TableSchema[]>([
				"tables",
				userId,
			]);
			queryClient.setQueryData<TableSchema[]>(["tables", userId], (old) =>
				(old ?? []).filter((t) => t.id !== tableId),
			);
			return { previous };
		},
		onError: (_err, _tableId, context) => {
			queryClient.setQueryData(["tables", userId], context?.previous);
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: ["tables", userId] });
		},
	});
}
