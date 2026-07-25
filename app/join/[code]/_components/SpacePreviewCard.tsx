import { HugeiconsIcon } from "@hugeicons/react";
import { UserMultipleIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import type { JoinableDepartment } from "@/app/(dashboards)/dashboard/dues/_components/types";
import { KIND_GLYPH, SPACE_KIND_LABEL, naira } from "@/app/(dashboards)/dashboard/dues/_components/data";
import { SpaceEmblem } from "@/app/(dashboards)/dashboard/dues/_components/SpaceEmblem";

/** The space preview a student sees before confirming they want to join. */
export function SpacePreviewCard({
  dept,
  busy,
  onJoin,
}: {
  dept: JoinableDepartment;
  busy: boolean;
  onJoin: () => void;
}) {
  const duesTotal = dept.dues.reduce((sum, due) => sum + due.amount, 0);

  return (
    <div className="rounded-3xl border border-cloud bg-canvas p-6 text-center sm:p-8">
      <div className="flex flex-col items-center">
        <SpaceEmblem space={dept} glyph={KIND_GLYPH[dept.kind]} size={72} />
        <h1 className="mt-4 text-xl font-semibold tracking-tight text-ink">
          {dept.name}
        </h1>
        <div className="mt-1.5 flex flex-wrap items-center justify-center gap-2 text-xs text-ink-soft">
          <span>{SPACE_KIND_LABEL[dept.kind]}</span>
          {dept.faculty && (
            <>
              <span className="text-cloud">•</span>
              <span>{dept.faculty}</span>
            </>
          )}
          <span className="text-cloud">•</span>
          <span className="inline-flex items-center gap-1">
            <HugeiconsIcon icon={UserMultipleIcon} size={13} />
            {dept.memberCount.toLocaleString("en-NG")} members
          </span>
        </div>
        {dept.about && (
          <p className="mt-3 max-w-sm text-sm leading-6 text-ink-soft">
            {dept.about}
          </p>
        )}
        {dept.dues.length > 0 && (
          <p className="mt-4 rounded-2xl bg-paper px-4 py-2 text-xs text-ink-soft">
            {dept.dues.length} due{dept.dues.length === 1 ? "" : "s"} waiting —{" "}
            <span className="font-semibold text-ink">{naira(duesTotal)}</span> total
          </p>
        )}
      </div>

      <Button
        variant="brand"
        size="pill-xl"
        disabled={busy}
        onClick={onJoin}
        className="mt-6 w-full"
      >
        {busy ? "Joining…" : `Join ${dept.short || dept.name}`}
      </Button>
    </div>
  );
}
