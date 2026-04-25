import { QueryClient } from "@tanstack/react-query";
import { appConfig } from "@/config/appConfig";

const MS = appConfig.CACHE_MINUTES * 60 * 1000;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: MS,
      gcTime: MS * 2,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
