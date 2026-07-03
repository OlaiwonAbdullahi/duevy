import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  UserMultipleIcon,
  CheckmarkCircle02Icon,
} from "@hugeicons/core-free-icons";
import type { Due, Space } from "./types";
import {
  naira,
  summarizeSpace,
  KIND_GLYPH,
  SPACE_KIND_LABEL,
} from "./data";
import { SpaceEmblem } from "./SpaceEmblem";
import { DueRow } from "./DueRow";

function Stat({ label, value, tone }: { label: string; value: string; tone?: "brand" }) {
  return (
    <div className="rounded-2xl border border-cloud bg-canvas px-4 py-3">
      <p className="text-[11px] font-medium text-ink-soft">{label}</p>
      <p
        className={`mt-0.5 text-lg font-semibold tracking-tight ${
          tone === "brand" ? "text-brand" : "text-ink"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

export function SpaceDetail({
  space,
  dues,
  pendingId,
  onBack,
  onPay,
}: {
  space: Space;
  dues: Due[];
  pendingId: string | null;
  onBack: () => void;
  onPay: (due: Due) => void;
}) {
  const s = summarizeSpace(space.id, dues);
  const settled = s.openCount === 0;

  // Open dues float to the top; overdue before merely upcoming; paid sink down.
  const ordered = [...dues].sort((a, b) => {
    const rank = (d: Due) =>
      d.status === "overdue" ? 0 : d.status === "unpaid" ? 1 : 2;
    return rank(a) - rank(b) || +new Date(a.dueDate) - +new Date(b.dueDate);
  });

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft transition-colors hover:text-ink cursor-pointer"
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
        All spaces
      </button>

      {/* Space header — the crest, up close. */}
      <div className="mt-4 flex flex-col gap-5 rounded-3xl border border-cloud bg-canvas p-5 sm:flex-row sm:items-center sm:p-6">
        <SpaceEmblem space={space} glyph={KIND_GLYPH[space.kind]} size={72} />
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold tracking-tight text-ink">
              {space.name}
            </h2>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                space.membership === "member"
                  ? "bg-cloud text-brand"
                  : "border border-cloud text-ink-soft"
              }`}
            >
              {space.membership === "member" ? "Member" : "Guest"}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-2 text-xs text-ink-soft">
            <span>{SPACE_KIND_LABEL[space.kind]}</span>
            <span className="text-cloud">•</span>
            <span className="inline-flex items-center gap-1">
              <HugeiconsIcon icon={UserMultipleIcon} size={13} />
              {space.memberCount.toLocaleString("en-NG")} members
            </span>
          </div>
        </div>
      </div>

      {/* Summary strip. */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat
          label="Outstanding"
          value={settled ? "₦0" : naira(s.outstanding)}
          tone={settled ? "brand" : undefined}
        />
        <Stat label="Open dues" value={String(s.openCount)} />
        <Stat label="Settled" value={String(s.paidCount)} />
      </div>

      {/* Dues list. */}
      <div className="mt-4 rounded-3xl border border-cloud bg-canvas p-5 sm:p-6">
        <div className="mb-1 flex items-center justify-between">
          <h3 className="text-base font-semibold tracking-tight text-ink">
            Dues
          </h3>
          {settled && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-brand">
              <HugeiconsIcon icon={CheckmarkCircle02Icon} size={14} />
              All settled
            </span>
          )}
        </div>
        <ul className="flex flex-col">
          {ordered.map((due) => (
            <DueRow
              key={due.id}
              due={due}
              onPay={onPay}
              pending={pendingId === due.id}
            />
          ))}
        </ul>
      </div>
    </div>
  );
}
