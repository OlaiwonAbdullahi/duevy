"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CheckmarkCircle02Icon,
  Cancel01Icon,
  Clock01Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";
import { useRepSpace } from "../../_components/use-rep-space";
import { fromKobo } from "../../_components/format";
import { getPayout, castPayoutApproval, cancelPayout } from "@/lib/api/payouts";
import type { PayoutWithApproval } from "@/lib/api/types";
import { naira } from "./data";

/**
 * Every payout — lead's space-wide or a co-rep's due-scoped request — now needs
 * 70% of the space's reps to approve before it disburses. This surfaces
 * whatever's currently awaiting a decision so any rep can vote.
 */
export function PendingApprovalsCard({
  spaceId,
  payoutIds,
  onChanged,
}: {
  spaceId: string;
  /** IDs of payouts currently in `pending_approval`, from the history list. */
  payoutIds: string[];
  onChanged: () => void;
}) {
  const { user } = useAuth();
  const repSpace = useRepSpace();
  const isLead = repSpace?.membership !== "co";

  const [items, setItems] = useState<PayoutWithApproval[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (payoutIds.length === 0) {
      setItems([]);
      return;
    }
    let cancelled = false;
    Promise.all(payoutIds.map((id) => getPayout(spaceId, id)))
      .then((list) => {
        if (!cancelled) setItems(list);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spaceId, payoutIds.join(",")]);

  const vote = async (payoutId: string, decision: "approved" | "rejected") => {
    setBusyId(payoutId);
    try {
      await castPayoutApproval(spaceId, payoutId, decision);
      toast.success(decision === "approved" ? "Vote recorded: approved" : "Vote recorded: rejected");
      onChanged();
    } catch {
      toast.error("Couldn't record your vote.");
    } finally {
      setBusyId(null);
    }
  };

  const cancel = async (payoutId: string) => {
    setBusyId(payoutId);
    try {
      await cancelPayout(spaceId, payoutId);
      toast.success("Payout cancelled");
      onChanged();
    } catch {
      toast.error("Couldn't cancel this payout.");
    } finally {
      setBusyId(null);
    }
  };

  if (items === null || items.length === 0) return null;

  return (
    <section className="rounded-3xl border border-cloud bg-canvas p-4 sm:p-6">
      <div className="flex items-center gap-2">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-amber-100 text-amber-700">
          <HugeiconsIcon icon={Clock01Icon} size={16} />
        </span>
        <div>
          <h2 className="text-base font-semibold tracking-tight text-ink">
            Awaiting approval
          </h2>
          <p className="mt-0.5 text-xs text-ink-soft">
            Every payout needs 70% of your department&apos;s reps to approve before it disburses.
          </p>
        </div>
      </div>

      <ul className="mt-4 flex flex-col gap-3">
        {items.map((p) => {
          const myVote = p.approval.decisions.find((d) => d.repUserId === user?.id);
          const canCancel = isLead || p.requestedById === user?.id;
          const busy = busyId === p.id;
          return (
            <li key={p.id} className="rounded-2xl border border-cloud bg-paper p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-ink">
                    {naira(fromKobo(p.amount))}
                    {p.dueId ? " · due payout" : " · space-wide"}
                  </p>
                  <p className="text-xs text-ink-soft">{p.reference}</p>
                </div>
                <span className="text-xs font-semibold text-ink-soft tabular-nums">
                  {p.approval.approvedCount} of {p.approval.requiredCount} needed · {p.approval.totalReps} rep{p.approval.totalReps === 1 ? "" : "s"} total
                </span>
              </div>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-cloud">
                <div
                  className="h-full rounded-full bg-brand transition-all"
                  style={{
                    width: `${Math.min(100, (p.approval.approvedCount / p.approval.requiredCount) * 100)}%`,
                  }}
                />
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button
                  variant="brand"
                  size="pill"
                  disabled={busy || myVote?.decision === "approved"}
                  onClick={() => vote(p.id, "approved")}
                >
                  <HugeiconsIcon icon={CheckmarkCircle02Icon} size={14} />
                  {myVote?.decision === "approved" ? "You approved" : "Approve"}
                </Button>
                <Button
                  variant="brand-outline"
                  size="pill"
                  disabled={busy || myVote?.decision === "rejected"}
                  onClick={() => vote(p.id, "rejected")}
                >
                  <HugeiconsIcon icon={Cancel01Icon} size={14} />
                  {myVote?.decision === "rejected" ? "You rejected" : "Reject"}
                </Button>
                {canCancel && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => cancel(p.id)}
                    className="ml-auto text-xs font-semibold text-ink-soft transition-colors hover:text-rose-600 cursor-pointer disabled:opacity-60"
                  >
                    Cancel request
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
