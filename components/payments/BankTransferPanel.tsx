"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Alert01Icon,
  BankIcon,
  CheckmarkCircle02Icon,
  Copy01Icon,
  TestTube01Icon,
  Tick02Icon,
  Timer02Icon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { ApiError } from "@/lib/api/errors";
import { PAYMENTS_SANDBOX, simulateDeposit } from "@/lib/api/dev";
import type { CheckoutBankTransfer, CheckoutItem } from "@/lib/api/dues";

/** Exact naira with kobo, e.g. 659750 → "₦6,597.50" — what the payer must send. */
export const exactNaira = (kobo: number) =>
  `₦${(kobo / 100).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** "4:59" / "1:04:59". */
function formatCountdown(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

/** Milliseconds until `iso`, ticking every second until it reaches zero. */
function useMsLeft(iso: string) {
  const target = new Date(iso).getTime();
  const [now, setNow] = useState(() => Date.now());
  const done = now >= target;
  useEffect(() => {
    if (done) return;
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tick);
  }, [done]);
  return target - now;
}

/** Under this, the countdown turns amber so the payer knows to hurry. */
const HURRY_MS = 5 * 60_000;

const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40";

/**
 * Face / fee / total, always as the server computed them. `items` lists each
 * due when a basket covers more than one.
 */
export function PaymentBreakdown({
  face,
  fee,
  total,
  items,
  className,
}: {
  face: number;
  fee: number;
  total: number;
  items?: CheckoutItem[];
  className?: string;
}) {
  const multi = !!items && items.length > 1;
  return (
    <div className={cn("rounded-2xl border border-cloud bg-paper/50 p-4 text-left", className)}>
      {multi && (
        <ul className="mb-3 flex flex-col gap-1.5 border-b border-cloud pb-3">
          {items.map((item) => (
            <li key={item.dueId} className="flex items-center justify-between gap-3 text-sm">
              <span className="min-w-0 truncate text-ink">{item.title}</span>
              <span className="shrink-0 font-medium tabular-nums text-ink">{exactNaira(item.amount)}</span>
            </li>
          ))}
        </ul>
      )}
      <dl className="flex flex-col gap-1.5 text-xs">
        <div className="flex items-center justify-between gap-3 text-ink-soft">
          <dt>{multi ? "Dues total" : "Due amount"}</dt>
          <dd className="font-medium tabular-nums text-ink">{exactNaira(face)}</dd>
        </div>
        <div className="flex items-center justify-between gap-3 text-ink-soft">
          <dt>Processing fee (1.5%)</dt>
          <dd className="font-medium tabular-nums text-ink">{exactNaira(fee)}</dd>
        </div>
        <div className="mt-0.5 flex items-center justify-between gap-3 border-t border-cloud pt-2">
          <dt className="font-medium text-ink-soft">Total</dt>
          <dd className="text-base font-semibold tracking-tight tabular-nums text-ink">{exactNaira(total)}</dd>
        </div>
      </dl>
    </div>
  );
}

/**
 * A screen-reader announcement of the payment's state. Keep it mounted across
 * status changes (outside any conditional) so the change itself is announced.
 */
export function PaymentStatusAnnouncer({ message }: { message: string }) {
  return (
    <p role="status" aria-live="polite" className="sr-only">
      {message}
    </p>
  );
}

/**
 * The one-time 9jaPay account a pending checkout is paid into: what to send,
 * where, and by when. It never decides the payment's outcome — the page polls
 * the API and swaps this out once the status is final. `onCheck` asks the API
 * again now; `onRefresh` is called after a sandbox deposit so the page reads the
 * status the API settled on.
 */
export function BankTransferPanel({
  reference,
  bankTransfer,
  expiresAt,
  breakdown,
  items,
  checking,
  onCheck,
  onRefresh,
  secondaryAction,
}: {
  reference: string;
  bankTransfer: CheckoutBankTransfer | null;
  /** The checkout's own expiry, used until the account is ready. */
  expiresAt: string;
  breakdown?: { face: number; fee: number; total: number };
  items?: CheckoutItem[];
  checking: boolean;
  onCheck: () => void;
  onRefresh: () => unknown;
  /** E.g. "Edit my details" — shown under the main button. */
  secondaryAction?: { label: string; onClick: () => void };
}) {
  const msLeft = useMsLeft(bankTransfer?.expiresAt ?? expiresAt);
  const closed = msLeft <= 0;
  const hurry = !closed && msLeft < HURRY_MS;
  const closesAt = new Date(bankTransfer?.expiresAt ?? expiresAt).toLocaleTimeString("en-NG", {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className="rounded-3xl border border-cloud bg-canvas p-5 sm:p-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-brand/10 text-brand">
          <HugeiconsIcon icon={BankIcon} size={22} />
        </span>
        <h1 className="text-lg font-semibold text-ink">Pay by bank transfer</h1>
        <p className="max-w-sm text-sm leading-relaxed text-ink-soft">
          Send the <span className="font-semibold text-ink">exact amount</span> to this one-time account from any
          bank app. We confirm it automatically.
        </p>
      </div>

      {!bankTransfer ? (
        <div className="mt-5 flex flex-col items-center gap-2 rounded-2xl border border-cloud bg-paper/50 p-5 text-center">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-brand/30 border-t-brand" aria-hidden />
          <p className="text-sm text-ink-soft">Setting up your transfer account…</p>
        </div>
      ) : (
        <>
          {closed && (
            <div className="mt-5 flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-left text-xs leading-relaxed text-rose-700">
              <HugeiconsIcon icon={Alert01Icon} size={16} className="mt-px shrink-0" />
              <p>
                <span className="font-semibold">This account has closed — don&apos;t send money to it.</span> We&apos;re
                waiting for the final update on this payment.
              </p>
            </div>
          )}

          <div className={cn("mt-5 flex flex-col gap-3 transition-opacity duration-300", closed && "opacity-50")}>
            <div className="rounded-2xl border border-brand/20 bg-cloud/60 p-4">
              <p className="text-[11px] font-medium text-ink-soft">Amount to send</p>
              <div className="mt-1 flex items-center justify-between gap-3">
                <p className="min-w-0 text-2xl font-semibold tracking-tight tabular-nums text-ink">
                  {exactNaira(bankTransfer.amountKobo)}
                </p>
                <CopyButton
                  disabled={closed}
                  value={(bankTransfer.amountKobo / 100).toFixed(2)}
                  what="Amount"
                />
              </div>
            </div>

            <div className="rounded-2xl border border-cloud bg-paper/50 p-4">
              <p className="text-[11px] font-medium text-ink-soft">Account number</p>
              <div className="mt-1 flex items-center justify-between gap-3">
                <p className="min-w-0 break-all font-mono text-xl font-semibold tracking-wider text-ink">
                  {bankTransfer.accountNumber}
                </p>
                <CopyButton disabled={closed} value={bankTransfer.accountNumber} what="Account number" />
              </div>
              <dl className="mt-3 grid grid-cols-1 gap-3 border-t border-cloud pt-3 text-sm min-[400px]:grid-cols-2">
                <div className="min-w-0">
                  <dt className="text-[11px] font-medium text-ink-soft">Bank</dt>
                  <dd className="truncate font-medium text-ink">{bankTransfer.bankName || "—"}</dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-[11px] font-medium text-ink-soft">Account name</dt>
                  <dd className="break-words font-medium text-ink">{bankTransfer.accountName || "—"}</dd>
                </div>
              </dl>
            </div>
          </div>

          {!closed && (
            <>
              <p
                role="timer"
                className={cn(
                  "mt-3 flex items-center justify-center gap-1.5 text-xs",
                  hurry ? "text-amber-700" : "text-ink-soft",
                )}
              >
                <HugeiconsIcon icon={Timer02Icon} size={14} aria-hidden />
                <span>
                  Account closes in <span className="font-semibold tabular-nums">{formatCountdown(msLeft)}</span>
                  <span className="sr-only">, at {closesAt}</span>
                </span>
              </p>

              <ul className="mt-4 flex flex-col gap-2 rounded-2xl bg-cloud/40 p-4 text-xs leading-relaxed text-ink-soft">
                <Guidance>
                  Send exactly <span className="font-semibold text-ink">{exactNaira(bankTransfer.amountKobo)}</span> in
                  one transfer. Any other amount is refused by the bank.
                </Guidance>
                <Guidance>
                  This account is for this payment only and closes at{" "}
                  <span className="font-medium text-ink">{closesAt}</span>. Don&apos;t save it for later.
                </Guidance>
                <Guidance>Transfers usually confirm within a minute. You can keep this page open or come back to it.</Guidance>
              </ul>
            </>
          )}
        </>
      )}

      {breakdown && <PaymentBreakdown {...breakdown} items={items} className="mt-4" />}

      <div className="mt-5 flex items-center justify-center gap-2 text-xs text-ink-soft">
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-brand/30 border-t-brand" aria-hidden />
        {closed ? "Checking for a final update…" : "Waiting for your transfer — this page updates on its own."}
      </div>

      <button
        type="button"
        disabled={checking}
        onClick={onCheck}
        className={cn(
          "mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand text-sm font-semibold text-white transition-colors duration-300 hover:bg-brand-bright disabled:opacity-60 cursor-pointer",
          FOCUS,
        )}
      >
        {checking ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden />
        ) : (
          <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} aria-hidden />
        )}
        {checking ? "Checking…" : closed ? "Check status" : "I've sent the money"}
      </button>

      {PAYMENTS_SANDBOX && bankTransfer && !closed && (
        <SandboxDeposit bankTransfer={bankTransfer} onDone={onRefresh} />
      )}

      {secondaryAction && (
        <button
          type="button"
          onClick={secondaryAction.onClick}
          className={cn(
            "mt-3 inline-flex h-11 w-full items-center justify-center rounded-full border border-cloud text-sm font-semibold text-ink transition-colors duration-300 hover:border-brand/40 hover:text-brand cursor-pointer",
            FOCUS,
          )}
        >
          {secondaryAction.label}
        </button>
      )}

      <p className="mt-3 text-center text-[11px] text-ink-soft">
        Reference <span className="font-semibold text-ink">{reference}</span>
      </p>
    </div>
  );
}

function Guidance({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <HugeiconsIcon icon={Tick02Icon} size={13} className="mt-0.5 shrink-0 text-brand" aria-hidden />
      <span>{children}</span>
    </li>
  );
}

function CopyButton({ value, what, disabled }: { value: string; what: string; disabled?: boolean }) {
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => setDone(false), 2000);
    return () => clearTimeout(t);
  }, [done]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setDone(true);
      toast.success(`${what} copied`);
    } catch {
      toast.error("Couldn't copy — select it and copy manually.");
    }
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => void copy()}
      aria-label={done ? `${what} copied` : `Copy ${what.toLowerCase()}`}
      className={cn(
        "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-cloud bg-canvas px-3 text-xs font-semibold text-brand transition-colors duration-300 hover:bg-cloud disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer",
        FOCUS,
      )}
    >
      <HugeiconsIcon icon={done ? Tick02Icon : Copy01Icon} size={14} aria-hidden />
      {done ? "Copied" : "Copy"}
    </button>
  );
}

/**
 * Sandbox builds only: pretend the exact total was transferred into the
 * account, then have the page read the status back from the API. Nothing here
 * marks the payment paid.
 */
function SandboxDeposit({ bankTransfer, onDone }: { bankTransfer: CheckoutBankTransfer; onDone: () => unknown }) {
  const [busy, setBusy] = useState(false);

  const simulate = async () => {
    setBusy(true);
    try {
      await simulateDeposit(bankTransfer.accountNumber, bankTransfer.amountKobo);
      toast.info("Test transfer sent", { description: "Waiting for the API to confirm it…" });
    } catch (err) {
      const code = err instanceof ApiError ? err.code : null;
      toast.error("Simulated transfer failed", {
        description:
          code === "AMOUNT_MISMATCH"
            ? "The amount didn't match this checkout's total."
            : code === "DEPOSIT_REFUSED"
              ? "9jaPay refused it — the account may be closed or already paid."
              : err instanceof ApiError && err.status === 404
                ? "This API isn't a sandbox."
                : err instanceof ApiError
                  ? err.message
                  : "Check your connection and try again.",
      });
    } finally {
      setBusy(false);
      await onDone();
    }
  };

  return (
    <div className="mt-3 rounded-2xl border border-dashed border-amber-300 bg-amber-50/60 p-3">
      <p className="text-center text-[11px] font-medium uppercase tracking-[0.12em] text-amber-700">Sandbox</p>
      <button
        type="button"
        disabled={busy}
        onClick={() => void simulate()}
        className={cn(
          "mt-2 inline-flex h-10 w-full items-center justify-center gap-2 rounded-full border border-amber-300 bg-canvas text-sm font-semibold text-amber-800 transition-colors duration-300 hover:bg-amber-50 disabled:opacity-60 cursor-pointer",
          FOCUS,
        )}
      >
        {busy ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-amber-300 border-t-amber-700" aria-hidden />
        ) : (
          <HugeiconsIcon icon={TestTube01Icon} size={15} aria-hidden />
        )}
        {busy ? "Sending test transfer…" : `Simulate transfer of ${exactNaira(bankTransfer.amountKobo)}`}
      </button>
    </div>
  );
}
