"use client";

import { useEffect, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  Alert01Icon,
  MoneySend01Icon,
} from "@hugeicons/core-free-icons";
import { Modal } from "../../_components/Modal";
import { BARE_INPUT } from "../../_components/form-styles";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { getPayoutQuote } from "@/lib/api/payouts";
import type { PayoutQuote } from "@/lib/api/types";
import { fromKobo } from "../../_components/format";
import { naira } from "./data";
import { BankLogo } from "./BankLogo";
import { AccountFields, type VerifiedAccount } from "./AccountFields";
import type { Beneficiary } from "./types";

/** Where the rep chose to send it. */
export type WithdrawTarget =
  | { beneficiaryId: string }
  | { account: VerifiedAccount; saveAsBeneficiary: boolean };

/** The "Send to" choice that means a one-off account typed in here. */
const NEW_ACCOUNT = "new";

function Radio({ selected }: { selected: boolean }) {
  return (
    <span
      className={cn(
        "grid h-4 w-4 shrink-0 place-items-center rounded-full border",
        selected ? "border-brand" : "border-cloud",
      )}
    >
      {selected && <span className="h-2 w-2 rounded-full bg-brand" />}
    </span>
  );
}

export function WithdrawModal({
  spaceId,
  available,
  minPayout,
  beneficiaries,
  onClose,
  onConfirm,
}: {
  spaceId: string;
  /** Naira. */
  available: number;
  /** Naira. */
  minPayout: number;
  beneficiaries: Beneficiary[];
  onClose: () => void;
  onConfirm: (amount: number, target: WithdrawTarget) => Promise<void>;
}) {
  const [amount, setAmount] = useState("");
  // A beneficiary id or NEW_ACCOUNT. Defaults to the newest beneficiary, or to
  // a new account when there are none.
  const [picked, setPicked] = useState<string | null>(null);
  const choice =
    picked === NEW_ACCOUNT || (picked && beneficiaries.some((b) => b.id === picked))
      ? picked
      : beneficiaries[0]?.id ?? NEW_ACCOUNT;
  const [newAccount, setNewAccount] = useState<VerifiedAccount | null>(null);
  const [saveAsBeneficiary, setSaveAsBeneficiary] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const parsed = Number(amount.replace(/[^0-9]/g, ""));
  const tooMuch = parsed > available;
  const tooLittle = parsed > 0 && parsed < minPayout;
  const valid = parsed > 0 && !tooMuch && !tooLittle;
  const target: WithdrawTarget | null =
    choice === NEW_ACCOUNT
      ? newAccount && { account: newAccount, saveAsBeneficiary }
      : { beneficiaryId: choice };

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
    if (!valid || !target) return;
    setSubmitting(true);
    try {
      await onConfirm(parsed, target);
    } finally {
      setSubmitting(false);
    }
  };

  const optionClass = (selected: boolean) =>
    cn(
      "flex items-center gap-3 rounded-2xl border p-3 text-left transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40",
      selected ? "border-brand bg-cloud/40" : "border-cloud bg-paper hover:bg-cloud/30",
    );

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
              <dt>They&apos;ll receive</dt>
              <dd className="tabular-nums">{naira(fromKobo(quote.net))}</dd>
            </div>
          </dl>
        )}
      </div>

      <div className="mt-4">
        <p className="text-xs font-medium text-ink-soft">Send to</p>
        <div role="radiogroup" className="mt-1.5 flex flex-col gap-2">
          {beneficiaries.length > 0 && (
            <div className="flex max-h-56 flex-col gap-2 overflow-y-auto">
              {beneficiaries.map((b) => {
                const selected = b.id === choice;
                return (
                  <button
                    key={b.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setPicked(b.id)}
                    className={optionClass(selected)}
                  >
                    <BankLogo name={b.bankName} className="h-9 w-9 shrink-0 text-[11px]" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-ink">{b.accountName}</span>
                      <span className="block truncate text-xs text-ink-soft">
                        {b.label ? `${b.label} · ` : ""}
                        {b.bankName} {b.accountNumber}
                      </span>
                    </span>
                    <Radio selected={selected} />
                  </button>
                );
              })}
            </div>
          )}
          <button
            type="button"
            role="radio"
            aria-checked={choice === NEW_ACCOUNT}
            onClick={() => setPicked(NEW_ACCOUNT)}
            className={optionClass(choice === NEW_ACCOUNT)}
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-cloud text-brand">
              <HugeiconsIcon icon={Add01Icon} size={16} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-ink">Another account</span>
              <span className="block text-xs text-ink-soft">Enter an account number for this withdrawal</span>
            </span>
            <Radio selected={choice === NEW_ACCOUNT} />
          </button>
        </div>

        {choice === NEW_ACCOUNT && (
          <div className="mt-3 rounded-2xl border border-cloud p-4">
            <AccountFields spaceId={spaceId} onChange={setNewAccount} />
            <label className="mt-4 flex cursor-pointer items-center gap-2 text-xs text-ink">
              <input
                type="checkbox"
                checked={saveAsBeneficiary}
                onChange={(e) => setSaveAsBeneficiary(e.target.checked)}
                className="h-4 w-4 accent-[var(--color-brand)]"
              />
              Save as a beneficiary for next time
            </label>
          </div>
        )}
      </div>

      <p className="mt-3 text-xs leading-5 text-ink-soft">
        Withdrawals usually arrive within minutes. If one fails, the full amount
        goes back to your balance. A successful transfer can&apos;t be pulled back.
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
          disabled={!valid || !target || submitting}
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
