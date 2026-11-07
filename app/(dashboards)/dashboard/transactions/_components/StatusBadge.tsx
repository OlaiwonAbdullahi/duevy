import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@/lib/utils";
import { STATUS_META } from "./data";
import type { TxnStatus } from "./types";

/** The one status pill used on rows and in the details view. Icon + word, so it never relies on colour alone. */
export function StatusBadge({ status, className }: { status: TxnStatus; className?: string }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap",
        meta.className,
        className,
      )}
    >
      <HugeiconsIcon icon={meta.icon} size={12} strokeWidth={2.2} aria-hidden />
      {meta.label}
    </span>
  );
}
