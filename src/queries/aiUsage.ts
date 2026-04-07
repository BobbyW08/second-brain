import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/utils/supabase";

function monthRange(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();
  return { start, end };
}

export function useAIUsageThisMonth(userId: string) {
  const { start, end } = monthRange();
  return useQuery({
    queryKey: ["ai-usage", userId, start],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase
        .from("ai_usage")
        .select("tokens_used")
        .eq("user_id", userId)
        .gte("created_at", start)
        .lt("created_at", end)
        .throwOnError();
      const total = (data ?? []).reduce((sum, row) => sum + (row.tokens_used ?? 0), 0);
      return { totalTokens: total };
    },
  });
}

export function useLogAIUsage() {
  return useMutation({
    mutationFn: async ({
      userId,
      feature,
      tokensUsed,
    }: {
      userId: string;
      feature: string;
      tokensUsed: number;
    }) => {
      await supabase
        .from("ai_usage")
        .insert({
          user_id: userId,
          feature,
          tokens_used: tokensUsed,
        })
        .throwOnError();
    },
  });
}
