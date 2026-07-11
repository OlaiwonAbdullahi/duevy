"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { RepDue, RepDueStatus } from "../create-dues/_components/types";
import type {
  CollectionStudent,
  CollectionTotals,
  StatusFilter,
} from "./_components/types";
import { downloadCollectionCsv } from "./_components/csv";
import { CollectionSummary } from "./_components/CollectionSummary";
import { CollectionTable } from "./_components/CollectionTable";
import { CollectionsHeader } from "./_components/CollectionsHeader";
import { DueSelector } from "./_components/DueSelector";
import { ExportOptions } from "./_components/ExportOptions";
import { useRepSpace } from "../_components/use-rep-space";
import { fromKobo } from "../_components/format";
import { timeAgo } from "../_components/notifications-data";
import { listRepDues, getCollections, remindUnpaid } from "@/lib/api/rep";
import type {
  RepDue as ApiRepDue,
  CollectionStudent as ApiCollectionStudent,
  CollectionTotals as ApiCollectionTotals,
} from "@/lib/api/types";

function adaptRepDue(api: ApiRepDue): RepDue {
  return {
    id: api.id,
    title: api.title,
    note: api.note ?? "",
    amount: api.amount / 100,
    dueDate: api.dueDate,
    category: api.category,
    allowGuests: api.allowGuests,
    status: api.status as RepDueStatus,
    paidCount: api.paidCount,
    memberCount: api.memberCount,
  };
}

function adaptStudent(api: ApiCollectionStudent): CollectionStudent {
  return {
    id: api.id,
    name: api.name,
    matricNo: api.matricNo,
    level: api.level,
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

export default function CollectionsPage() {
  const repSpace = useRepSpace();
  const spaceId = repSpace?.id;

  const [dues, setDues] = useState<RepDue[]>([]);
  const [selectedDueId, setSelectedDueId] = useState("");
  const [students, setStudents] = useState<CollectionStudent[]>([]);
  const [totals, setTotals] = useState<CollectionTotals>(EMPTY_TOTALS);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");

  const selectedDue = dues.find((due) => due.id === selectedDueId) ?? dues[0];

  // Load the space's published dues for the selector.
  useEffect(() => {
    if (!spaceId) return;
    let cancelled = false;
    (async () => {
      try {
        const apiDues = await listRepDues(spaceId);
        if (cancelled) return;
        const active = apiDues.filter((d) => d.status !== "draft").map(adaptRepDue);
        setDues(active);
        setSelectedDueId((id) => id || active[0]?.id || "");
      } catch {
        if (!cancelled) toast.error("Couldn't load your dues.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [spaceId]);

  // Load the roster whenever the selected due changes.
  useEffect(() => {
    if (!spaceId || !selectedDueId) return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await getCollections(spaceId, selectedDueId, { perPage: 200 });
        if (cancelled) return;
        setStudents(data.students.map(adaptStudent));
        setTotals(adaptTotals(data.totals));
      } catch {
        if (!cancelled) toast.error("Couldn't load the collection roster.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [spaceId, selectedDueId]);

  // Students matching the search box, before the status tab is applied.
  const queryMatched = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q === "") return students;
    return students.filter(
      (student) =>
        student.name.toLowerCase().includes(q) ||
        student.matricNo.toLowerCase().includes(q) ||
        student.email.toLowerCase().includes(q),
    );
  }, [query, students]);

  const tabCounts = useMemo(
    () => ({
      all: queryMatched.length,
      paid: queryMatched.filter((student) => student.status === "paid").length,
      unpaid: queryMatched.filter((student) => student.status === "unpaid").length,
    }),
    [queryMatched],
  );

  const filteredStudents = useMemo(
    () =>
      filter === "all"
        ? queryMatched
        : queryMatched.filter((student) => student.status === filter),
    [filter, queryMatched],
  );

  const handleDownload = (rows: CollectionStudent[], scope: string) => {
    if (!selectedDue) return;
    const safeTitle = selectedDue.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    downloadCollectionCsv(`${safeTitle}-${scope}.csv`, rows);
    toast.success("List downloaded", {
      description: `${rows.length} student${rows.length === 1 ? "" : "s"} exported.`,
    });
  };

  const handleSendReminders = async () => {
    if (!selectedDue || !spaceId) return;
    if (totals.unpaid === 0) {
      toast.info("Everyone has paid", {
        description: `No reminders needed for ${selectedDue.title}.`,
      });
      return;
    }
    try {
      await remindUnpaid(spaceId, selectedDue.id);
      toast.success("Reminders sent", {
        description: `${totals.unpaid} unpaid student${
          totals.unpaid === 1 ? "" : "s"
        } notified about ${selectedDue.title}.`,
      });
    } catch {
      toast.error("Couldn't send reminders. They may be rate-limited (once per day).");
    }
  };

  if (!selectedDue) {
    return (
      <div className="mx-auto max-w-4xl rounded-3xl border border-cloud bg-canvas p-8 text-center">
        <h1 className="text-xl font-semibold tracking-tight text-ink">Collections</h1>
        <p className="mt-2 text-sm text-ink-soft">
          Create a due first to start tracking payments.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <CollectionsHeader
        onDownload={() => handleDownload(filteredStudents, filter)}
        onSendReminders={handleSendReminders}
      />

      <DueSelector dues={dues} selectedDue={selectedDue} onSelect={setSelectedDueId} />

      <div className="mt-6">
        <CollectionSummary totals={totals} trackedCount={students.length} />
      </div>

      <ExportOptions students={students} onDownload={handleDownload} />

      <CollectionTable
        due={selectedDue}
        students={filteredStudents}
        totalCount={students.length}
        tabCounts={tabCounts}
        filter={filter}
        query={query}
        onFilterChange={setFilter}
        onQueryChange={setQuery}
      />
    </div>
  );
}
