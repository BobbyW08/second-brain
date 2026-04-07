import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/utils/supabase";

export function useBacklinks(targetId: string) {
  return useQuery({
    queryKey: ["backlinks", targetId],
    enabled: !!targetId,
    queryFn: async () => {
      const { data } = await supabase
        .from("links")
        .select("id, source_id, source_type")
        .eq("target_id", targetId)
        .throwOnError();
      return data ?? [];
    },
  });
}

export function useCreateLink() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      sourceId,
      sourceType,
      targetId,
      targetType,
      userId,
    }: {
      sourceId: string;
      sourceType: string;
      targetId: string;
      targetType: string;
      userId: string;
    }) => {
      const { data } = await supabase
        .from("links")
        .insert({
          source_id: sourceId,
          source_type: sourceType,
          target_id: targetId,
          target_type: targetType,
          user_id: userId,
        })
        .select()
        .throwOnError();
      return data?.[0];
    },
    onSuccess: (_data, { targetId }) => {
      queryClient.invalidateQueries({ queryKey: ["backlinks", targetId] });
    },
  });
}

export function useDeleteLink() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ linkId, targetId: _targetId }: { linkId: string; targetId: string }) => {
      await supabase.from("links").delete().eq("id", linkId).throwOnError();
    },
    onMutate: async ({ linkId, targetId }) => {
      await queryClient.cancelQueries({ queryKey: ["backlinks", targetId] });
      const previous = queryClient.getQueryData(["backlinks", targetId]);
      queryClient.setQueryData(
        ["backlinks", targetId],
        (old: { id: string }[] | undefined) => (old ?? []).filter((l) => l.id !== linkId)
      );
      return { previous, targetId };
    },
    onError: (_err, _input, context) => {
      if (context) {
        queryClient.setQueryData(["backlinks", context.targetId], context.previous);
      }
    },
    onSettled: (_data, _err, { targetId }) => {
      queryClient.invalidateQueries({ queryKey: ["backlinks", targetId] });
    },
  });
}
