"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  Notification03Icon,
  Download04Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { fromKobo } from "../../_components/format";
import { timeAgo } from "../../_components/notifications-data";
import { getCollections, remindUnpaid } from "@/lib/api/rep";
import { ApiError } from "@/lib/api/errors";
import { CollectionSummary } from "../../collections/_components/CollectionSummary";
import { CollectionTable } from "../../collections/_components/CollectionTable";
import { downloadCollectionCsv } from "../../collections/_components/csv";
import type {
  CollectionStudent,
  CollectionTotals,
  StatusFilter,
} from "../../collections/_components/types";
import type {
  CollectionStudent as ApiCollectionStudent,
  CollectionTotals as ApiCollectionTotals,
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
  due,
  onBack,
}: {
  spaceId: string;
  due: RepDue;
  onBack: () => void;
}) {
  const [students, setStudents] = useState<CollectionStudent[]>([]);
  const [totals, setTotals] = useState<CollectionTotals>(EMPTY_TOTALS);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      console.group(`[collections] ${due.title} (${due.id})`);
      console.log("request →", { spaceId, dueId: due.id, due });
      try {
        const res = await getCollections(spaceId, due.id, { perPage: 200 });
        console.log("raw response →", res);
        console.log("meta →", res.meta);
        console.log("totals →", res.data?.totals);
        console.log("students →", res.data?.students);
        console.table(res.data?.students ?? []);
        if (cancelled) return;
        const { data } = res;
        setStudents((data.students ?? []).map(adaptStudent));
        setTotals(data.totals ? adaptTotals(data.totals) : EMPTY_TOTALS);
      } catch (err) {
        if (cancelled) return;
        // No roster yet (e.g. a fresh/draft due) can 404 — show it as empty.
        if (err instanceof ApiError && err.status === 404) {
          console.warn("404 — no roster yet, treating as empty");
          setStudents([]);
          setTotals(EMPTY_TOTALS);
        } else {
          console.error("getCollections failed →", err);
          toast.error("Couldn't load the collection roster.");
        }
      } finally {
        console.groupEnd();
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
    try {
      await remindUnpaid(spaceId, due.id);
      toast.success("Reminders sent", {
        description: `${totals.unpaid} unpaid student${
          totals.unpaid === 1 ? "" : "s"
        } notified about ${due.title}.`,
      });
    } catch {
      toast.error("Couldn't send reminders. They may be rate-limited (once per day).");
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
        <div className="flex items-center gap-2">
          <Button variant="brand-outline" size="pill" onClick={handleReminders}>
            <HugeiconsIcon icon={Notification03Icon} size={15} />
            Remind unpaid
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
    </div>
  );
}
