import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "./errors";

/** Errors a retry can't fix: auth (the client already refreshed once), permissions, missing rows, bad input. */
function isPermanent(error: unknown) {
  return error instanceof ApiError && error.status >= 400 && error.status < 500;
}

function makeClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Revisiting a page shows the cached data instantly; anything older
        // than this refetches in the background.
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        retry: (count, error) => !isPermanent(error) && count < 1,
      },
    },
  });
}

let client: QueryClient | null = null;

/**
 * One cache per browser session, shared by every area that mounts a
 * QueryProvider (dashboards, onboarding, join links), so moving between them
 * keeps what's already loaded. The server gets a fresh one per render so
 * nothing leaks between requests.
 */
export function getQueryClient() {
  if (typeof window === "undefined") return makeClient();
  client ??= makeClient();
  return client;
}

/** Called on logout so the next account on this device never sees the last one's data. */
export function clearQueryCache() {
  client?.clear();
}
