import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon, CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import type { Due, Space } from "./types";
import { naira, summarizeSpace, relativeDue, KIND_GLYPH, SPACE_KIND_LABEL } from "./data";
import { SpaceEmblem } from "./SpaceEmblem";

/**
 * Phone layout of a space: one tappable list row (crest, name, position) in
 * place of the SpaceCard tile, so several spaces fit on screen at once.
 */
export function SpaceRow({
  space,
  dues,
  onOpen,
  status,
}: {
  space: Space;
  dues: Due[];
  onOpen: (space: Space) => void;
  status?: "joining" | "loading";
}) {
  const s = summarizeSpace(space.id, dues);
  const settled = s.openCount === 0;
  const rel = s.nextDue ? relativeDue(s.nextDue.dueDate) : null;

  return (
    <button
      type="button"
      onClick={() => onOpen(space)}
      disabled={status === "joining"}
      aria-busy={status ? true : undefined}
      className="group flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors active:bg-paper disabled:cursor-progress disabled:opacity-80 focus-visible:bg-paper focus-visible:outline-none cursor-pointer"
    >
      <SpaceEmblem space={space} glyph={KIND_GLYPH[space.kind]} size={46} />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink">{space.name}</p>
        {status ? (
          <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-soft">
            <span className="h-3 w-3 shrink-0 animate-spin rounded-full border-2 border-brand/30 border-t-brand" />
            {status === "joining" ? "Joining…" : "Loading dues…"}
          </p>
        ) : settled ? (
          <p className="mt-0.5 flex items-center gap-1 text-xs font-medium text-brand">
            <HugeiconsIcon icon={CheckmarkCircle02Icon} size={13} />
            All settled
          </p>
        ) : (
          <p className={`mt-0.5 truncate text-xs ${rel?.past ? "font-medium text-rose-600" : "text-ink-soft"}`}>
            {s.openCount} open · {rel?.text ?? SPACE_KIND_LABEL[space.kind]}
          </p>
        )}
      </div>

      {!status && (
        <p className={`shrink-0 text-sm font-semibold tabular-nums ${settled ? "text-ink-soft" : "text-ink"}`}>
          {settled ? "₦0" : naira(s.outstanding)}
        </p>
      )}
      <HugeiconsIcon
        icon={ArrowRight01Icon}
        size={16}
        className="shrink-0 text-ink-soft/70 transition-transform group-active:translate-x-0.5"
      />
    </button>
  );
}
