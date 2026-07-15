"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { UserSwitchIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Modal } from "../../_components/Modal";
import { UserAvatar } from "../../_components/UserAvatar";
import { EmptyState } from "../../_components/EmptyState";
import { Skeleton } from "../../_components/Skeleton";
import { BRAND_INPUT } from "../../_components/form-styles";
import { listReps, transferLead } from "@/lib/api/rep";
import { ApiError } from "@/lib/api/errors";
import type { SpaceRep } from "@/lib/api/types";

export function TransferLeadModal({
  spaceId,
  onClose,
  onDone,
}: {
  spaceId: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const [coReps, setCoReps] = useState<SpaceRep[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listReps(spaceId)
      .then((reps) => setCoReps(reps.filter((r) => r.role === "co")))
      .catch(() => {
        toast.error("Couldn't load your co-reps.");
        setCoReps([]);
      });
  }, [spaceId]);

  const valid = !!selectedId && password.length > 0;

  const submit = async () => {
    if (!valid || !selectedId) return;
    setSubmitting(true);
    setError(null);
    try {
      await transferLead(spaceId, { userId: selectedId, password });
      toast.success("Leadership transferred", {
        description: "You're now a co-rep of this department.",
      });
      onDone();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Couldn't transfer leadership. Please try again.",
      );
      setSubmitting(false);
    }
  };

  return (
    <Modal title="Transfer lead role" icon={UserSwitchIcon} onClose={onClose}>
      <p className="text-[13px] leading-5 text-ink-soft">
        The new lead takes over department ownership — dues, payouts and
        settings — and you become a co-rep. This can&apos;t be undone by you.
      </p>

      <div className="mt-5">
        <Label className="block text-xs font-medium text-ink-soft">
          New lead rep
        </Label>
        <div className="mt-1.5 flex flex-col gap-2">
          {coReps === null ? (
            <>
              <Skeleton className="h-14 rounded-2xl" />
              <Skeleton className="h-14 rounded-2xl" />
            </>
          ) : coReps.length === 0 ? (
            <EmptyState
              size="sm"
              icon={UserSwitchIcon}
              title="No co-reps yet"
              description="Invite a co-rep from “Reps & roles” first — the new lead must already be a co-rep."
            />
          ) : (
            coReps.map((rep) => {
              const active = rep.id === selectedId;
              return (
                <button
                  key={rep.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setSelectedId(rep.id)}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl border p-3 text-left transition-colors duration-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40",
                    active ? "border-brand bg-cloud" : "border-cloud bg-paper hover:bg-cloud/50",
                  )}
                >
                  <UserAvatar name={rep.name} size={36} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{rep.name}</p>
                    <p className="truncate text-xs text-ink-soft">{rep.email}</p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className="mt-4">
        <Label className="block text-xs font-medium text-ink-soft">
          Confirm your password
        </Label>
        <Input
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError(null);
          }}
          className={cn(BRAND_INPUT, "mt-1.5")}
        />
      </div>

      {error && (
        <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-2.5 text-xs text-rose-600">{error}</p>
      )}

      <Button
        variant="danger"
        size="pill-xl"
        disabled={!valid || submitting}
        onClick={submit}
        className="mt-6 w-full"
      >
        {submitting && (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
        )}
        {submitting ? "Transferring…" : "Transfer leadership"}
      </Button>
    </Modal>
  );
}
