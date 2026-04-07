import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    mutations: {
      onError: (error) => {
        console.error("Mutation error:", error);
      },
    },
  },
  staleTime: 1000 * 60 * 5, // 5 minutes
});