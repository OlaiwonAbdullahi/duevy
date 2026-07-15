"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DangerCard } from "../../_components/DangerCard";
import { useAuth } from "@/lib/auth/auth-context";
import { useRepSpace } from "../../_components/use-rep-space";
import { TransferLeadModal } from "./TransferLeadModal";
import { ArchiveSpaceModal } from "./ArchiveSpaceModal";

type PendingAction = "transfer" | "archive" | null;

/**
 * Irreversible department actions in the shared rose danger shell. Each
 * routes through its own password-confirmed modal.
 */
export function DangerZone() {
  const repSpace = useRepSpace();
  const spaceId = repSpace?.id;
  const { refreshUser } = useAuth();
  const router = useRouter();
  const [pending, setPending] = useState<PendingAction>(null);

  const afterTransfer = async () => {
    setPending(null);
    await refreshUser();
    router.push("/dashboard");
  };

  const afterArchive = async () => {
    setPending(null);
    await refreshUser();
    router.push("/dashboard");
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
          disabled={!spaceId}
          onClick={() => setPending("transfer")}
        />
        <Row
          title="Archive department"
          description="Stop new dues and join requests. Existing records stay available."
          action="Archive"
          disabled={!spaceId}
          onClick={() => setPending("archive")}
        />
      </div>

      {pending === "transfer" && spaceId && (
        <TransferLeadModal
          spaceId={spaceId}
          onClose={() => setPending(null)}
          onDone={afterTransfer}
        />
      )}
      {pending === "archive" && spaceId && (
        <ArchiveSpaceModal
          spaceId={spaceId}
          onClose={() => setPending(null)}
          onDone={afterArchive}
        />
      )}
    </DangerCard>
  );
}

function Row({
  title,
  description,
  action,
  disabled,
  onClick,
}: {
  title: string;
  description: string;
  action: string;
  disabled?: boolean;
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
        disabled={disabled}
        className="h-10 px-5 text-xs"
      >
        {action}
      </Button>
    </div>
  );
}
