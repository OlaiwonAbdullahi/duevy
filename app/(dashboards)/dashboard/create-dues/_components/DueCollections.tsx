"use client";

import { useEffect, useMemo, useState } from "react";
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
import { fromKobo } from "../../_components/format";
import { timeAgo } from "../../_components/notifications-data";
import { useAuth } from "@/lib/auth/auth-context";
import { useRepSpace } from "../../_components/use-rep-space";
import { getCollections, remindUnpaid, listReps, reassignDue } from "@/lib/api/rep";
import { ApiError } from "@/lib/api/errors";
import { CollectionSummary } from "../../collections/_components/CollectionSummary";
import { CollectionTable } from "../../collections/_components/CollectionTable";
import { downloadCollectionCsv } from "../../collections/_components/csv";
import { DuePayoutModal } from "./DuePayoutModal";
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

function adaptStudent(api: ApiCollectionStudent): CollectionStudent {
  return {
    id: api.id,
    name: api.name,
    matricNo: api.matricNo,
    level: api.level ?? "",
    email: api.email,
    status: api.status,
    paidAt: api.paidAt ? timeAgo(api.paidAt) : undefined,
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
  const { user } = useAuth();
  const repSpace = useRepSpace();
  const isLead = repSpace?.membership !== "co";

  const [due, setDue] = useState(initialDue);
  const [students, setStudents] = useState<CollectionStudent[]>([]);
  const [totals, setTotals] = useState<CollectionTotals>(EMPTY_TOTALS);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");
  const [sendingReminders, setSendingReminders] = useState(false);
  const [reps, setReps] = useState<SpaceRep[]>([]);
  const [reassigning, setReassigning] = useState(false);
  const [payoutOpen, setPayoutOpen] = useState(false);

  const assignedRep = reps.find((r) => r.id === due.assignedRepId);
  const coReps = reps.filter((r) => r.role === "co");
  // The dropdown must always be able to display the current assignee, even
  // though a lead can only ever be *reassigned to* a co-rep (never the lead
  // themself, per the backend) — a due assigned at creation defaults to its
  // creator, who may well be the lead.
  const selectableReps =
    assignedRep && assignedRep.role === "lead" ? [assignedRep, ...coReps] : coReps;
  const canRequestPayout = isLead || due.assignedRepId === user?.id;

  useEffect(() => {
    listReps(spaceId)
      .then(setReps)
      .catch(() => {});
  }, [spaceId]);

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
      console.log(`[collections] REQUEST ${due.title}`, { spaceId, dueId: due.id });
      try {
        const res = await getCollections(spaceId, due.id);
        console.log(`[collections] SUCCESS ${due.title}`, {
          totals: res.data?.totals,
          students: res.data?.students,
          meta: res.meta,
          raw: res,
        });
        if (cancelled) return;
        const { data } = res;
        setStudents((data.students ?? []).map(adaptStudent));
        setTotals(data.totals ? adaptTotals(data.totals) : EMPTY_TOTALS);
      } catch (err) {
        console.error(`[collections] FAILED ${due.title}`, {
          status: err instanceof ApiError ? err.status : undefined,
          code: err instanceof ApiError ? err.code : undefined,
          message: err instanceof Error ? err.message : String(err),
          err,
        });
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
        s.matricNo.toLowerCase().includes(q) ||
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

  const handleDownload = () => {
    const safeTitle = due.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    downloadCollectionCsv(`${safeTitle}-${filter}.csv`, filteredStudents);
    toast.success("List downloaded", {
      description: `${filteredStudents.length} student${
        filteredStudents.length === 1 ? "" : "s"
      } exported.`,
    });
  };

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
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            aria-label="Back to dues"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-cloud text-ink-soft transition-colors duration-300 hover:bg-paper hover:text-ink cursor-pointer"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
          </button>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold tracking-tight text-ink sm:text-2xl">
              {due.title}
            </h1>
            <p className="mt-0.5 text-[13px] text-ink-soft">
              Who&apos;s paid and who still owes.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canRequestPayout && (
            <Button variant="brand" size="pill" onClick={() => setPayoutOpen(true)}>
              <HugeiconsIcon icon={MoneySend01Icon} size={15} />
              Request payout
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
          <Button
            variant="brand-outline"
            size="pill"
            onClick={handleDownload}
            disabled={filteredStudents.length === 0}
          >
            <HugeiconsIcon icon={Download04Icon} size={15} />
            Export
          </Button>
        </div>
      </header>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-ink-soft">
        <HugeiconsIcon icon={UserAdd01Icon} size={14} />
        {isLead && coReps.length > 0 ? (
          <>
            <span>Assigned to</span>
            <select
              value={due.assignedRepId ?? ""}
              onChange={(e) => reassign(e.target.value)}
              disabled={reassigning}
              className="rounded-full border border-cloud bg-canvas px-3 py-1 text-xs font-semibold text-ink outline-none focus:border-brand disabled:opacity-60"
            >
              {!assignedRep && <option value="">Unassigned</option>}
              {selectableReps.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                  {r.role === "lead" ? " (you)" : ""}
                </option>
              ))}
            </select>
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
          <div className="mt-6">
            <CollectionSummary totals={totals} trackedCount={students.length} />
          </div>
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

      {payoutOpen && (
        <DuePayoutModal
          spaceId={spaceId}
          dueId={due.id}
          dueTitle={due.title}
          onClose={() => setPayoutOpen(false)}
          onRequested={() =>
            toast.success("Payout requested", {
              description: "Awaiting approval from your department's reps.",
            })
          }
        />
      )}
    </div>
  );
}
