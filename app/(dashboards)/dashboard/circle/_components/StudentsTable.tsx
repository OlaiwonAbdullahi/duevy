import { HugeiconsIcon } from "@hugeicons/react";
import {
  CheckmarkCircle02Icon,
  Search01Icon,
  UserAdd01Icon,
} from "@hugeicons/core-free-icons";
import type { Student } from "./types";
import { Initials } from "./Initials";

export function StudentsTable({
  students,
  query,
  onQueryChange,
}: {
  students: Student[];
  query: string;
  onQueryChange: (query: string) => void;
}) {
  return (
    <section className="rounded-3xl border border-cloud bg-canvas p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-ink">
            Department students
          </h2>
          <p className="mt-1 text-xs text-ink-soft">
            Approved members listed for the department.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-cloud bg-paper px-4 focus-within:border-brand sm:w-64">
          <HugeiconsIcon
            icon={Search01Icon}
            size={16}
            className="shrink-0 text-ink-soft"
          />
          <input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search students"
            className="h-10 w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-soft"
          />
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-cloud">
        <div className="hidden grid-cols-[1.3fr_0.8fr_0.55fr_0.75fr] gap-4 bg-paper px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-ink-soft md:grid">
          <span>Student</span>
          <span>Matric no</span>
          <span>Level</span>
          <span>Joined</span>
        </div>

        <ul className="divide-y divide-cloud">
          {students.map((student) => (
            <li
              key={student.id}
              className="grid gap-3 px-4 py-4 md:grid-cols-[1.3fr_0.8fr_0.55fr_0.75fr] md:items-center md:gap-4"
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
              <div className="flex items-center justify-between gap-3 md:block">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-cloud px-2.5 py-1 text-[11px] font-semibold text-brand">
                  <HugeiconsIcon icon={CheckmarkCircle02Icon} size={12} />
                  Approved
                </span>
                <p className="mt-0 text-xs text-ink-soft md:mt-1">
                  {student.joinedAt}
                </p>
              </div>
            </li>
          ))}
        </ul>

        {students.length === 0 && (
          <div className="py-10 text-center">
            <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-cloud text-brand">
              <HugeiconsIcon icon={UserAdd01Icon} size={20} />
            </span>
            <p className="mt-3 text-sm font-semibold text-ink">
              No student found
            </p>
            <p className="mt-1 text-xs text-ink-soft">
              Try another name, matric number, or email.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
