import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowRight01Icon,
  SquareLock02Icon,
} from "@hugeicons/core-free-icons";

/**
 * Shown when a student lands on a rep-only route. Explains why and points back
 * to the overview. In this demo the role switch in the topbar unblocks it.
 */
export function RepOnlyNotice() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center rounded-3xl border border-cloud bg-canvas px-6 py-14 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-full bg-cloud text-brand">
        <HugeiconsIcon icon={SquareLock02Icon} size={22} />
      </span>
      <h1 className="mt-4 text-lg font-semibold tracking-tight text-ink">
        Rep tools only
      </h1>
      <p className="mt-1.5 max-w-sm text-[13px] leading-6 text-ink-soft">
        This section is for department reps — managing dues, collections,
        payouts and votes. Your account doesn&apos;t have rep access for this
        department.
      </p>
      <p className="mt-4 rounded-2xl bg-paper px-4 py-2.5 text-xs text-ink-soft">
        Previewing the demo? Use{" "}
        <span className="font-semibold text-ink">View as → Rep</span> in the top
        bar.
      </p>
      <Link
        href="/dashboard"
        className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-brand px-6 text-sm font-semibold text-white transition-colors duration-300 hover:bg-brand-bright cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
      >
        Back to overview
        <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
      </Link>
    </div>
  );
}
