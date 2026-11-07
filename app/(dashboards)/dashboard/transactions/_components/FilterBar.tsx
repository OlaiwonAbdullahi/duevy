"use client";

import { memo, useCallback } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { FilterRemoveIcon } from "@hugeicons/core-free-icons";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { STATUS_META, TXN_META, TXN_STATUSES, TXN_TYPES } from "./data";
import { DIRECTIONS, hasActiveFilters } from "./filters";
import { SearchField } from "./SearchField";
import { DateRangeFilter } from "./DateRangeFilter";
import type { TxnFilters, TxnStatus, TxnType } from "./types";

const ALL = "all";

/** Direction, search, status, type and date — all written to the URL via `onChange`. */
export const FilterBar = memo(function FilterBar({
  filters,
  onChange,
  onClear,
}: {
  filters: TxnFilters;
  onChange: (patch: Partial<TxnFilters>) => void;
  onClear: () => void;
}) {
  const commitSearch = useCallback((q: string) => onChange({ q }), [onChange]);
  const changeDates = useCallback((patch: Pick<TxnFilters, "range" | "from" | "to">) => onChange(patch), [onChange]);
  const active = hasActiveFilters(filters);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div
          role="group"
          aria-label="Direction"
          className="flex items-center rounded-full border border-cloud bg-paper p-1"
        >
          {DIRECTIONS.map((d) => {
            const selected = filters.direction === d.value;
            return (
              <button
                key={d.value}
                type="button"
                aria-pressed={selected}
                onClick={() => onChange({ direction: d.value })}
                className={cn(
                  "flex-1 cursor-pointer rounded-full px-4 py-2 text-[13px] font-semibold transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 md:flex-none md:py-1.5",
                  selected ? "bg-brand text-white" : "text-ink-soft hover:text-ink",
                )}
              >
                {d.label}
              </button>
            );
          })}
        </div>
        <SearchField value={filters.q} onCommit={commitSearch} />
      </div>

      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
        <Select
          value={filters.status ?? ALL}
          onValueChange={(v) => onChange({ status: v === ALL ? undefined : (v as TxnStatus) })}
        >
          <SelectTrigger aria-label="Status" className={cn(filters.status && "border-brand/50")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Any status</SelectItem>
            {TXN_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_META[s].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.type ?? ALL}
          onValueChange={(v) => onChange({ type: v === ALL ? undefined : (v as TxnType) })}
        >
          <SelectTrigger aria-label="Type" className={cn(filters.type && "border-brand/50")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All types</SelectItem>
            {TXN_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {TXN_META[t].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="col-span-2 flex min-w-0 items-center gap-2 sm:contents">
          <div className="min-w-0 flex-1 sm:flex-none [&>button]:w-full sm:[&>button]:w-auto">
            <DateRangeFilter range={filters.range} from={filters.from} to={filters.to} onChange={changeDates} />
          </div>
          {active && (
            <button
              type="button"
              onClick={onClear}
              className="inline-flex h-10 shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold text-ink-soft transition-colors hover:bg-paper hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
            >
              <HugeiconsIcon icon={FilterRemoveIcon} size={15} aria-hidden />
              Clear filters
            </button>
          )}
        </div>
      </div>
    </div>
  );
});
