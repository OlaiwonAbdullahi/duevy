"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  Notification03Icon,
  Download04Icon,
  MoneySend01Icon,
  UserAdd01Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { fromKobo, naira } from "../../_components/format";
import { relativeDue } from "../../dues/_components/data";
import { InlineStat } from "../../_components/overview/OverviewUI";
import { timeAgo } from "../../_components/notifications-data";
import { useRepSpace } from "../../_components/use-rep-space";
import { getAllCollections, remindUnpaid, reassignDue } from "@/lib/api/rep";
import { useSpaceReps } from "@/lib/api/queries";
import { ApiError } from "@/lib/api/errors";
import { CollectionSummary } from "../../collections/_components/CollectionSummary";
import { CollectionTable } from "../../collections/_components/CollectionTable";
import {
  downloadCollectionPdf,
  type CollectionExportScope,
} from "../../collections/_components/pdf";
import type { CollectionGuest } from "@/lib/api/types";
import { GuestPayCard } from "./GuestPayCard";
import type {
  CollectionStudent,
  CollectionTotals,
  StatusFilter,
} from "../../collections/_components/types";
import type {
  CollectionStudent as ApiCollectionStudent,
  CollectionTotals as ApiCollectionTotals,
  SpaceRep,
} from "@/lib/api/types";
import type { RepDue } from "./types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const EXPORT_OPTIONS: {
  scope: CollectionExportScope;
  label: string;
  hint: string;
}[] = [
  { scope: "paid", label: "Paid", hint: "Students who have paid" },
  { scope: "unpaid", label: "Yet to pay", hint: "Students still owing" },
  { scope: "all", label: "Everyone", hint: "The full roster" },
];

function adaptStudent(api: ApiCollectionStudent): CollectionStudent {
  return {
    id: api.id,
    name: api.name,
    matricNo: api.matricNo,
    level: api.level ?? "",
    email: api.email,
    status: api.status,
    paidAt: api.paidAt ? timeAgo(api.paidAt) : undefined,
    paidOn: api.paidAt ?? undefined,
    reference: api.reference ?? undefined,
  };
}

const EMPTY_TOTALS: CollectionTotals = {
  paid: 0,
  unpaid: 0,
  collected: 0,
  expected: 0,
  rate: 0,
};

function adaptTotals(api: ApiCollectionTotals): CollectionTotals {
  return {
    paid: api.paid,
    unpaid: api.unpaid,
    collected: fromKobo(api.collected),
    expected: fromKobo(api.expected),
    rate: Math.round(api.rate * 100),
  };
}

/** Per-due collections roster (who's paid / unpaid) shown inline from a due card. */
export function DueCollections({
  spaceId,
  due: initialDue,
  onBack,
}: {
  spaceId: string;
  due: RepDue;
  onBack: () => void;
}) {
  const repSpace = useRepSpace();
  const isLead = repSpace?.membership !== "co";

  const [due, setDue] = useState(initialDue);
  const [students, setStudents] = useState<CollectionStudent[]>([]);
  const [guests, setGuests] = useState<CollectionGuest[]>([]);
  const [totals, setTotals] = useState<CollectionTotals>(EMPTY_TOTALS);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");
  const [sendingReminders, setSendingReminders] = useState(false);
  const reps: SpaceRep[] = useSpaceReps(spaceId).data ?? [];
  const [reassigning, setReassigning] = useState(false);
  const [exportOpen, setExportOpen] = useState<"mobile" | "desktop" | null>(null);
  const [exporting, setExporting] = useState(false);

  const assignedRep = reps.find((r) => r.id === due.assignedRepId);
  const coReps = reps.filter((r) => r.role === "co");
  // The dropdown must always be able to display the current assignee, even
  // though a lead can only ever be *reassigned to* a co-rep (never the lead
  // themself, per the backend) — a due assigned at creation defaults to its
  // creator, who may well be the lead.
  const selectableReps =
    assignedRep && assignedRep.role === "lead" ? [assignedRep, ...coReps] : coReps;


  const reassign = async (userId: string) => {
    if (!userId || userId === due.assignedRepId) return;
    setReassigning(true);
    try {
      const updated = await reassignDue(spaceId, due.id, userId);
      setDue((prev) => ({ ...prev, assignedRepId: updated.assignedRepId }));
      const target = reps.find((r) => r.id === userId);
      toast.success("Due reassigned", { description: target?.name ?? "Reassigned" });
    } catch {
      toast.error("Couldn't reassign this due.");
    } finally {
      setReassigning(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        // The roster is paginated server-side; load every page so the tab
        // counts, search and PDF export cover the whole class.
        const data = await getAllCollections(spaceId, due.id);
        if (cancelled) return;
        setStudents((data.students ?? []).map(adaptStudent));
        setGuests(data.guests ?? []);
        setTotals(data.totals ? adaptTotals(data.totals) : EMPTY_TOTALS);
      } catch (err) {
        if (cancelled) return;
        // No roster yet (e.g. a fresh/draft due) can 404 — show it as empty.
        if (err instanceof ApiError && err.status === 404) {
          setStudents([]);
          setTotals(EMPTY_TOTALS);
        } else {
          toast.error("Couldn't load the collection roster.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [spaceId, due.id]);

  const queryMatched = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q === "") return students;
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.matricNo ?? "").toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q),
    );
  }, [query, students]);

  const tabCounts = useMemo(
    () => ({
      all: queryMatched.length,
      paid: queryMatched.filter((s) => s.status === "paid").length,
      unpaid: queryMatched.filter((s) => s.status === "unpaid").length,
    }),
    [queryMatched],
  );

  const filteredStudents = useMemo(
    () =>
      filter === "all"
        ? queryMatched
        : queryMatched.filter((s) => s.status === filter),
    [filter, queryMatched],
  );

  // Exports cover the whole roster for the chosen status, not just the
  // rows the current tab/search happens to show.
  const paidTotal = students.filter((s) => s.status === "paid").length;
  const exportCounts = {
    all: students.length,
    paid: paidTotal,
    unpaid: students.length - paidTotal,
  };

  const handleExport = async (scope: CollectionExportScope) => {
    const rows =
      scope === "all" ? students : students.filter((s) => s.status === scope);
    if (rows.length === 0) {
      toast.info("Nothing to export", {
        description:
          scope === "paid" ? "No one has paid yet." : "Everyone has paid.",
      });
      return;
    }
    setExportOpen(null);
    setExporting(true);
    try {
      const safeTitle = due.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      await downloadCollectionPdf({
        filename: `${safeTitle}-${scope === "unpaid" ? "yet-to-pay" : scope}.pdf`,
        dueTitle: due.title,
        spaceName: repSpace?.name,
        amount: due.amount,
        dueDate: due.dueDate,
        scope,
        rows,
      });
      toast.success("PDF downloaded", {
        description: `${rows.length} student${rows.length === 1 ? "" : "s"} exported.`,
      });
    } catch {
      toast.error("Couldn't generate the PDF.");
    } finally {
      setExporting(false);
    }
  };

  const exportMenu = (
    <PopoverContent align="end" className="w-60 p-1.5">
      <p className="px-2.5 pt-1.5 pb-1 text-[11px] font-semibold tracking-wide text-ink-soft uppercase">
        Export as PDF
      </p>
      {EXPORT_OPTIONS.map((o) => (
        <button
          key={o.scope}
          type="button"
          onClick={() => handleExport(o.scope)}
          disabled={exportCounts[o.scope] === 0}
          className="flex w-full items-center justify-between gap-3 rounded-xl px-2.5 py-2 text-left transition-colors hover:bg-paper disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
        >
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-ink">{o.label}</span>
            <span className="block text-xs text-ink-soft">{o.hint}</span>
          </span>
          <span className="shrink-0 rounded-full bg-cloud px-2 py-0.5 text-xs font-semibold text-ink">
            {exportCounts[o.scope]}
          </span>
        </button>
      ))}
    </PopoverContent>
  );

  const handleReminders = async () => {
    if (totals.unpaid === 0) {
      toast.info("Everyone has paid", {
        description: `No reminders needed for ${due.title}.`,
      });
      return;
    }
    setSendingReminders(true);
    try {
      await remindUnpaid(spaceId, due.id);
      toast.success("Reminders sent", {
        description: `${totals.unpaid} unpaid student${
          totals.unpaid === 1 ? "" : "s"
        } notified about ${due.title}.`,
      });
    } catch {
      toast.error("Couldn't send reminders. They may be rate-limited (once per day).");
    } finally {
      setSendingReminders(false);
    }
  };

  return (
    <div>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            aria-label="Back to dues"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-cloud text-ink-soft transition-colors duration-300 hover:bg-paper hover:text-ink cursor-pointer"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-semibold tracking-tight text-ink sm:text-2xl">
              {due.title}
            </h1>
            <p className="mt-0.5 text-[13px] text-ink-soft max-sm:hidden">
              Who&apos;s paid and who still owes.
            </p>
            <p className="mt-0.5 truncate text-xs text-ink-soft sm:hidden">
              {naira(due.amount)} per student · {relativeDue(due.dueDate).text}
            </p>
          </div>
          {/* Phones: export sits in the header; the other actions are on the card. */}
          <Popover
            open={exportOpen === "mobile"}
            onOpenChange={(o) => setExportOpen(o ? "mobile" : null)}
          >
            <PopoverTrigger asChild>
              <button
                type="button"
                disabled={students.length === 0 || exporting}
                aria-label="Export list as PDF"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-cloud text-ink transition-colors active:bg-paper disabled:opacity-40 cursor-pointer sm:hidden"
              >
                {exporting ? (
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-ink/20 border-t-ink" />
                ) : (
                  <HugeiconsIcon icon={Download04Icon} size={17} />
                )}
              </button>
            </PopoverTrigger>
            {exportMenu}
          </Popover>
        </div>
        <div className="hidden flex-wrap items-center gap-2 sm:flex">
          {/* Withdrawals are space-wide and lead-only; no per-due payouts. */}
          {isLead && (
            <Button variant="brand" size="pill" asChild>
              <Link href="/dashboard/payout">
                <HugeiconsIcon icon={MoneySend01Icon} size={15} />
                Withdraw funds
              </Link>
            </Button>
          )}
          <Button
            variant="brand-outline"
            size="pill"
            onClick={handleReminders}
            disabled={sendingReminders}
          >
            {sendingReminders ? (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-brand/30 border-t-brand" />
            ) : (
              <HugeiconsIcon icon={Notification03Icon} size={15} />
            )}
            {sendingReminders ? "Sending…" : "Remind unpaid"}
          </Button>
          <Popover
            open={exportOpen === "desktop"}
            onOpenChange={(o) => setExportOpen(o ? "desktop" : null)}
          >
            <PopoverTrigger asChild>
              <Button
                variant="brand-outline"
                size="pill"
                disabled={students.length === 0 || exporting}
              >
                {exporting ? (
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-brand/30 border-t-brand" />
                ) : (
                  <HugeiconsIcon icon={Download04Icon} size={15} />
                )}
                {exporting ? "Exporting…" : "Export PDF"}
              </Button>
            </PopoverTrigger>
            {exportMenu}
          </Popover>
        </div>
      </header>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-ink-soft">
        <HugeiconsIcon icon={UserAdd01Icon} size={14} />
        {isLead && coReps.length > 0 ? (
          <>
            <span>Assigned to</span>
            <Select
              value={due.assignedRepId ?? ""}
              onValueChange={reassign}
              disabled={reassigning}
            >
              <SelectTrigger
                aria-label="Assigned to"
                className="h-8 w-auto gap-1.5 py-1 pr-2.5 pl-3 text-xs font-semibold"
              >
                <SelectValue placeholder="Unassigned" />
              </SelectTrigger>
              <SelectContent>
                {selectableReps.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name}
                    {r.role === "lead" ? " (you)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        ) : (
          <span>
            Assigned to{" "}
            <span className="font-semibold text-ink">
              {assignedRep?.name ?? "no one yet"}
            </span>
          </span>
        )}
      </div>

      {loading ? (
        <div className="mt-6 space-y-3">
          <div className="h-28 animate-pulse rounded-3xl border border-cloud bg-canvas" />
          <div className="h-64 animate-pulse rounded-3xl border border-cloud bg-canvas" />
        </div>
      ) : (
        <>
          {/* Phones: the due's position as an inline headline figure. */}
          <div className="mt-4 sm:hidden">
            <InlineStat
              label="Collected"
              value={naira(totals.collected)}
              rate={totals.rate}
              caption={`${totals.paid} of ${students.length} students paid · ${naira(
                totals.expected - totals.collected,
              )} to go`}
            >
              <div className="flex gap-2.5">
                <Button
                  variant="brand"
                  size="pill-lg"
                  onClick={handleReminders}
                  disabled={sendingReminders}
                  className="flex-1"
                >
                  {sendingReminders ? (
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  ) : (
                    <HugeiconsIcon icon={Notification03Icon} size={16} />
                  )}
                  {sendingReminders ? "Sending…" : "Remind unpaid"}
                </Button>
                {isLead && (
                  <Button variant="brand-outline" size="pill-lg" asChild className="flex-1">
                    <Link href="/dashboard/payout">
                      <HugeiconsIcon icon={MoneySend01Icon} size={16} />
                      Withdraw
                    </Link>
                  </Button>
                )}
              </div>
            </InlineStat>
          </div>

          <div className="mt-6 hidden sm:block">
            <CollectionSummary totals={totals} trackedCount={students.length} />
          </div>
          {(due.allowGuests || guests.length > 0) && <GuestPayCard due={due} guests={guests} />}
          <CollectionTable
            due={due}
            students={filteredStudents}
            totalCount={students.length}
            tabCounts={tabCounts}
            filter={filter}
            query={query}
            onFilterChange={setFilter}
            onQueryChange={setQuery}
          />
        </>
      )}

    </div>
  );
}
