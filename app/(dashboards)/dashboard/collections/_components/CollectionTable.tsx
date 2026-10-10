import { HugeiconsIcon } from "@hugeicons/react";
import {
  CancelCircleIcon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { RepDue } from "../../create-dues/_components/types";
import { naira } from "../../create-dues/_components/data";
import { BARE_INPUT } from "../../_components/form-styles";
import { COLLECTION_TABS } from "./data";
import type { CollectionStudent, StatusFilter } from "./types";
import { UserAvatar } from "../../_components/UserAvatar";
import { EmptyState } from "../../_components/EmptyState";

export function CollectionTable({
  due,
  students,
  totalCount,
  tabCounts,
  filter,
  query,
  onFilterChange,
  onQueryChange,
}: {
  due: RepDue;
  students: CollectionStudent[];
  totalCount: number;
  tabCounts: Record<StatusFilter, number>;
  filter: StatusFilter;
  query: string;
  onFilterChange: (filter: StatusFilter) => void;
  onQueryChange: (query: string) => void;
}) {
  const hasQuery = query.trim() !== "";
  const isFiltered = hasQuery || filter !== "all";

  return (
    <section className="mt-5 sm:mt-6 sm:rounded-3xl sm:border sm:border-cloud sm:bg-canvas sm:p-6">
      <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-end lg:justify-between">
        {/* The header above already names the due on phones. */}
        <div className="max-sm:hidden">
          <h2 className="text-lg font-semibold tracking-tight text-ink">
            {due.title}
          </h2>
          <p className="mt-1 text-xs text-ink-soft">
            {naira(due.amount)} per student. Review payment status and receipts.
          </p>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div
            role="tablist"
            aria-label="Filter by payment status"
            className="flex items-center rounded-full border border-cloud bg-paper p-1"
          >
            {COLLECTION_TABS.map((tab) => {
              const active = filter === tab.value;
              return (
                <button
                  key={tab.value}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => onFilterChange(tab.value)}
                  className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-semibold sm:flex-none sm:py-1.5 transition-colors duration-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 ${
                    active
                      ? "bg-brand text-white"
                      : "text-ink-soft hover:text-ink"
                  }`}
                >
                  {tab.label}
                  <span
                    className={`rounded-full px-1.5 text-[11px] font-semibold tabular-nums ${
                      active ? "bg-white/25 text-white" : "bg-cloud text-ink-soft"
                    }`}
                  >
                    {tabCounts[tab.value]}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 rounded-full border border-cloud bg-canvas px-4 transition-colors focus-within:border-brand sm:bg-paper md:w-72">
            <HugeiconsIcon
              icon={Search01Icon}
              size={16}
              className="shrink-0 text-ink-soft"
            />
            <Input
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Search name, matric no, or email"
              aria-label="Search students"
              className={cn(BARE_INPUT, "h-10 px-0")}
            />
            {hasQuery && (
              <button
                type="button"
                onClick={() => onQueryChange("")}
                aria-label="Clear search"
                className="shrink-0 text-ink-soft transition-colors hover:text-ink cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 rounded-full"
              >
                <HugeiconsIcon icon={CancelCircleIcon} size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      <p className="mt-4 px-1 text-xs text-ink-soft sm:px-0" aria-live="polite">
        Showing{" "}
        <span className="font-semibold text-ink tabular-nums">
          {students.length}
        </span>{" "}
        of <span className="tabular-nums">{totalCount}</span> students
        {isFiltered ? " matching your filters" : ""}.
      </p>

      <div className="mt-3 overflow-hidden rounded-3xl border border-cloud bg-canvas">
        <div className="hidden grid-cols-[1.25fr_0.8fr_0.55fr_0.75fr_0.7fr] gap-4 bg-paper px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-ink-soft md:grid">
          <span>Student</span>
          <span>Matric no</span>
          <span>Level</span>
          <span>Status</span>
          <span>Reference</span>
        </div>

        <ul className="divide-y divide-cloud">
          {students.map((student) => (
            <li
              key={student.id}
              className="px-4 py-3.5 transition-colors duration-300 hover:bg-paper/70 md:grid md:grid-cols-[1.25fr_0.8fr_0.55fr_0.75fr_0.7fr] md:items-center md:gap-4 md:py-4"
            >
              {/* Phones: one line — avatar, name + matric, status on the right. */}
              <div className="flex items-center gap-3 md:hidden">
                <UserAvatar name={student.name} size={38} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{student.name}</p>
                  <p className="truncate text-xs text-ink-soft">
                    {student.matricNo}
                    {student.level ? ` · ${student.level}` : ""}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      student.status === "paid" ? "bg-cloud text-brand" : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    <HugeiconsIcon
                      icon={student.status === "paid" ? CheckmarkCircle02Icon : Clock01Icon}
                      size={11}
                    />
                    {student.status === "paid" ? "Paid" : "Unpaid"}
                  </span>
                  {student.paidAt && (
                    <p className="mt-0.5 text-[10px] text-ink-soft">{student.paidAt}</p>
                  )}
                </div>
              </div>

              <div className="hidden min-w-0 items-center gap-3 md:flex">
                <UserAvatar name={student.name} size={40} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">
                    {student.name}
                  </p>
                  <p className="truncate text-xs text-ink-soft">
                    {student.email}
                  </p>
                </div>
              </div>
              <p className="hidden text-sm font-medium text-ink md:block">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft md:hidden">
                  Matric:{" "}
                </span>
                {student.matricNo}
              </p>
              <p className="hidden text-sm text-ink-soft md:block">{student.level}</p>
              <div className="hidden md:block">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                    student.status === "paid"
                      ? "bg-cloud text-brand"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  <HugeiconsIcon
                    icon={
                      student.status === "paid"
                        ? CheckmarkCircle02Icon
                        : Clock01Icon
                    }
                    size={12}
                  />
                  {student.status === "paid" ? "Paid" : "Unpaid"}
                </span>
                {student.paidAt && (
                  <p className="mt-1 text-xs text-ink-soft">{student.paidAt}</p>
                )}
              </div>
              <p className="hidden text-sm font-medium text-ink-soft md:block">
                {student.reference ?? "—"}
              </p>
            </li>
          ))}
        </ul>

        {students.length === 0 && (
          <EmptyState
            icon={Search01Icon}
            title="No student found"
            description="No students match the current filters. Try a different status or search term."
            action={
              isFiltered && (
                <Button
                  variant="brand-outline"
                  size="pill"
                  onClick={() => {
                    onQueryChange("");
                    onFilterChange("all");
                  }}
                >
                  Clear filters
                </Button>
              )
            }
          />
        )}
      </div>
    </section>
  );
}
