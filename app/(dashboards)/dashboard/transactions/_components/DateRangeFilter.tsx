"use client";

import { memo, useState } from "react";
import type { DateRange } from "react-day-picker";
import { HugeiconsIcon } from "@hugeicons/react";
import { Calendar03Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DATE_PRESETS, dateLabel, parseYmd, toYmd } from "./filters";
import type { DatePreset, TxnFilters } from "./types";

type DatePatch = Pick<TxnFilters, "range" | "from" | "to">;

/**
 * Date filter: quick presets plus a custom range on the shared calendar.
 * The range is applied on "Apply", so half-picked ranges never hit the API;
 * a single picked day means just that day.
 */
export const DateRangeFilter = memo(function DateRangeFilter({
  range,
  from,
  to,
  onChange,
}: DatePatch & { onChange: (patch: DatePatch) => void }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DateRange | undefined>();
  const label = dateLabel({ q: "", direction: "all", page: 1, range, from, to });
  const active = !!label;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const openChange = (next: boolean) => {
    if (next) setDraft(range ? undefined : { from: parseYmd(from), to: parseYmd(to) });
    setOpen(next);
  };

  const apply = (patch: DatePatch) => {
    onChange(patch);
    setOpen(false);
  };

  const choosePreset = (value: DatePreset | undefined) =>
    apply({ range: value, from: undefined, to: undefined });

  const applyCustom = () => {
    const start = draft?.from ?? draft?.to;
    if (!start) return;
    const end = draft?.to ?? start;
    apply({ range: undefined, from: toYmd(start), to: toYmd(end) });
  };

  return (
    <Popover open={open} onOpenChange={openChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Date: ${label ?? "All time"}`}
          className={cn(
            "flex h-10 min-w-0 cursor-pointer items-center gap-2 rounded-full border bg-canvas px-4 text-[13px] font-medium whitespace-nowrap transition-colors outline-none hover:border-brand/50 focus-visible:border-brand data-[state=open]:border-brand",
            active ? "border-brand/50 text-ink" : "border-cloud text-ink-soft",
          )}
        >
          <HugeiconsIcon icon={Calendar03Icon} size={15} aria-hidden className="shrink-0" />
          <span className="truncate">{label ?? "All time"}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[min(20.5rem,calc(100vw-2rem))] p-0">
        <div role="group" aria-label="Quick ranges" className="grid grid-cols-2 gap-1.5 border-b border-cloud p-3">
          {[{ value: undefined, label: "All time" }, ...DATE_PRESETS].map((preset) => {
            const selected = preset.value === range && (preset.value !== undefined || !from && !to);
            return (
              <button
                key={preset.label}
                type="button"
                aria-pressed={selected}
                onClick={() => choosePreset(preset.value)}
                className={cn(
                  "flex h-9 cursor-pointer items-center justify-between gap-1 rounded-xl px-3 text-left text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40",
                  selected ? "bg-cloud text-brand" : "text-ink hover:bg-paper",
                )}
              >
                {preset.label}
                {selected && <HugeiconsIcon icon={Tick02Icon} size={14} aria-hidden />}
              </button>
            );
          })}
        </div>
        <div className="p-3">
          <p className="mb-1 px-1 text-[11px] font-semibold tracking-wide text-ink-soft uppercase">Custom range</p>
          <div className="flex justify-center">
            <Calendar
              mode="range"
              selected={draft}
              onSelect={setDraft}
              defaultMonth={draft?.from ?? today}
              disabled={{ after: today }}
              endMonth={today}
              classNames={{
                selected: "",
                range_start: "[&>button]:bg-brand [&>button]:text-white [&>button]:hover:bg-brand",
                range_end: "[&>button]:bg-brand [&>button]:text-white [&>button]:hover:bg-brand",
                range_middle: "[&>button]:bg-cloud [&>button]:text-brand [&>button]:rounded-lg",
              }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between gap-2">
            <p className="min-w-0 truncate text-xs text-ink-soft" aria-live="polite">
              {draft?.from
                ? dateLabel({
                    q: "",
                    direction: "all",
                    page: 1,
                    from: toYmd(draft.from),
                    to: toYmd(draft.to ?? draft.from),
                  })
                : "Pick a start and end day"}
            </p>
            <Button variant="brand" size="pill" disabled={!draft?.from} onClick={applyCustom}>
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
});
