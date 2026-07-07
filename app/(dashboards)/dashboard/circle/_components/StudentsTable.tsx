import { HugeiconsIcon } from "@hugeicons/react";
import {
  CancelCircleIcon,
  CheckmarkCircle02Icon,
  Search01Icon,
  UserAdd01Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Student } from "./types";
import { UserAvatar } from "../../_components/UserAvatar";
import { EmptyState } from "../../_components/EmptyState";
import { BARE_INPUT } from "../../_components/form-styles";

export function StudentsTable({
  students,
  totalCount,
  query,
  onQueryChange,
}: {
  students: Student[];
  totalCount: number;
  query: string;
  onQueryChange: (query: string) => void;
}) {
  const hasQuery = query.trim() !== "";

  return (
    <section className="mt-6 rounded-3xl border border-cloud bg-canvas p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-ink">
            Department students
          </h2>
          <p className="mt-1 text-xs text-ink-soft">
            Everyone who joined with your department code.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-cloud bg-paper px-4 transition-colors focus-within:border-brand sm:w-72">
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
              className="shrink-0 rounded-full text-ink-soft transition-colors hover:text-ink cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
            >
              <HugeiconsIcon icon={CancelCircleIcon} size={16} />
            </button>
          )}
        </div>
      </div>

      <p className="mt-4 text-xs text-ink-soft" aria-live="polite">
        Showing{" "}
        <span className="font-semibold text-ink tabular-nums">
          {students.length}
        </span>{" "}
        of <span className="tabular-nums">{totalCount}</span> students
        {hasQuery ? " matching your search" : ""}.
      </p>

      <div className="mt-3 overflow-hidden rounded-3xl border border-cloud">
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
              className="grid gap-3 px-4 py-4 transition-colors duration-300 hover:bg-paper/70 md:grid-cols-[1.3fr_0.8fr_0.55fr_0.75fr] md:items-center md:gap-4"
            >
              <div className="flex min-w-0 items-center gap-3">
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
              <p className="text-sm font-medium text-ink">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft md:hidden">
                  Matric:{" "}
                </span>
                {student.matricNo}
              </p>
              <p className="text-sm text-ink-soft">{student.level}</p>
              <div className="flex items-center justify-between gap-3 md:block">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-cloud px-2.5 py-1 text-[11px] font-semibold text-brand">
                  <HugeiconsIcon icon={CheckmarkCircle02Icon} size={12} />
                  Member
                </span>
                <p className="mt-0 text-xs text-ink-soft md:mt-1">
                  {student.joinedAt}
                </p>
              </div>
            </li>
          ))}
        </ul>

        {students.length === 0 && (
          <EmptyState
            icon={UserAdd01Icon}
            title="No student found"
            description="No members match your search. Try another name, matric number, or email."
            action={
              hasQuery && (
                <Button
                  variant="brand-outline"
                  size="pill"
                  onClick={() => onQueryChange("")}
                >
                  Clear search
                </Button>
              )
            }
          />
        )}
      </div>
    </section>
  );
}
