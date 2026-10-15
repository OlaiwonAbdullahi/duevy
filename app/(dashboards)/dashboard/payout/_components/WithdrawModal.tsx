"use client";

import { useEffect, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  Alert01Icon,
  ArrowLeft01Icon,
  MoneySend01Icon,
} from "@hugeicons/core-free-icons";
import { Modal } from "../../_components/Modal";
import { BARE_INPUT } from "../../_components/form-styles";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { getPayoutQuote, lookupBeneficiary, type WithdrawableDue } from "@/lib/api/payouts";
import type { PayoutQuote, WithdrawalAuthMode } from "@/lib/api/types";
import { fromKobo } from "../../_components/format";
import { naira } from "./data";
import { BankLogo } from "./BankLogo";
import { AccountFields, type VerifiedAccount } from "./AccountFields";
import type { Beneficiary } from "./types";
import { SecurityCodeInput } from "./SecurityCodeInput";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/** Where the rep chose to send it. */
export type WithdrawTarget =
  | { beneficiaryId: string }
  | { account: VerifiedAccount; saveAsBeneficiary: boolean };

/** How it's authorised, and which due it draws on (none = the whole balance). */
export type WithdrawAuth = { pin?: string; dueId?: string };

/** The "Send to" choice that means a one-off account typed in here. */
const NEW_ACCOUNT = "new";
/** The "Withdraw from" choice that means the whole department balance. */
const WHOLE_SPACE = "space";

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
  available: spaceAvailable,
  minPayout,
  beneficiaries,
  mode = "pin",
  dues = [],
  spaceWide = true,
  onClose,
  onConfirm,
  onForgotPin,
}: {
  spaceId: string;
  /** The department balance, in naira. */
  available: number;
  /** Naira. */
  minPayout: number;
  beneficiaries: Beneficiary[];
  /** `pin`: ask for the security code. `multisig`: no code; signatories approve it afterwards. */
  mode?: WithdrawalAuthMode;
  /** Dues the rep can draw on, each with what's left of it (kobo). */
  dues?: WithdrawableDue[];
  /** The lead can draw on the whole balance; a co-rep only on their dues. */
  spaceWide?: boolean;
  onClose: () => void;
  onConfirm: (amount: number, target: WithdrawTarget, auth: WithdrawAuth) => Promise<void>;
  /** "Forgot code?" — switches to resetting it. `pin` mode only. */
  onForgotPin?: () => void;
}) {
  // Which balance it draws on: the whole department, or one due.
  const [pickedSource, setSource] = useState<string | null>(null);
  const source =
    pickedSource && (pickedSource === WHOLE_SPACE ? spaceWide : dues.some((d) => d.id === pickedSource))
      ? pickedSource
      : spaceWide
        ? WHOLE_SPACE
        : dues[0]?.id ?? WHOLE_SPACE;
  const sourceDue = dues.find((d) => d.id === source) ?? null;
  // A due can't pay out more than it collected, nor more than the department holds.
  const available = sourceDue ? Math.min(spaceAvailable, fromKobo(sourceDue.available)) : spaceAvailable;
  const needsCode = mode === "pin";

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
  // "details" = amount + recipient; "code" = the security code, asked for
  // only once the rep taps Withdraw.
  const [step, setStep] = useState<"details" | "code">("details");
  // The withdrawal security code the lead rep set.
  const [pin, setPin] = useState("");
  const pinValid = /^\d{4}$/.test(pin);

  const [submitting, setSubmitting] = useState(false);
  const parsed = Number(amount.replace(/[^0-9]/g, ""));
  const tooMuch = parsed > available;
  const tooLittle = parsed > 0 && parsed < minPayout;
  const valid = parsed > 0 && !tooMuch && !tooLittle;
  const target: WithdrawTarget | null =
    choice === NEW_ACCOUNT
      ? newAccount && { account: newAccount, saveAsBeneficiary }
      : { beneficiaryId: choice };
  const recipient =
    choice === NEW_ACCOUNT ? newAccount : beneficiaries.find((b) => b.id === choice) ?? null;

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

  const goToCode = () => {
    if (!valid || !target) return;
    setPin("");
    setStep("code");
  };

  const confirm = async () => {
    if (!valid || !target || (needsCode && !pinValid)) return;
    setSubmitting(true);
    try {
      await onConfirm(parsed, target, { ...(needsCode ? { pin } : {}), ...(sourceDue ? { dueId: sourceDue.id } : {}) });
    } finally {
      // Never leave the code sitting in the field after an attempt.
      setPin("");
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
      {/* Hidden, not unmounted, so Back keeps a typed-in account intact. */}
      <div hidden={step !== "details"}>
        {(dues.length > 0 && (dues.length > 1 || spaceWide)) && (
          <div className="mb-4">
            <label htmlFor="withdraw-source" className="block text-xs font-medium text-ink-soft">
              Take money from
            </label>
            <Select value={source} onValueChange={setSource}>
              <SelectTrigger
                id="withdraw-source"
                className="mt-1.5 h-12 rounded-2xl text-sm font-normal sm:w-full"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {spaceWide && (
                  <SelectItem value={WHOLE_SPACE}>
                    All dues · {naira(spaceAvailable)} available
                  </SelectItem>
                )}
                {dues.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.title} · {naira(fromKobo(d.available))} available
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="mt-1.5 text-[11px] leading-relaxed text-ink-soft">
              Each due has its own balance: what students paid for it, minus what&apos;s
              already been withdrawn from it.
            </p>
          </div>
        )}
        <div className="rounded-2xl border border-cloud bg-paper p-4">
          <p className="text-[11px] font-medium text-ink-soft">
            Available to withdraw{sourceDue ? ` from “${sourceDue.title}”` : ""}
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
              {sourceDue ? "Amount is more than what's left of this due." : "Amount is more than your available balance."}
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
                <dd className="tabular-nums">
                  {/* A partner discount is already netted out of `fee`; show what it was. */}
                  {(quote.discount ?? 0) > 0 && quote.feeBeforeDiscount != null && (
                    <span className="mr-1.5 line-through opacity-60">
                      {naira(fromKobo(quote.feeBeforeDiscount))}
                    </span>
                  )}
                  −{naira(fromKobo(quote.fee))}
                </dd>
              </div>
              {(quote.discount ?? 0) > 0 && (
                <div className="flex justify-between text-brand">
                  <dt>Partner discount (−{quote.discountPercent ?? 0}%)</dt>
                  <dd className="tabular-nums">{naira(fromKobo(quote.discount ?? 0))} saved</dd>
                </div>
              )}
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
                      <BankLogo name={b.bankName} code={b.bankCode} className="h-9 w-9 shrink-0 text-[11px]" />
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
              <AccountFields
                lookup={(payload) => lookupBeneficiary(spaceId, payload)}
                onChange={setNewAccount}
              />
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
            className="h-12 flex-1 rounded-full border border-cloud bg-canvas text-sm font-semibold text-ink transition-colors duration-300 hover:bg-paper cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!valid || !target}
            onClick={goToCode}
            className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-brand text-sm font-semibold text-white transition-colors duration-300 hover:bg-brand-bright disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
          >
            <HugeiconsIcon icon={MoneySend01Icon} size={16} />
            Withdraw
          </button>
        </div>
      </div>

      {step === "code" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void confirm();
          }}
        >
          {/* What they're about to send, so the code confirms something concrete. */}
          <dl className="flex flex-col gap-2 rounded-2xl border border-cloud bg-paper p-4 text-xs">
            <div className="flex justify-between gap-3 text-ink-soft">
              <dt>Amount</dt>
              <dd className="font-semibold text-ink tabular-nums">{naira(parsed)}</dd>
            </div>
            {quote && (
              <div className="flex justify-between gap-3 text-ink-soft">
                <dt>They&apos;ll receive</dt>
                <dd className="font-semibold text-ink tabular-nums">{naira(fromKobo(quote.net))}</dd>
              </div>
            )}
            {recipient && (
              <div className="flex justify-between gap-3 text-ink-soft">
                <dt>To</dt>
                <dd className="min-w-0 truncate text-right font-semibold text-ink">
                  {recipient.accountName} · {recipient.bankName}
                </dd>
              </div>
            )}
            {sourceDue && (
              <div className="flex justify-between gap-3 text-ink-soft">
                <dt>From</dt>
                <dd className="min-w-0 truncate text-right font-semibold text-ink">{sourceDue.title}</dd>
              </div>
            )}
          </dl>

          {!needsCode && (
            <p className="mt-5 rounded-2xl border border-cloud bg-canvas px-4 py-3 text-xs leading-5 text-ink-soft">
              2 of the department&apos;s 3 signatories must approve this with a code Duevy emails them before it&apos;s
              sent. The amount is set aside until then, and returned if it&apos;s rejected or not approved within 24 hours.
            </p>
          )}

          <div className="mt-5" hidden={!needsCode}>
            <div className="flex items-center justify-between">
              <label htmlFor="withdrawal-pin" className="block text-xs font-medium text-ink-soft">
                Security code
              </label>
              {onForgotPin && (
                <button
                  type="button"
                  onClick={onForgotPin}
                  className="text-xs font-semibold text-brand hover:underline cursor-pointer"
                >
                  Forgot code?
                </button>
              )}
            </div>
            <SecurityCodeInput
              id="withdrawal-pin"
              value={pin}
              onChange={setPin}
              autoFocus={needsCode}
              disabled={submitting}
              className="mt-1.5"
            />
            <p className="mt-2 text-xs text-ink-soft">
              The 4-digit code you set for withdrawals. 5 wrong tries lock it for 30 minutes.
            </p>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={() => setStep("details")}
              disabled={submitting}
              className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full border border-cloud bg-canvas text-sm font-semibold text-ink transition-colors duration-300 hover:bg-paper disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
              Back
            </button>
            <button
              type="submit"
              disabled={(needsCode && !pinValid) || submitting}
              className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-brand text-sm font-semibold text-white transition-colors duration-300 hover:bg-brand-bright disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
            >
              {submitting && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              )}
              {submitting ? "Requesting…" : needsCode ? "Confirm withdrawal" : "Request approval"}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
