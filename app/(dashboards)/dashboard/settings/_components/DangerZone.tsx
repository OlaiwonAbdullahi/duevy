"use client";

import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { Alert01Icon } from "@hugeicons/core-free-icons";

/**
 * Destructive account actions, walled off in their own rose-tinted card so
 * they read as separate from everyday preferences.
 */
export function DangerZone() {
  return (
    <section className="rounded-3xl border border-rose-200 bg-rose-50/50 p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-rose-100 text-rose-600">
          <HugeiconsIcon icon={Alert01Icon} size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold tracking-tight text-ink">
            Deactivate account
          </h2>
          <p className="mt-0.5 text-[13px] text-ink-soft">
            Your profile is hidden and you stop receiving reminders. You can
            reactivate any time by signing back in. Outstanding dues remain
            payable.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() =>
          toast("Deactivate account?", {
            description: "This would open a confirmation step in production.",
          })
        }
        className="mt-5 inline-flex h-11 items-center justify-center rounded-full border border-rose-300 bg-white px-6 text-sm font-semibold text-rose-600 transition-colors duration-300 hover:bg-rose-100 cursor-pointer"
      >
        Deactivate account
      </button>
    </section>
  );
}
