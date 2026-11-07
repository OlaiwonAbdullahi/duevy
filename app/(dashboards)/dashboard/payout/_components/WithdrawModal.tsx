"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  Alert01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  InformationCircleIcon,
  MoneySend01Icon,
  SignatureIcon,
} from "@hugeicons/core-free-icons";
import { Modal } from "../../_components/Modal";
import { BARE_INPUT } from "../../_components/form-styles";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { isDemoMode } from "@/lib/demo/mode";
import { lookupBeneficiary, type WithdrawableDue } from "@/lib/api/payouts";
import { usePayoutQuote } from "@/lib/api/queries";
import { ApiError } from "@/lib/api/errors";
import type { PayoutSummary, WithdrawalFeeBand } from "@/lib/api/types";
import { nairaFromKobo } from "../../_components/format";
import { maskAccount } from "./data";
import { BankLogo } from "./BankLogo";
import { AccountFields, type VerifiedAccount } from "./AccountFields";
import type { Beneficiary } from "./types";
import { SecurityCodeInput } from "./SecurityCodeInput";
import { describeWithdrawError, type WithdrawErrorInfo } from "./withdraw-errors";
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

/** One confirmed attempt. The same `idempotencyKey` is sent again if the rep retries it unchanged. */
export type WithdrawRequest = {
  /** Gross, in kobo. */
  amountKobo: number;
  target: WithdrawTarget;
  auth: WithdrawAuth;
  idempotencyKey: string;
};

/** The "Send to" choice that means a one-off account typed in here. */
const NEW_ACCOUNT = "new";
/** The "Withdraw from" choice that means the whole department balance. */
const WHOLE_SPACE = "space";
/** Wait this long after the last keystroke before asking the server for a quote. */
const QUOTE_DEBOUNCE_MS = 300;

function useDebounced<T>(value: T, ms: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(timer);
  }, [value, ms]);
  return debounced;
}

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

function bandLabel(band: WithdrawalFeeBand) {
  if (band.toKobo == null) return `${nairaFromKobo(band.fromKobo)} and above`;
  if (band.fromKobo <= 0) return `Under ${nairaFromKobo(band.toKobo)}`;
  return `${nairaFromKobo(band.fromKobo)} – under ${nairaFromKobo(band.toKobo)}`;
}

function InlineError({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <p id={id} className="mt-1.5 flex items-start gap-1 text-xs font-medium text-rose-600">
      <HugeiconsIcon icon={Alert01Icon} size={13} className="mt-px shrink-0" />
      <span>{children}</span>
    </p>
  );
}

export function WithdrawModal({
  spaceId,
  summary,
  beneficiaries,
  dues = [],
  spaceWide = true,
  onClose,
  onConfirm,
  onForgotPin,
}: {
  spaceId: string;
  /** Balance, limits, fee bands and the auth mode — all from the server. */
  summary: PayoutSummary;
  beneficiaries: Beneficiary[];
  /** Dues the rep can draw on, each with what's left of it (kobo). */
  dues?: WithdrawableDue[];
  /** The lead can draw on the whole balance; a co-rep only on their dues. */
  spaceWide?: boolean;
  onClose: () => void;
  /** Resolves once the server accepted it; rejects with the API error otherwise. */
  onConfirm: (request: WithdrawRequest) => Promise<void>;
  /** "Forgot code?" — switches to resetting it. `pin` mode only. */
  onForgotPin?: () => void;
}) {
  const mode = summary.withdrawalAuthMode ?? "pin";
  const needsCode = mode === "pin";
  const minPayout = summary.minPayout;
  const maxPayout = summary.maxPayout ?? null;
  const dailyRemaining = summary.funds?.dailyRemainingKobo ?? null;
  const bands = summary.fees.bands ?? [];

  // Which balance it draws on: the whole department, or one due.
  const [pickedSource, setSource] = useState<string | null>(null);
  const source =
    pickedSource && (pickedSource === WHOLE_SPACE ? spaceWide : dues.some((d) => d.id === pickedSource))
      ? pickedSource
      : spaceWide
        ? WHOLE_SPACE
        : dues[0]?.id ?? WHOLE_SPACE;
  const sourceDue = dues.find((d) => d.id === source) ?? null;
  // A due can't pay out more than it has left, nor more than the department holds (kobo).
  const available = sourceDue ? Math.min(summary.available, sourceDue.available) : summary.available;

  // Whole naira, digits only.
  const [amount, setAmount] = useState("");
  const amountKobo = (Number(amount) || 0) * 100;

  // A beneficiary id or NEW_ACCOUNT. Defaults to the newest beneficiary, or to
  // a new account when there are none.
  const [picked, setPicked] = useState<string | null>(null);
  const choice =
    picked === NEW_ACCOUNT || (picked && beneficiaries.some((b) => b.id === picked))
      ? picked
      : beneficiaries[0]?.id ?? NEW_ACCOUNT;
  const [newAccount, setNewAccount] = useState<VerifiedAccount | null>(null);
  const [saveAsBeneficiary, setSaveAsBeneficiary] = useState(false);

  // "details" = amount + recipient; "review" = what's about to happen, then the code.
  const [step, setStep] = useState<"details" | "review">("details");
  const [pin, setPin] = useState("");
  const pinValid = /^\d{4}$/.test(pin);
  const [submitting, setSubmitting] = useState(false);
  // A ref as well as state: a double-click lands before React re-renders the disabled button.
  const inFlight = useRef(false);
  const [error, setError] = useState<WithdrawErrorInfo | null>(null);

  // One Idempotency-Key per attempt, reused while the attempt (amount, recipient, due) is unchanged.
  const attempt = useRef<{ fingerprint: string; key: string } | null>(null);

  // Client checks mirror the server's, so the rep hears about them before confirming.
  const tooLittle = amountKobo > 0 && amountKobo < minPayout;
  const aboveMax = maxPayout != null && amountKobo > maxPayout;
  const tooMuch = amountKobo > available;
  const overDaily = dailyRemaining != null && amountKobo > dailyRemaining;
  const amountError = tooLittle
    ? `The minimum withdrawal is ${nairaFromKobo(minPayout)}.`
    : aboveMax
      ? `The most per withdrawal is ${nairaFromKobo(maxPayout!)}. Split it into several withdrawals.`
      : tooMuch
        ? sourceDue
          ? `That's more than what's left of “${sourceDue.title}” (${nairaFromKobo(available)}).`
          : `That's more than the available balance (${nairaFromKobo(available)}).`
        : overDaily
          ? dailyRemaining! > 0
            ? `Only ${nairaFromKobo(dailyRemaining!)} more can be withdrawn today.`
            : "Today's withdrawal limit has been reached. It resets at midnight, Lagos time."
          : null;
  const amountValid = amountKobo > 0 && !amountError;

  // The server's fee and net, for the amount once typing settles. Never computed here.
  const debouncedKobo = useDebounced(amountValid ? amountKobo : 0, QUOTE_DEBOUNCE_MS);
  const quoteQuery = usePayoutQuote(spaceId, debouncedKobo);
  const quote = quoteQuery.data && quoteQuery.data.amount === amountKobo ? quoteQuery.data : null;
  const quoteLoading = amountValid && !quote && !quoteQuery.isError;
  const serverRefuses = !!quote && (quote.belowMinimum || !!quote.aboveMaximum);

  const target: WithdrawTarget | null =
    choice === NEW_ACCOUNT
      ? newAccount && { account: newAccount, saveAsBeneficiary }
      : { beneficiaryId: choice };
  const recipient = useMemo(() => {
    if (choice === NEW_ACCOUNT) {
      return newAccount
        ? {
            name: newAccount.accountName,
            bankName: newAccount.bankName,
            bankCode: newAccount.bankCode,
            masked: maskAccount(newAccount.accountNumber),
            label: null as string | null,
          }
        : null;
    }
    const b = beneficiaries.find((x) => x.id === choice);
    return b
      ? { name: b.accountName, bankName: b.bankName, bankCode: b.bankCode, masked: b.accountNumber, label: b.label }
      : null;
  }, [choice, newAccount, beneficiaries]);

  const canReview = amountValid && !!target && !!quote && !serverRefuses;

  const maxAmountKobo = Math.max(
    0,
    Math.min(available, maxPayout ?? Infinity, dailyRemaining ?? Infinity),
  );

  const goToReview = () => {
    if (!canReview) return;
    setPin("");
    setError(null);
    setStep("review");
  };

  const confirm = async () => {
    if (inFlight.current || !canReview || !target || (needsCode && !pinValid)) return;
    const auth: WithdrawAuth = { ...(needsCode ? { pin } : {}), ...(sourceDue ? { dueId: sourceDue.id } : {}) };
    const fingerprint = JSON.stringify({
      amountKobo,
      to: "beneficiaryId" in target ? target.beneficiaryId : `${target.account.bankCode}:${target.account.accountNumber}`,
      dueId: auth.dueId ?? null,
    });
    if (attempt.current?.fingerprint !== fingerprint) {
      attempt.current = { fingerprint, key: crypto.randomUUID() };
    }
    inFlight.current = true;
    setSubmitting(true);
    setError(null);
    try {
      await onConfirm({ amountKobo, target, auth, idempotencyKey: attempt.current.key });
    } catch (err) {
      const info = describeWithdrawError(err);
      // A definite refusal (4xx) created nothing and isn't stored, so the next try is a new
      // attempt with a new key. On a network error or 5xx the outcome is unknown: keep the key
      // so a retry replays the original instead of sending a second withdrawal.
      if (err instanceof ApiError && err.status < 500 && err.code !== "IDEMPOTENCY_IN_PROGRESS") {
        attempt.current = null;
      }
      if (info.close) {
        toast.error(info.title, { description: info.description });
        onClose();
        return;
      }
      setError(info);
      if (info.backToDetails) setStep("details");
    } finally {
      // Never leave the code sitting in the field after an attempt.
      setPin("");
      setSubmitting(false);
      inFlight.current = false;
    }
  };

  const optionClass = (selected: boolean) =>
    cn(
      "flex items-center gap-3 rounded-2xl border p-3 text-left transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40",
      selected ? "border-brand bg-cloud/40" : "border-cloud bg-paper hover:bg-cloud/30",
    );

  const errorBanner = error && (
    <div
      role="alert"
      className="mb-4 flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700"
    >
      <HugeiconsIcon icon={Alert01Icon} size={16} className="mt-px shrink-0" />
      <div className="min-w-0">
        <p className="text-sm font-semibold">{error.title}</p>
        <p className="mt-0.5 text-xs leading-relaxed">{error.description}</p>
      </div>
    </div>
  );

  return (
    <Modal title={step === "review" ? "Review withdrawal" : "Withdraw funds"} icon={MoneySend01Icon} onClose={onClose}>
      {/* Hidden, not unmounted, so Back keeps a typed-in account intact. */}
      <div hidden={step !== "details"}>
        {step === "details" && errorBanner}
        {/* The demo skips the per-due picker and withdraws from the default source. */}
        {!isDemoMode() && dues.length > 0 && (dues.length > 1 || spaceWide) && (
          <div className="mb-4">
            <label htmlFor="withdraw-source" className="block text-xs font-medium text-ink-soft">
              Take money from
            </label>
            <Select value={source} onValueChange={setSource}>
              <SelectTrigger id="withdraw-source" className="mt-1.5 h-12 rounded-2xl text-sm font-normal sm:w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {spaceWide && (
                  <SelectItem value={WHOLE_SPACE}>All dues · {nairaFromKobo(summary.available)} available</SelectItem>
                )}
                {dues.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.title} · {nairaFromKobo(d.available)} available
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="mt-1.5 text-[11px] leading-relaxed text-ink-soft">
              Each due has its own balance: what students paid for it, minus what&apos;s already been withdrawn from it.
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2.5">
          <div className="min-w-0 rounded-2xl border border-cloud bg-paper p-3.5">
            <p className="truncate text-[11px] font-medium text-ink-soft">
              Available{sourceDue ? ` in “${sourceDue.title}”` : ""}
            </p>
            <p className="mt-1 truncate text-lg font-semibold tracking-tight text-ink tabular-nums">
              {nairaFromKobo(available)}
            </p>
          </div>
          {dailyRemaining != null && (
            <div className="min-w-0 rounded-2xl border border-cloud bg-paper p-3.5">
              <p className="truncate text-[11px] font-medium text-ink-soft">Left today</p>
              <p className="mt-1 truncate text-lg font-semibold tracking-tight text-ink tabular-nums">
                {nairaFromKobo(dailyRemaining)}
              </p>
            </div>
          )}
        </div>

        <div className="mt-4">
          <label htmlFor="withdraw-amount" className="block text-xs font-medium text-ink-soft">
            Amount
          </label>
          <div
            className={cn(
              "mt-1.5 flex items-center rounded-2xl border bg-canvas px-4 focus-within:border-brand",
              amountError ? "border-rose-300" : "border-cloud",
            )}
          >
            <span className="text-sm font-semibold text-ink-soft">₦</span>
            <Input
              id="withdraw-amount"
              inputMode="numeric"
              autoComplete="off"
              value={amount ? Number(amount).toLocaleString("en-NG") : ""}
              onChange={(e) => {
                setAmount(e.target.value.replace(/[^0-9]/g, "").replace(/^0+/, "").slice(0, 9));
                setError(null);
              }}
              placeholder="0"
              aria-invalid={!!amountError}
              aria-describedby={amountError ? "withdraw-amount-error" : "withdraw-amount-hint"}
              className={cn(BARE_INPUT, "flex-1 tabular-nums")}
            />
            <button
              type="button"
              onClick={() => setAmount(String(Math.floor(maxAmountKobo / 100) || ""))}
              disabled={maxAmountKobo < 100}
              className="shrink-0 rounded-full bg-cloud px-3 py-1 text-[11px] font-semibold text-brand transition-colors hover:bg-brand hover:text-white disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
            >
              Max
            </button>
          </div>
          {amountError ? (
            <InlineError id="withdraw-amount-error">{amountError}</InlineError>
          ) : (
            <p id="withdraw-amount-hint" className="mt-1.5 text-[11px] text-ink-soft tabular-nums">
              {nairaFromKobo(minPayout)}
              {maxPayout != null ? ` to ${nairaFromKobo(maxPayout)} per withdrawal` : " minimum"}
            </p>
          )}

          {amountValid && (
            <dl
              aria-live="polite"
              className={cn(
                "mt-3 flex flex-col gap-1.5 rounded-2xl border border-cloud bg-paper/50 px-4 py-3 text-xs transition-opacity",
                quoteLoading && "opacity-60",
              )}
            >
              <div className="flex justify-between text-ink-soft">
                <dt>Transfer fee</dt>
                <dd className="tabular-nums">
                  {quote ? (quote.fee > 0 ? `−${nairaFromKobo(quote.fee)}` : "Free") : quoteLoading ? "Checking…" : "—"}
                </dd>
              </div>
              <div className="flex justify-between font-semibold text-ink">
                <dt>They&apos;ll receive</dt>
                <dd className="tabular-nums">{quote ? nairaFromKobo(quote.net) : "—"}</dd>
              </div>
              {quoteQuery.isError && !quote && (
                <div className="flex items-center justify-between gap-2 text-rose-600">
                  <span>Couldn&apos;t get the fee.</span>
                  <button
                    type="button"
                    onClick={() => void quoteQuery.refetch()}
                    className="font-semibold underline-offset-2 hover:underline cursor-pointer"
                  >
                    Try again
                  </button>
                </div>
              )}
              {quote?.aboveMaximum && <dd className="text-rose-600">Above the per-withdrawal maximum.</dd>}
              {quote?.belowMinimum && <dd className="text-rose-600">Below the minimum withdrawal.</dd>}
            </dl>
          )}

          {bands.length > 0 && (
            <details className="group mt-2 rounded-2xl px-1 text-[11px] text-ink-soft">
              <summary className="flex cursor-pointer list-none items-center gap-1 font-medium text-ink-soft hover:text-ink [&::-webkit-details-marker]:hidden">
                <HugeiconsIcon icon={InformationCircleIcon} size={13} />
                How transfer fees work
                <HugeiconsIcon icon={ArrowRight01Icon} size={12} className="transition-transform group-open:rotate-90" />
              </summary>
              <p className="mt-1.5">9jaPay&apos;s bank transfer charge, deducted from the withdrawal:</p>
              <table className="mt-1.5 w-full tabular-nums">
                <tbody>
                  {bands.map((band) => (
                    <tr key={band.fromKobo} className="border-t border-cloud first:border-t-0">
                      <td className="py-1">{bandLabel(band)}</td>
                      <td className="py-1 text-right font-semibold text-ink">{nairaFromKobo(band.feeKobo)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          )}
        </div>

        <div className="mt-4">
          <p id="withdraw-to-label" className="text-xs font-medium text-ink-soft">
            Send to
          </p>
          <div role="radiogroup" aria-labelledby="withdraw-to-label" className="mt-1.5 flex flex-col gap-2">
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
                      onClick={() => {
                        setPicked(b.id);
                        setError(null);
                      }}
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
              onClick={() => {
                setPicked(NEW_ACCOUNT);
                setError(null);
              }}
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
              <AccountFields lookup={(payload) => lookupBeneficiary(spaceId, payload)} onChange={setNewAccount} />
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
          Withdrawals usually arrive within minutes. If one fails, the full amount goes back to the balance. A
          successful transfer can&apos;t be pulled back.
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
            disabled={!canReview}
            onClick={goToReview}
            className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-brand text-sm font-semibold text-white transition-colors duration-300 hover:bg-brand-bright disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
          >
            Review
            <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
          </button>
        </div>
      </div>

      {step === "review" && quote && recipient && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void confirm();
          }}
          className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-right-2"
        >
          {errorBanner}

          {/* What they're about to send, so the code confirms something concrete. */}
          <section className="rounded-2xl bg-paper p-4">
            <p className="text-[11px] font-medium text-ink-soft">They&apos;ll receive</p>
            <p className="mt-1 text-[28px] font-semibold leading-none tracking-tight text-ink tabular-nums">
              {nairaFromKobo(quote.net)}
            </p>
            <dl className="mt-4 flex flex-col gap-2 text-xs">
              <div className="flex justify-between gap-3 text-ink-soft">
                <dt>Amount</dt>
                <dd className="font-semibold text-ink tabular-nums">{nairaFromKobo(quote.amount)}</dd>
              </div>
              <div className="flex justify-between gap-3 text-ink-soft">
                <dt>Transfer fee</dt>
                <dd className="font-semibold text-ink tabular-nums">
                  {quote.fee > 0 ? `−${nairaFromKobo(quote.fee)}` : "Free"}
                </dd>
              </div>
              <div className="my-1 border-t border-dashed border-ink-soft/25" />
              <div className="flex justify-between gap-3 text-ink-soft">
                <dt>From</dt>
                <dd className="min-w-0 truncate text-right font-semibold text-ink">
                  {sourceDue ? sourceDue.title : "Whole department balance"}
                </dd>
              </div>
            </dl>
          </section>

          <section className="mt-3 flex items-center gap-3 rounded-2xl border border-cloud bg-canvas p-3.5">
            <BankLogo name={recipient.bankName} code={recipient.bankCode} className="h-10 w-10 shrink-0 text-[11px]" />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium text-ink-soft">Sending to</p>
              <p className="truncate text-sm font-semibold text-ink">{recipient.name}</p>
              <p className="truncate text-xs text-ink-soft">
                {recipient.label ? `${recipient.label} · ` : ""}
                {recipient.bankName} · {recipient.masked}
              </p>
            </div>
          </section>

          {!needsCode && (
            <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-cloud bg-canvas px-4 py-3">
              <HugeiconsIcon icon={SignatureIcon} size={16} className="mt-px shrink-0 text-brand" />
              <p className="text-xs leading-5 text-ink-soft">
                <span className="font-semibold text-ink">Needs 2 approvals.</span> 2 of the department&apos;s 3
                signatories approve it with a code Duevy emails them before it&apos;s sent. The amount is set aside
                until then, and returned if it&apos;s rejected or not approved within 24 hours.
              </p>
            </div>
          )}

          {needsCode && (
            <div className="mt-5">
              <div className="flex items-center justify-between">
                <label htmlFor="withdrawal-pin" className="block text-xs font-medium text-ink-soft">
                  Security code
                </label>
                {onForgotPin && (
                  <button
                    type="button"
                    onClick={onForgotPin}
                    disabled={submitting}
                    className="text-xs font-semibold text-brand hover:underline cursor-pointer disabled:opacity-50"
                  >
                    Forgot code?
                  </button>
                )}
              </div>
              <SecurityCodeInput
                id="withdrawal-pin"
                value={pin}
                onChange={(next) => {
                  setPin(next);
                  if (error) setError(null);
                }}
                autoFocus
                disabled={submitting}
                className="mt-1.5"
              />
              <p className="mt-2 text-xs text-ink-soft">
                The department&apos;s 4-digit withdrawal code. 5 wrong tries lock it for 30 minutes.
              </p>
            </div>
          )}

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={() => {
                setError(null);
                setStep("details");
              }}
              disabled={submitting}
              className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full border border-cloud bg-canvas text-sm font-semibold text-ink transition-colors duration-300 hover:bg-paper disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
              Back
            </button>
            <button
              type="submit"
              disabled={(needsCode && !pinValid) || submitting}
              aria-busy={submitting}
              className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-brand text-sm font-semibold text-white transition-colors duration-300 hover:bg-brand-bright disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
            >
              {submitting && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
              {submitting ? "Sending…" : needsCode ? "Confirm withdrawal" : "Request approval"}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
