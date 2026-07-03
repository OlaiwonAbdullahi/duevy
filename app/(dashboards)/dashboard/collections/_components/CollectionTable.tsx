import { HugeiconsIcon } from "@hugeicons/react";
import {
  CheckmarkCircle02Icon,
  Clock01Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import type { RepDue } from "../../create-dues/_components/types";
import { naira } from "../../create-dues/_components/data";
import { COLLECTION_TABS } from "./data";
import type { CollectionStudent, StatusFilter } from "./types";
import { Initials } from "./Initials";

export function CollectionTable({
  due,
  students,
  filter,
  query,
  onFilterChange,
  onQueryChange,
}: {
  due: RepDue;
  students: CollectionStudent[];
  filter: StatusFilter;
  query: string;
  onFilterChange: (filter: StatusFilter) => void;
  onQueryChange: (query: string) => void;
}) {
  return (
    <section className="mt-6 rounded-3xl border border-cloud bg-canvas p-4 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-ink">
            {due.title}
          </h2>
          <p className="mt-1 text-xs text-ink-soft">
            {naira(due.amount)} per student. Review payment status and receipts.
          </p>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="flex items-center rounded-full border border-cloud bg-paper p-1">
            {COLLECTION_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => onFilterChange(tab.value)}
                className={`rounded-full px-4 py-1.5 text-[13px] font-semibold transition-colors duration-300 cursor-pointer ${
                  filter === tab.value
                    ? "bg-brand text-white"
                    : "text-ink-soft hover:text-ink"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 rounded-full border border-cloud bg-paper px-4 focus-within:border-brand md:w-72">
            <HugeiconsIcon
              icon={Search01Icon}
              size={16}
              className="shrink-0 text-ink-soft"
            />
            <input
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Search list"
              className="h-10 w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-soft"
            />
          </div>
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-3xl border border-cloud">
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
              className="grid gap-3 px-4 py-4 transition-colors duration-300 hover:bg-paper/70 md:grid-cols-[1.25fr_0.8fr_0.55fr_0.75fr_0.7fr] md:items-center md:gap-4"
            >
              <div className="flex min-w-0 items-center gap-3">
                <Initials name={student.name} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">
                    {student.name}
                  </p>
                  <p className="truncate text-xs text-ink-soft">
                    {student.email}
                  </p>
                </div>
              </div>
              <p className="text-sm font-medium text-ink">
                {student.matricNo}
              </p>
              <p className="text-sm text-ink-soft">{student.level}</p>
              <div>
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
                  <p className="mt-1 text-xs text-ink-soft">
                    {student.paidAt}
                  </p>
                )}
              </div>
              <p className="text-sm font-medium text-ink-soft">
                {student.reference ?? "-"}
              </p>
            </li>
          ))}
        </ul>

        {students.length === 0 && (
          <div className="py-10 text-center">
            <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-cloud text-brand">
              <HugeiconsIcon icon={Search01Icon} size={20} />
            </span>
            <p className="mt-3 text-sm font-semibold text-ink">
              No student found
            </p>
            <p className="mt-1 text-xs text-ink-soft">
              Try another status, name, matric number, or email.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
