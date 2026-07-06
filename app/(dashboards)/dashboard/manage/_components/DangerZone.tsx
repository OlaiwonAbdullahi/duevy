"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "../../_components/ConfirmDialog";
import { DangerCard } from "../../_components/DangerCard";

type PendingAction = "transfer" | "archive" | null;

/**
 * Irreversible department actions in the shared rose danger shell. Each
 * routes through a confirm step.
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
    <DangerCard
      title="Danger zone"
      description="These actions affect the whole department. Handle with care."
    >
      <div className="flex flex-col gap-3">
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
    </DangerCard>
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
      <Button
        variant="danger-outline"
        size="pill-lg"
        onClick={onClick}
        className="h-10 px-5 text-xs"
      >
        {action}
      </Button>
    </div>
  );
}
