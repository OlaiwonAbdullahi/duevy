"use client";

import { useState } from "react";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { Alert01Icon } from "@hugeicons/core-free-icons";
import { ConfirmDialog } from "../../_components/ConfirmDialog";

type PendingAction = "transfer" | "archive" | null;

/**
 * Irreversible department actions, walled off in a rose-tinted card so they
 * read as separate from everyday settings. Each routes through a confirm step.
 */
export function DangerZone() {
  const [pending, setPending] = useState<PendingAction>(null);

  const confirmText =
    pending === "transfer"
      ? {
          title: "Transfer lead role?",
          description:
            "The new lead takes over department ownership and you become a co-rep. This can't be undone by you.",
          confirmLabel: "Transfer role",
          done: "Lead role transfer started",
        }
      : {
          title: "Archive department?",
          description:
            "New dues, join requests and votes stop immediately. Existing records stay available to view.",
          confirmLabel: "Archive department",
          done: "Department archived",
        };

  return (
    <section className="rounded-3xl border border-rose-200 bg-rose-50/50 p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-rose-100 text-rose-600">
          <HugeiconsIcon icon={Alert01Icon} size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold tracking-tight text-ink">
            Danger zone
          </h2>
          <p className="mt-0.5 text-[13px] text-ink-soft">
            These actions affect the whole department. Handle with care.
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3">
        <Row
          title="Transfer lead role"
          description="Hand over department ownership to another rep. You'll become a co-rep."
          action="Transfer"
          onClick={() => setPending("transfer")}
        />
        <Row
          title="Archive department"
          description="Stop new dues and join requests. Existing records stay available."
          action="Archive"
          onClick={() => setPending("archive")}
        />
      </div>

      <ConfirmDialog
        open={pending !== null}
        title={confirmText.title}
        description={confirmText.description}
        confirmLabel={confirmText.confirmLabel}
        onConfirm={() => {
          toast.success(confirmText.done);
          setPending(null);
        }}
        onClose={() => setPending(null)}
      />
    </section>
  );
}

function Row({
  title,
  description,
  action,
  onClick,
}: {
  title: string;
  description: string;
  action: string;
  onClick: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-rose-200 bg-white/70 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-ink">{title}</p>
        <p className="mt-0.5 text-xs text-ink-soft">{description}</p>
      </div>
      <button
        type="button"
        onClick={onClick}
        className="inline-flex h-10 shrink-0 items-center justify-center rounded-full border border-rose-300 bg-white px-5 text-xs font-semibold text-rose-600 transition-colors duration-300 hover:bg-rose-100 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
      >
        {action}
      </button>
    </div>
  );
}
