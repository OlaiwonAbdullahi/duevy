"use client";

import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { useRepSpace } from "../../_components/use-rep-space";
import { PayoutBreakdownCard } from "../_components/PayoutBreakdownCard";

export default function PayoutBreakdownPage() {
  const repSpace = useRepSpace();
  const spaceId = repSpace?.id;

  return (
    <div className="mx-auto max-w-5xl">
      <header className="flex items-center gap-3">
        <Link
          href="/dashboard/payout"
          aria-label="Back to payout"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-cloud text-ink-soft transition-colors duration-300 hover:bg-paper hover:text-ink cursor-pointer"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
        </Link>
        <div>
          <span className="mb-2 inline-block rounded-full bg-cloud px-3 py-1 text-[11px] font-semibold text-brand">
            Rep tools
          </span>
          <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">
            Payout
          </h1>
        </div>
      </header>

      <div className="mt-6">
        <PayoutBreakdownCard spaceId={spaceId} />
      </div>
    </div>
  );
}
