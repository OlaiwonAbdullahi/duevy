import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserMultipleIcon,
  Alert01Icon,
  CheckmarkCircle02Icon,
} from "@hugeicons/core-free-icons";
import type { Due, Space } from "./types";
import {
  naira,
  summarizeSpace,
  relativeDue,
  KIND_GLYPH,
  SPACE_KIND_LABEL,
} from "./data";
import { SpaceEmblem } from "./SpaceEmblem";

export function SpaceCard({
  space,
  dues,
  onOpen,
}: {
  space: Space;
  dues: Due[];
  onOpen: (space: Space) => void;
}) {
  const s = summarizeSpace(space.id, dues);
  const settled = s.openCount === 0;
  const rel = s.nextDue ? relativeDue(s.nextDue.dueDate) : null;

  return (
    <button
      type="button"
      onClick={() => onOpen(space)}
      className="group relative flex w-full flex-col overflow-hidden rounded-3xl border border-cloud bg-canvas p-5 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-[0_18px_40px_-24px_rgba(11,110,79,0.45)] focus:outline-none focus-visible:ring-[3px] focus-visible:ring-brand/20 cursor-pointer"
    >
      <div className="flex items-start justify-between gap-3">
        <SpaceEmblem
          space={space}
          glyph={KIND_GLYPH[space.kind]}
          size={56}
          interactive
        />
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium ${
            space.membership === "member"
              ? "bg-cloud text-brand"
              : "border border-cloud text-ink-soft"
          }`}
        >
          {space.membership === "member" ? "Member" : "Guest"}
        </span>
      </div>

      <h3 className="mt-4 line-clamp-2 text-sm font-semibold leading-snug tracking-tight text-ink">
        {space.name}
      </h3>
      <div className="mt-1 flex items-center gap-2 text-xs text-ink-soft">
        <span>{SPACE_KIND_LABEL[space.kind]}</span>
        <span className="text-cloud">•</span>
        <span className="inline-flex items-center gap-1">
          <HugeiconsIcon icon={UserMultipleIcon} size={13} />
          {space.memberCount.toLocaleString("en-NG")}
        </span>
      </div>

      {/* Outstanding position — the number a student actually cares about. */}
      <div className="mt-5 flex items-end justify-between border-t border-cloud pt-4">
        <div>
          <p className="text-[11px] font-medium text-ink-soft">
            {settled ? "All settled" : "Outstanding"}
          </p>
          <p
            className={`mt-0.5 text-lg font-semibold tracking-tight ${
              settled ? "text-brand" : "text-ink"
            }`}
          >
            {settled ? "₦0" : naira(s.outstanding)}
          </p>
        </div>

        {settled ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-brand">
            <HugeiconsIcon icon={CheckmarkCircle02Icon} size={14} />
            Up to date
          </span>
        ) : (
          rel && (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium ${
                rel.past
                  ? "bg-rose-50 text-rose-600"
                  : "bg-paper text-ink-soft"
              }`}
            >
              {rel.past && <HugeiconsIcon icon={Alert01Icon} size={12} />}
              {s.openCount} due · {rel.text}
            </span>
          )
        )}
      </div>
    </button>
  );
}
