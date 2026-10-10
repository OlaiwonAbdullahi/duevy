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
    <section className="mt-6 sm:rounded-3xl sm:border sm:border-cloud sm:bg-canvas sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-ink sm:text-lg">
            Department students
          </h2>
          <p className="mt-1 text-xs text-ink-soft max-sm:hidden">
            Everyone who joined with your department code.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-cloud bg-canvas px-4 transition-colors focus-within:border-brand sm:w-72 sm:bg-paper">
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

      <p className="mt-4 px-1 text-xs text-ink-soft sm:px-0" aria-live="polite">
        Showing{" "}
        <span className="font-semibold text-ink tabular-nums">
          {students.length}
        </span>{" "}
        of <span className="tabular-nums">{totalCount}</span> students
        {hasQuery ? " matching your search" : ""}.
      </p>

      <div className="mt-3 overflow-hidden rounded-3xl border border-cloud bg-canvas">
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
              className="px-4 py-3.5 transition-colors duration-300 hover:bg-paper/70 md:grid md:grid-cols-[1.3fr_0.8fr_0.55fr_0.75fr] md:items-center md:gap-4 md:py-4"
            >
              {/* Phones: avatar, name + matric · level, joined on the right. */}
              <div className="flex items-center gap-3 md:hidden">
                <UserAvatar name={student.name} size={38} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{student.name}</p>
                  <p className="truncate text-xs text-ink-soft">
                    {student.matricNo}
                    {student.level ? ` · ${student.level}` : ""}
                  </p>
                </div>
                <span className="shrink-0 text-[11px] text-ink-soft">{student.joinedAt}</span>
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
