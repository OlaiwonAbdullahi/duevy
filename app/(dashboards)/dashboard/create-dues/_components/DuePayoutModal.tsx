"use client";

import { useEffect, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Alert01Icon, MoneySend01Icon } from "@hugeicons/core-free-icons";
import { Modal } from "../../_components/Modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BARE_INPUT } from "../../_components/form-styles";
import { fromKobo } from "../../_components/format";
import { naira } from "./data";
import { getDuePayoutSummary, requestDuePayout } from "@/lib/api/payouts";

/**
 * Requesting a payout scoped to a single due's collected funds — for the lead,
 * or the co-rep this due is assigned to. Disburses immediately once requested.
 */
export function DuePayoutModal({
  spaceId,
  dueId,
  dueTitle,
  onClose,
  onRequested,
}: {
  spaceId: string;
  dueId: string;
  dueTitle: string;
  onClose: () => void;
  onRequested: () => void;
}) {
  const [available, setAvailable] = useState<number | null>(null);
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getDuePayoutSummary(spaceId, dueId)
      .then((summary) => {
        if (!cancelled) setAvailable(fromKobo(summary.available));
      })
      .catch(() => {
        if (!cancelled) setAvailable(0);
      });
    return () => {
      cancelled = true;
    };
  }, [spaceId, dueId]);

  const parsed = Number(amount.replace(/[^0-9]/g, ""));
  const tooMuch = available !== null && parsed > available;
  const valid = parsed > 0 && !tooMuch && available !== null;

  const submit = async () => {
    if (!valid) return;
    setSubmitting(true);
    try {
      await requestDuePayout(spaceId, dueId, { amount: parsed * 100 });
      onRequested();
      onClose();
    } catch {
      setSubmitting(false);
    }
  };

  return (
    <Modal title="Request payout" icon={MoneySend01Icon} onClose={onClose}>
      <div className="rounded-2xl border border-cloud bg-paper p-4">
        <p className="text-[11px] font-medium text-ink-soft">
          Available for &ldquo;{dueTitle}&rdquo;
        </p>
        <p className="mt-1 text-2xl font-semibold tracking-tight text-ink">
          {available === null ? "…" : naira(available)}
        </p>
      </div>

      <div className="mt-4">
        <label className="block text-xs font-medium text-ink-soft">Amount</label>
        <div className="mt-1.5 flex items-center rounded-2xl border border-cloud bg-canvas px-4 focus-within:border-brand">
          <span className="text-sm font-semibold text-ink-soft">₦</span>
          <Input
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
            placeholder="0"
            className={cn(BARE_INPUT, "flex-1")}
          />
          {available !== null && (
            <button
              type="button"
              onClick={() => setAmount(String(available))}
              className="shrink-0 rounded-full bg-cloud px-3 py-1 text-[11px] font-semibold text-brand transition-colors hover:bg-brand hover:text-white cursor-pointer"
            >
              Max
            </button>
          )}
        </div>
        {tooMuch && (
          <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-rose-600">
            <HugeiconsIcon icon={Alert01Icon} size={13} />
            Amount is more than what&apos;s available for this due.
          </p>
        )}
      </div>

      <p className="mt-3 text-xs leading-5 text-ink-soft">
        This is processed right away — you can track it from the Payout page.
      </p>

      <Button
        variant="brand"
        size="pill-xl"
        disabled={!valid || submitting}
        onClick={submit}
        className="mt-6 w-full"
      >
        {submitting ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
        ) : (
          <HugeiconsIcon icon={MoneySend01Icon} size={16} />
        )}
        {submitting ? "Requesting…" : "Request payout"}
      </Button>
    </Modal>
  );
}
