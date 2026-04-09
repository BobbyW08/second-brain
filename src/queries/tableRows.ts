import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Database, Json } from "@/types/database.types";
import { supabase } from "@/utils/supabase";

// Types for table rows
type TableRow = Database["public"]["Tables"]["table_rows"]["Row"];
type TableRowUpdate = Database["public"]["Tables"]["table_rows"]["Update"];

/**
 * Insert a new row into tablerows
 */
export function useCreateRow(tableId: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (input: {
			user_id: string;
			data: Record<string, unknown>;
			position?: number | null;
			notes?: Record<string, unknown> | null;
		}) => {
			await supabase
				.from("table_rows")
				.insert({
					table_id: tableId,
					user_id: input.user_id,
					data: input.data as unknown as Json,
					position: input.position ?? null,
					notes: (input.notes ?? null) as unknown as Json,
				})
				.throwOnError();
		},
		onMutate: async (input) => {
			await queryClient.cancelQueries({ queryKey: ["table-rows", tableId] });
			const previous = queryClient.getQueryData<TableRow[]>([
				"table-rows",
				tableId,
			]);
			const optimistic: TableRow = {
				id: `temp-${Date.now()}`,
				table_id: tableId,
				user_id: input.user_id,
				data: input.data as unknown as Json,
				position: input.position ?? null,
				notes: (input.notes ?? null) as unknown as Json,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			};
			queryClient.setQueryData<TableRow[]>(["table-rows", tableId], (old) => [
				...(old ?? []),
				optimistic,
			]);
			return { previous };
		},
		onError: (_err, _input, context) => {
			queryClient.setQueryData(["table-rows", tableId], context?.previous);
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: ["table-rows", tableId] });
		},
	});
}

/**
 * Update a row in tablerows
 */
export function useUpdateRow(tableId: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (input: {
			rowId: string;
			data?: Record<string, unknown>;
			position?: number | null;
			notes?: Record<string, unknown> | null;
		}) => {
			const updates: Partial<TableRowUpdate> = {};
			if (input.data !== undefined)
				updates.data = input.data as unknown as Json;
			if (input.position !== undefined) updates.position = input.position;
			if (input.notes !== undefined)
				updates.notes = input.notes as unknown as Json;

			await supabase
				.from("table_rows")
				.update(updates)
				.eq("id", input.rowId)
				.throwOnError();
		},
		onMutate: async (input) => {
			await queryClient.cancelQueries({ queryKey: ["table-rows", tableId] });
			const previous = queryClient.getQueryData<TableRow[]>([
				"table-rows",
				tableId,
			]);
			queryClient.setQueryData<TableRow[]>(["table-rows", tableId], (old) =>
				(old ?? []).map((row) =>
					row.id === input.rowId
						? {
								...row,
								data:
									input.data !== undefined
										? (input.data as unknown as Json)
										: row.data,
								position:
									input.position !== undefined ? input.position : row.position,
								notes:
									input.notes !== undefined
										? (input.notes as unknown as Json)
										: row.notes,
								updated_at: new Date().toISOString(),
							}
						: row,
				),
			);
			return { previous };
		},
		onError: (_err, _input, context) => {
			queryClient.setQueryData(["table-rows", tableId], context?.previous);
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: ["table-rows", tableId] });
		},
	});
}

/**
 * Delete a row from tablerows
 */
export function useDeleteRow(tableId: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (rowId: string) => {
			await supabase.from("table_rows").delete().eq("id", rowId).throwOnError();
		},
		onMutate: async (rowId) => {
			await queryClient.cancelQueries({ queryKey: ["table-rows", tableId] });
			const previous = queryClient.getQueryData<TableRow[]>([
				"table-rows",
				tableId,
			]);
			queryClient.setQueryData<TableRow[]>(["table-rows", tableId], (old) =>
				(old ?? []).filter((row) => row.id !== rowId),
			);
			return { previous };
		},
		onError: (_err, _rowId, context) => {
			queryClient.setQueryData(["table-rows", tableId], context?.previous);
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: ["table-rows", tableId] });
		},
	});
}

// ─── Table Row Details ─────────────────────────────────────────────────────────

export function useTableRow(rowId: string) {
	return useQuery({
		queryKey: ["table-row", rowId],
		enabled: !!rowId,
		queryFn: async () => {
			const { data } = await supabase
				.from("table_rows")
				.select("*")
				.eq("id", rowId)
				.single()
				.throwOnError();
			return data;
		},
	});
}

// ─── Reorder Rows ──────────────────────────────────────────────────────────────

export function useReorderTableRows(tableId: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (input: { rowIds: string[]; newPositions: number[] }) => {
			const { rowIds, newPositions } = input;
			// Update positions individually — upsert requires all required fields
			await Promise.all(
				rowIds.map((rowId, index) =>
					supabase
						.from("table_rows")
						.update({ position: newPositions[index] })
						.eq("id", rowId)
						.throwOnError(),
				),
			);
		},
		onMutate: async (input) => {
			const { rowIds, newPositions } = input;
			await queryClient.cancelQueries({ queryKey: ["table-rows", tableId] });
			const previous = queryClient.getQueryData<TableRow[]>([
				"table-rows",
				tableId,
			]);

			// Optimistically update positions
			queryClient.setQueryData<TableRow[]>(["table-rows", tableId], (old) => {
				if (!old) return old;
				const updatedRows = [...old];
				rowIds.forEach((rowId, index) => {
					const rowIndex = updatedRows.findIndex((r) => r.id === rowId);
					if (rowIndex !== -1) {
						updatedRows[rowIndex] = {
							...updatedRows[rowIndex],
							position: newPositions[index],
						};
					}
				});
				return updatedRows;
			});

			return { previous };
		},
		onError: (_err, _input, context) => {
			queryClient.setQueryData(["table-rows", tableId], context?.previous);
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: ["table-rows", tableId] });
		},
	});
}
