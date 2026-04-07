import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Database } from "@/types/database.types";
import { supabase } from "@/utils/supabase";

// Types for table rows
type TableRow = Database["public"]["Tables"]["table_rows"]["Row"];
type TableRowInsert = Database["public"]["Tables"]["table_rows"]["Insert"];
type TableRowUpdate = Database["public"]["Tables"]["table_rows"]["Update"];

/**
 * Insert a new row into tablerows
 */
export function useCreateRow(tableId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      user_id: string;
      data: Record<string, any>;
      position?: number | null;
      notes?: Record<string, any> | null;
    }) => {
      await supabase
        .from("table_rows")
        .insert({
          table_id: tableId,
          user_id: input.user_id,
          data: input.data,
          position: input.position ?? null,
          notes: input.notes ?? null,
        })
        .throwOnError();
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: ["table-rows", tableId] });
      const previous = queryClient.getQueryData<TableRow[]>(["table-rows", tableId]);
      const optimistic: TableRow = {
        id: `temp-${Date.now()}`,
        table_id: tableId,
        user_id: input.user_id,
        data: input.data,
        position: input.position ?? null,
        notes: input.notes ?? null,
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
      data?: Record<string, any>;
      position?: number | null;
      notes?: Record<string, any> | null;
    }) => {
      const updates: Partial<TableRowUpdate> = {};
      if (input.data !== undefined) updates.data = input.data;
      if (input.position !== undefined) updates.position = input.position;
      if (input.notes !== undefined) updates.notes = input.notes;
      
      await supabase
        .from("table_rows")
        .update(updates)
        .eq("id", input.rowId)
        .throwOnError();
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: ["table-rows", tableId] });
      const previous = queryClient.getQueryData<TableRow[]>(["table-rows", tableId]);
      queryClient.setQueryData<TableRow[]>(["table-rows", tableId], (old) =>
        (old ?? []).map((row) =>
          row.id === input.rowId
            ? {
                ...row,
                data: input.data !== undefined ? input.data : row.data,
                position: input.position !== undefined ? input.position : row.position,
                notes: input.notes !== undefined ? input.notes : row.notes,
                updated_at: new Date().toISOString(),
              }
            : row
        )
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
      await supabase
        .from("table_rows")
        .delete()
        .eq("id", rowId)
        .throwOnError();
    },
    onMutate: async (rowId) => {
      await queryClient.cancelQueries({ queryKey: ["table-rows", tableId] });
      const previous = queryClient.getQueryData<TableRow[]>(["table-rows", tableId]);
      queryClient.setQueryData<TableRow[]>(["table-rows", tableId], (old) =>
        (old ?? []).filter((row) => row.id !== rowId)
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