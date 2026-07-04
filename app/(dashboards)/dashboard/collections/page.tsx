"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { INITIAL_REP_DUES } from "../create-dues/_components/data";
import type { CollectionStudent, StatusFilter } from "./_components/types";
import { COLLECTION_STUDENTS } from "./_components/data";
import { downloadCollectionCsv } from "./_components/csv";
import { CollectionSummary } from "./_components/CollectionSummary";
import { CollectionTable } from "./_components/CollectionTable";
import { CollectionsHeader } from "./_components/CollectionsHeader";
import { DueSelector } from "./_components/DueSelector";
import { ExportOptions } from "./_components/ExportOptions";

const ACTIVE_DUES = INITIAL_REP_DUES.filter((due) => due.status !== "draft");

function buildStudentsForDue(selectedIndex: number): CollectionStudent[] {
  return COLLECTION_STUDENTS.map((student, index) => {
    if (selectedIndex === 0) return student;
    if (selectedIndex === 1) {
      return {
        ...student,
        status: index < 6 ? "paid" : "unpaid",
        paidAt: index < 6 ? student.paidAt ?? "This week" : undefined,
        reference: index < 6 ? student.reference ?? `DVY-83${index}21` : undefined,
      };
    }
    return {
      ...student,
      status: index === 6 ? "unpaid" : "paid",
      paidAt: index === 6 ? undefined : student.paidAt ?? "Last month",
      reference: index === 6 ? undefined : student.reference ?? `DVY-82${index}64`,
    };
  });
}

export default function CollectionsPage() {
  const [selectedDueId, setSelectedDueId] = useState(ACTIVE_DUES[0]?.id ?? "");
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");

  const selectedDue =
    ACTIVE_DUES.find((due) => due.id === selectedDueId) ?? ACTIVE_DUES[0];

  const students = useMemo(() => {
    const selectedIndex = Math.max(
      0,
      ACTIVE_DUES.findIndex((due) => due.id === selectedDue?.id),
    );
    return buildStudentsForDue(selectedIndex);
  }, [selectedDue?.id]);

  // Students matching the search box, before the status tab is applied — used
  // both for the visible rows and to keep the tab counts in sync with search.
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

  const totals = useMemo(() => {
    const paid = students.filter((student) => student.status === "paid").length;
    const unpaid = students.length - paid;
    return {
      paid,
      unpaid,
      collected: paid * (selectedDue?.amount ?? 0),
      expected: students.length * (selectedDue?.amount ?? 0),
      rate: students.length ? Math.round((paid / students.length) * 100) : 0,
    };
  }, [selectedDue?.amount, students]);

  const handleDownload = (rows: CollectionStudent[], scope: string) => {
    if (!selectedDue) return;
    const safeTitle = selectedDue.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    downloadCollectionCsv(`${safeTitle}-${scope}.csv`, rows);
    toast.success("List downloaded", {
      description: `${rows.length} student${rows.length === 1 ? "" : "s"} exported.`,
    });
  };

  const handleSendReminders = () => {
    if (!selectedDue) return;
    const unpaid = students.filter((student) => student.status === "unpaid").length;
    if (unpaid === 0) {
      toast.info("Everyone has paid", {
        description: `No reminders needed for ${selectedDue.title}.`,
      });
      return;
    }
    toast.success("Reminders sent", {
      description: `${unpaid} unpaid student${unpaid === 1 ? "" : "s"} notified about ${selectedDue.title}.`,
    });
  };

  if (!selectedDue) {
    return (
      <div className="mx-auto max-w-4xl rounded-3xl border border-cloud bg-canvas p-8 text-center">
        <h1 className="text-xl font-semibold tracking-tight text-ink">
          Collections
        </h1>
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

      <DueSelector
        dues={ACTIVE_DUES}
        selectedDue={selectedDue}
        onSelect={setSelectedDueId}
      />

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
