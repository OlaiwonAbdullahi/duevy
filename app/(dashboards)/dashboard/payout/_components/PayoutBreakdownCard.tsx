"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Calendar03Icon,
  Cancel01Icon,
  PieChart02Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Matcher } from "react-day-picker";
import { EmptyState } from "../../_components/EmptyState";
import { ListSkeleton } from "../../_components/Skeleton";
import { nairaFromKobo } from "../../_components/format";
import { CATEGORY_ICON, CATEGORY_LABEL } from "../../dues/_components/data";
import { getPayoutBreakdown, type PayoutBreakdown } from "@/lib/api/payouts";

const PER_PAGE = 10;

const EMPTY_TOTALS: PayoutBreakdown["totals"] = {
  collected: 0,
  fees: 0,
  net: 0,
  paidCount: 0,
};

/** Local-safe yyyy-mm-dd, so picking a day never shifts across a timezone. */
function toISODate(date: Date) {
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${m}-${d}`;
}

/** A shadcn calendar in a popover, standing in for a native date input. Value is a yyyy-mm-dd string (or ""). */
function FilterDateButton({
  label,
  value,
  onChange,
  min,
  max,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  /** yyyy-mm-dd bounds — disables dates outside them. */
  min?: string;
  max?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = value ? new Date(`${value}T00:00:00`) : undefined;

  const disabled: Matcher[] = [];
  if (min) disabled.push({ before: new Date(`${min}T00:00:00`) });
  if (max) disabled.push({ after: new Date(`${max}T00:00:00`) });

  return (
    <div>
      <Label className="mb-1.5 block text-xs font-medium text-ink-soft">
        {label}
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex h-11 items-center gap-2 rounded-2xl border border-cloud bg-canvas px-4 text-left text-sm outline-none transition-colors duration-300 hover:border-brand/50 focus-visible:border-brand data-[state=open]:border-brand cursor-pointer"
          >
            <HugeiconsIcon
              icon={Calendar03Icon}
              size={16}
              className="shrink-0 text-ink-soft"
            />
            <span className={selected ? "text-ink" : "text-ink-soft"}>
              {selected
                ? selected.toLocaleDateString("en-NG", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : "Any"}
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-3">
          <Calendar
            mode="single"
            selected={selected}
            defaultMonth={selected}
            disabled={disabled.length ? disabled : undefined}
            onSelect={(date) => {
              onChange(date ? toISODate(date) : "");
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

/** Per-due breakdown of everything collected — same DuePayment source of truth as the payout summary. */
export function PayoutBreakdownCard({ spaceId }: { spaceId: string | undefined }) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [totals, setTotals] = useState(EMPTY_TOTALS);
  const [byDue, setByDue] = useState<PayoutBreakdown["byDue"]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!spaceId) return;
    let cancelled = false;
    setLoading(true);
    getPayoutBreakdown(spaceId, {
      from: from || undefined,
      to: to || undefined,
      page,
      perPage: PER_PAGE,
    })
      .then(({ data, meta }) => {
        if (cancelled) return;
        setTotals(data.totals);
        setByDue(data.byDue);
        setTotalPages(meta?.totalPages ?? 1);
      })
      .catch(() => {
        if (!cancelled) toast.error("Couldn't load the payout breakdown.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [spaceId, from, to, page]);

  const hasFilter = from !== "" || to !== "";

  const clearFilter = () => {
    setFrom("");
    setTo("");
    setPage(1);
  };

  return (
    <section className="rounded-3xl border border-cloud bg-canvas p-4 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-ink">
            Payout breakdown
          </h2>
          <p className="mt-0.5 text-xs text-ink-soft">
            Where your payout total comes from, due by due.
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <FilterDateButton
            label="From"
            value={from}
            max={to || undefined}
            onChange={(next) => {
              setFrom(next);
              setPage(1);
            }}
          />
          <FilterDateButton
            label="To"
            value={to}
            min={from || undefined}
            onChange={(next) => {
              setTo(next);
              setPage(1);
            }}
          />
          {hasFilter && (
            <Button variant="brand-outline" size="pill" onClick={clearFilter}>
              <HugeiconsIcon icon={Cancel01Icon} size={14} />
              Clear
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="mt-5">
          <ListSkeleton rows={4} />
        </div>
      ) : (
        <>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-cloud bg-paper/60 p-4">
              <p className="text-xs font-medium text-ink-soft">Collected</p>
              <p className="mt-1 text-lg font-semibold tracking-tight text-ink">
                {nairaFromKobo(totals.collected)}
              </p>
            </div>
            <div className="rounded-2xl border border-cloud bg-paper/60 p-4">
              <p className="text-xs font-medium text-ink-soft">Fees</p>
              <p className="mt-1 text-lg font-semibold tracking-tight text-ink">
                {nairaFromKobo(totals.fees)}
              </p>
            </div>
            <div className="rounded-2xl border border-cloud bg-paper/60 p-4">
              <p className="text-xs font-medium text-ink-soft">Net</p>
              <p className="mt-1 text-lg font-semibold tracking-tight text-brand">
                {nairaFromKobo(totals.net)}
              </p>
            </div>
            <div className="rounded-2xl border border-cloud bg-paper/60 p-4">
              <p className="text-xs font-medium text-ink-soft">Paid</p>
              <p className="mt-1 text-lg font-semibold tracking-tight text-ink">
                {totals.paidCount}
              </p>
            </div>
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border border-cloud">
            {byDue.length === 0 ? (
              <EmptyState
                icon={PieChart02Icon}
                title="Nothing collected yet"
                description={
                  hasFilter
                    ? "No collections fall in this date range."
                    : "Once students start paying, each due's contribution shows up here."
                }
                action={
                  hasFilter && (
                    <Button variant="brand-outline" size="pill" onClick={clearFilter}>
                      Clear filters
                    </Button>
                  )
                }
              />
            ) : (
              <>
                <div className="hidden grid-cols-[1.4fr_0.6fr_0.8fr_0.8fr_0.8fr] gap-4 bg-paper px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-ink-soft md:grid">
                  <span>Due</span>
                  <span className="text-right">Paid</span>
                  <span className="text-right">Collected</span>
                  <span className="text-right">Fees</span>
                  <span className="text-right">Net</span>
                </div>
                <ul className="divide-y divide-cloud">
                  {byDue.map((due) => (
                    <li
                      key={due.dueId}
                      className="grid gap-3 px-4 py-3.5 transition-colors duration-300 hover:bg-paper/70 md:grid-cols-[1.4fr_0.6fr_0.8fr_0.8fr_0.8fr] md:items-center md:gap-4"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-cloud text-brand">
                          <HugeiconsIcon icon={CATEGORY_ICON[due.category]} size={16} />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-ink">
                            {due.title}
                          </p>
                          <p className="truncate text-xs text-ink-soft">
                            {CATEGORY_LABEL[due.category]}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-ink-soft md:text-right">
                        <span className="font-semibold uppercase tracking-wide text-[11px] text-ink-soft md:hidden">
                          Paid:{" "}
                        </span>
                        {due.paidCount}
                      </p>
                      <p className="text-sm font-medium text-ink md:text-right">
                        {nairaFromKobo(due.collected)}
                      </p>
                      <p className="text-sm text-ink-soft md:text-right">
                        {nairaFromKobo(due.fees)}
                      </p>
                      <p className="text-sm font-semibold text-brand md:text-right">
                        {nairaFromKobo(due.net)}
                      </p>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          <p className="mt-3 text-xs text-ink-soft">
            Fees shown are the 3% processing charge, already paid by the
            student on top of the due amount.
          </p>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-xs text-ink-soft">
                Page <span className="font-semibold text-ink">{page}</span> of{" "}
                {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="brand-outline"
                  size="pill"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <HugeiconsIcon icon={ArrowLeft01Icon} size={14} />
                  Prev
                </Button>
                <Button
                  variant="brand-outline"
                  size="pill"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                  <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
