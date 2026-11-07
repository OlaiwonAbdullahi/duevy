"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { DEFAULT_FILTERS, parseFilters, serializeFilters } from "./filters";
import type { TxnFilters } from "./types";

/**
 * The page's filters live in the URL, so they survive a refresh and can be
 * shared. Any change other than the page itself goes back to page 1.
 * Written with history.replaceState (which Next syncs into useSearchParams),
 * so a filter change costs no server round trip and adds no history entry.
 * `setFilters` is stable (it reads the live URL), so memoised controls
 * don't re-render when an unrelated filter changes.
 */
export function useTransactionFilters() {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const filters = useMemo(
    () => parseFilters(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  const setFilters = useCallback(
    (patch: Partial<TxnFilters>) => {
      const current = parseFilters(new URLSearchParams(window.location.search));
      const next: TxnFilters = { ...current, ...patch };
      if (!("page" in patch)) next.page = 1;
      const qs = serializeFilters(next).toString();
      const href = qs ? `${pathname}?${qs}` : pathname;
      if (href !== `${window.location.pathname}${window.location.search}`) {
        window.history.replaceState(window.history.state, "", href);
      }
    },
    [pathname],
  );

  // Every key is named so the spread in setFilters can't keep a stale one.
  const clearFilters = useCallback(
    () =>
      setFilters({
        ...DEFAULT_FILTERS,
        status: undefined,
        type: undefined,
        range: undefined,
        from: undefined,
        to: undefined,
      }),
    [setFilters],
  );

  return { filters, setFilters, clearFilters };
}
