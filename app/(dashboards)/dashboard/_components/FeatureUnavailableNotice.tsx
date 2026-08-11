import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowRight01Icon,
  SquareLock02Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";

/**
 * Shown when a direct URL hits a route that's cut from the pilot (see
 * lib/features.ts) but still hidden behind a flag rather than deleted.
 */
export function FeatureUnavailableNotice() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center rounded-3xl border border-cloud bg-canvas px-6 py-14 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-full bg-cloud text-brand">
        <HugeiconsIcon icon={SquareLock02Icon} size={22} />
      </span>
      <h1 className="mt-4 text-lg font-semibold tracking-tight text-ink">
        Not available yet
      </h1>
      <p className="mt-1.5 max-w-sm text-[13px] leading-6 text-ink-soft">
        This feature isn&apos;t part of the pilot right now.
      </p>
      <Button asChild variant="brand" size="pill-lg" className="mt-6">
        <Link href="/dashboard">
          Back to overview
          <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
        </Link>
      </Button>
    </div>
  );
}
