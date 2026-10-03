"use client";

import { useEffect, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Alert01Icon,
  BankIcon,
  MoneySend01Icon,
} from "@hugeicons/core-free-icons";
import { Modal } from "../../_components/Modal";
import { BARE_INPUT } from "../../_components/form-styles";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { getPayoutQuote } from "@/lib/api/payouts";
import type { PayoutQuote } from "@/lib/api/types";
import { fromKobo } from "../../_components/format";
import { accountLabel, naira } from "./data";
import type { BankAccount } from "./types";

export function WithdrawModal({
  spaceId,
  available,
  minPayout,
  account,
  onClose,
  onConfirm,
}: {
  spaceId: string;
  /** Naira. */
  available: number;
  /** Naira. */
  minPayout: number;
  account: BankAccount;
  onClose: () => void;
  onConfirm: (amount: number) => Promise<void>;
}) {
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const parsed = Number(amount.replace(/[^0-9]/g, ""));
  const tooMuch = parsed > available;
  const tooLittle = parsed > 0 && parsed < minPayout;
  const valid = parsed > 0 && !tooMuch && !tooLittle;

  // The fee is deducted from the withdrawal; quote it so the rep sees what lands.
  const [latestQuote, setQuote] = useState<PayoutQuote | null>(null);
  // Only show a quote for the amount currently typed.
  const quote = latestQuote?.amount === parsed * 100 ? latestQuote : null;
  useEffect(() => {
    if (!valid) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      getPayoutQuote(spaceId, parsed * 100)
        .then((q) => {
          if (!cancelled) setQuote(q);
        })
        .catch(() => {});
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [spaceId, parsed, valid]);

  const confirm = async () => {
    if (!valid) return;
    setSubmitting(true);
    try {
      await onConfirm(parsed);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title="Withdraw funds" icon={MoneySend01Icon} onClose={onClose}>
      <div className="rounded-2xl border border-cloud bg-paper p-4">
        <p className="text-[11px] font-medium text-ink-soft">
          Available to withdraw
        </p>
        <p className="mt-1 text-2xl font-semibold tracking-tight text-ink">
          {naira(available)}
        </p>
      </div>

      <div className="mt-4">
        <label className="block text-xs font-medium text-ink-soft">Amount</label>
        <div className="mt-1.5 flex items-center rounded-2xl border border-cloud bg-canvas px-4 focus-within:border-brand">
          <span className="text-sm font-semibold text-ink-soft">₦</span>
          <Input
            inputMode="numeric"
            value={amount}
            onChange={(e) =>
              setAmount(e.target.value.replace(/[^0-9]/g, ""))
            }
            placeholder="0"
            className={cn(BARE_INPUT, "flex-1")}
          />
          <button
            type="button"
            onClick={() => setAmount(String(Math.floor(available)))}
            className="shrink-0 rounded-full bg-cloud px-3 py-1 text-[11px] font-semibold text-brand transition-colors hover:bg-brand hover:text-white cursor-pointer"
          >
            Max
          </button>
        </div>
        {tooMuch && (
          <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-rose-600">
            <HugeiconsIcon icon={Alert01Icon} size={13} />
            Amount is more than your available balance.
          </p>
        )}
        {tooLittle && (
          <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-rose-600">
            <HugeiconsIcon icon={Alert01Icon} size={13} />
            The minimum withdrawal is {naira(minPayout)}.
          </p>
        )}
        {quote && valid && (
          <dl className="mt-3 flex flex-col gap-1.5 rounded-2xl border border-cloud bg-paper/50 px-4 py-3 text-xs">
            <div className="flex justify-between text-ink-soft">
              <dt>Withdrawal fee</dt>
              <dd className="tabular-nums">−{naira(fromKobo(quote.fee))}</dd>
            </div>
            <div className="flex justify-between font-semibold text-ink">
              <dt>You&apos;ll receive</dt>
              <dd className="tabular-nums">{naira(fromKobo(quote.net))}</dd>
            </div>
          </dl>
        )}
      </div>

      <div className="mt-4 flex items-center gap-3 rounded-2xl border border-cloud bg-paper p-4">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-cloud text-brand">
          <HugeiconsIcon icon={BankIcon} size={18} />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink">
            {account.accountName}
          </p>
          <p className="truncate text-xs text-ink-soft">
            {accountLabel(account)}
          </p>
        </div>
      </div>

      <p className="mt-3 text-xs leading-5 text-ink-soft">
        Withdrawals usually reach your bank within minutes. If one fails, the full
        amount goes back to your balance.
      </p>

      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          className="h-12 flex-1 rounded-full border border-cloud bg-canvas text-sm font-semibold text-ink transition-colors duration-300 hover:bg-paper disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={!valid || submitting}
          onClick={confirm}
          className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-brand text-sm font-semibold text-white transition-colors duration-300 hover:bg-brand-bright disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        >
          {submitting ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          ) : (
            <HugeiconsIcon icon={MoneySend01Icon} size={16} />
          )}
          {submitting ? "Requesting…" : "Withdraw"}
        </button>
      </div>
    </Modal>
  );
}
