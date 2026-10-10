"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft02Icon,
  BankIcon,
  CheckmarkCircle02Icon,
  Alert01Icon,
  Clock01Icon,
  Copy01Icon,
  Download04Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import {
  getPaymentStatus,
  dueReceiptPath,
  receiptPdfPath,
  type PaymentStatus,
} from "@/lib/api/dues";
import { apiClient } from "@/lib/api/client";
import { useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/errors";
import { nairaFromKobo } from "../../_components/format";

const BACKGROUND_POLL_MS = 5000;

/** Exact naira with kobo, e.g. 665038 → "₦6,650.38" — what the student must send. */
const exactNaira = (kobo: number) =>
  `₦${(kobo / 100).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

function formatCountdown(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

/**
 * Dedicated page for a bank-transfer checkout — a real URL to sit on
 * (bookmark, reload, come back to). Needs only the reference: GET
 * /payments/:reference/status returns the checkout with its one-time account,
 * so this works on a cold load too. Polling only reads; the provider's webhook
 * is what moves the status to paid / expired / underpaid.
 */
export default function PaymentPage() {
  const params = useParams<{ reference: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const reference = params.reference;
  const dueId = searchParams.get("dueId");
  const from = searchParams.get("from") === "assistant" ? "assistant" : "dues";
  const conversationId = searchParams.get("conversationId");

  const backHref =
    from === "assistant"
      ? `/dashboard/assistant${conversationId ? `?conversationId=${conversationId}` : ""}`
      : "/dashboard/dues";
  const backLabel = from === "assistant" ? "Back to Duey" : "Back to my dues";

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [checkout, setCheckout] = useState<PaymentStatus | null>(null);
  const [checking, setChecking] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const settled = useRef(false);

  const status = checkout?.status ?? "pending";

  const check = async (manual: boolean) => {
    if (settled.current) return;
    if (manual) setChecking(true);
    try {
      const res = await getPaymentStatus(reference);
      if (settled.current) return;
      setCheckout(res);
      if (res.status !== "pending") {
        settled.current = true;
        // Balances, dues and history all changed; refetch them on next view.
        void queryClient.invalidateQueries();
        return;
      }
      if (manual) {
        toast.info("Still waiting for your transfer", {
          description:
            "Transfers usually land within a minute or two. We'll keep checking automatically.",
        });
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        settled.current = true;
        setNotFound(true);
        return;
      }
      if (manual) {
        toast.error(err instanceof ApiError ? err.message : "Couldn't check payment status.");
      }
    } finally {
      if (manual) setChecking(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    const first = setTimeout(() => void check(false), 0);
    return () => clearTimeout(first);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reference]);

  // Poll while the tab is visible; a hidden tab stops hitting the API and
  // checks again the moment it's back in view.
  useEffect(() => {
    if (status !== "pending" || notFound) return;
    let interval: ReturnType<typeof setInterval> | undefined;
    const start = () => {
      if (interval) return;
      interval = setInterval(() => check(false), BACKGROUND_POLL_MS);
    };
    const stop = () => {
      clearInterval(interval);
      interval = undefined;
    };
    const onVisibility = () => {
      if (document.hidden) stop();
      else {
        void check(false);
        start();
      }
    };
    if (!document.hidden) start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, notFound]);

  // Expiry countdown.
  useEffect(() => {
    if (status !== "pending") return;
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tick);
  }, [status]);

  const copy = async (key: string, value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      toast.success(`${label} copied`);
      setTimeout(() => setCopied((c) => (c === key ? null : c)), 2000);
    } catch {
      toast.error("Couldn't copy — select it and copy manually.");
    }
  };

  const downloadReceipt = async () => {
    const path = checkout?.receiptNumber
      ? receiptPdfPath(checkout.receiptNumber)
      : dueId
        ? dueReceiptPath(dueId)
        : null;
    if (!path) return;
    setDownloading(true);
    try {
      const blob = await apiClient.getBlob(path);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Duevy-receipt-${checkout?.receiptNumber ?? reference}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Couldn't download the receipt. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-lg animate-pulse">
        <div className="h-6 w-32 rounded-full bg-cloud" />
        <div className="mt-6 h-64 rounded-3xl border border-cloud bg-canvas" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="mx-auto max-w-lg text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-rose-50 text-rose-600">
          <HugeiconsIcon icon={Alert01Icon} size={24} />
        </span>
        <h1 className="mt-4 text-lg font-semibold text-ink">Payment not found</h1>
        <p className="mt-1 text-sm text-ink-soft">
          This payment link is invalid or belongs to a different account.
        </p>
        <a
          href={backHref}
          className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline"
        >
          <HugeiconsIcon icon={ArrowLeft02Icon} size={15} />
          {backLabel}
        </a>
      </div>
    );
  }

  const breakdown = checkout?.breakdown;
  const total = breakdown?.total ?? checkout?.amount ?? null;
  const bank = checkout?.bankTransfer ?? null;
  const expiresAt = bank?.expiresAt ?? checkout?.expiresAt ?? null;
  const msLeft = expiresAt ? new Date(expiresAt).getTime() - now : null;
  const items = checkout?.items ?? [];
  const canDownload = !!checkout?.receiptNumber || !!dueId;

  const backButton = (
    <button
      type="button"
      onClick={() => router.push(backHref)}
      className="mt-2 inline-flex h-10 items-center rounded-full bg-brand px-4 text-sm font-semibold text-white transition-colors duration-300 hover:bg-brand-bright cursor-pointer"
    >
      {backLabel}
    </button>
  );

  const breakdownCard = breakdown && (
    <div className="mt-5 rounded-2xl border border-cloud bg-paper/50 p-4 text-left">
      {items.length > 0 && (
        <ul className="mb-3 flex flex-col gap-1.5 border-b border-cloud pb-3">
          {items.map((item) => (
            <li key={item.dueId} className="flex items-center justify-between gap-3 text-sm">
              <span className="min-w-0 truncate text-ink">{item.title}</span>
              <span className="shrink-0 font-medium text-ink">{nairaFromKobo(item.amount)}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="flex items-center justify-between text-xs text-ink-soft">
        <span>{items.length > 1 ? "Dues total" : "Due amount"}</span>
        <span className="font-medium text-ink">{exactNaira(breakdown.face)}</span>
      </div>
      <div className="mt-1.5 flex items-center justify-between text-xs text-ink-soft">
        <span>Service fee (2% + ₦20)</span>
        <span className="font-medium text-ink">{exactNaira(breakdown.fee)}</span>
      </div>
      <div className="mt-2 flex items-center justify-between border-t border-cloud pt-2">
        <span className="text-xs font-medium text-ink-soft">Total</span>
        <span className="text-base font-semibold tracking-tight text-ink">
          {exactNaira(breakdown.total)}
        </span>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-lg">
      <button
        type="button"
        onClick={() => router.push(backHref)}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft transition-colors duration-300 hover:text-brand cursor-pointer"
      >
        <HugeiconsIcon icon={ArrowLeft02Icon} size={15} />
        {backLabel}
      </button>

      <div className="mt-6 rounded-3xl border border-cloud bg-canvas p-6 sm:p-8">
        {status === "paid" ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-brand/10 text-brand">
              <HugeiconsIcon icon={CheckmarkCircle02Icon} size={26} />
            </span>
            <h1 className="text-lg font-semibold text-ink">Payment confirmed</h1>
            <p className="text-sm text-ink-soft">
              {total !== null ? `${exactNaira(total)} received. ` : ""}
              {items.length > 1
                ? `All ${items.length} dues are settled.`
                : "Your due is settled."}
            </p>
            {!!checkout?.overpaidKobo && checkout.overpaidKobo > 0 && (
              <p className="text-xs text-ink-soft">
                You sent {exactNaira(checkout.overpaidKobo)} more than needed. Our support team
                has been notified and will follow up.
              </p>
            )}
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              {canDownload && (
                <button
                  type="button"
                  disabled={downloading}
                  onClick={() => void downloadReceipt()}
                  className="inline-flex h-10 items-center gap-1.5 rounded-full border border-cloud px-4 text-sm font-semibold text-ink transition-colors duration-300 hover:border-brand/40 hover:text-brand disabled:opacity-60 cursor-pointer"
                >
                  <HugeiconsIcon icon={Download04Icon} size={15} />
                  {downloading ? "Downloading…" : "Download receipt"}
                </button>
              )}
              <button
                type="button"
                onClick={() => router.push(backHref)}
                className="inline-flex h-10 items-center rounded-full bg-brand px-4 text-sm font-semibold text-white transition-colors duration-300 hover:bg-brand-bright cursor-pointer"
              >
                {backLabel}
              </button>
            </div>
            {checkout?.receiptNumber && (
              <p className="text-[11px] text-ink-soft">Receipt {checkout.receiptNumber}</p>
            )}
          </div>
        ) : status === "expired" ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-rose-50 text-rose-600">
              <HugeiconsIcon icon={Clock01Icon} size={24} />
            </span>
            <h1 className="text-lg font-semibold text-ink">This payment expired</h1>
            <p className="text-sm text-ink-soft">
              The transfer account closed before any money arrived, so nothing was charged. Go
              back and start a new payment — you&apos;ll get a fresh account number.
            </p>
            <p className="text-xs text-ink-soft">
              Already sent money to this account? Contact support with reference{" "}
              <span className="font-semibold text-ink">{reference}</span>.
            </p>
            {backButton}
          </div>
        ) : status === "underpaid" ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-amber-50 text-amber-600">
              <HugeiconsIcon icon={Alert01Icon} size={24} />
            </span>
            <h1 className="text-lg font-semibold text-ink">Less than the total arrived</h1>
            <p className="text-sm text-ink-soft">
              {checkout?.receivedKobo != null && total !== null
                ? `We received ${exactNaira(checkout.receivedKobo)} of the ${exactNaira(total)} due. `
                : "The amount received was less than the total. "}
              Your dues haven&apos;t been marked paid yet. Our support team will reach out to
              sort out the difference — there&apos;s no need to pay again in the meantime.
            </p>
            <p className="text-xs text-ink-soft">
              Reference <span className="font-semibold text-ink">{reference}</span>
            </p>
            {backButton}
          </div>
        ) : (
          <>
            <div className="flex flex-col items-center gap-2 text-center">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-brand/10 text-brand">
                <HugeiconsIcon icon={BankIcon} size={22} />
              </span>
              <h1 className="text-lg font-semibold text-ink">Pay by bank transfer</h1>
              <p className="text-sm text-ink-soft">
                Send the <span className="font-semibold text-ink">exact amount</span> below to
                this one-time account from any bank app. We&apos;ll confirm it automatically.
              </p>
            </div>

            {bank ? (
              <div className="mt-5 flex flex-col gap-3">
                <div className="rounded-2xl border border-brand/20 bg-cloud/60 p-4">
                  <p className="text-[11px] font-medium text-ink-soft">Amount to send</p>
                  <div className="mt-1 flex items-center justify-between gap-3">
                    <p className="text-2xl font-semibold tracking-tight text-ink">
                      {exactNaira(bank.amountKobo)}
                    </p>
                    <CopyButton
                      done={copied === "amount"}
                      label="Copy amount"
                      onClick={() =>
                        void copy("amount", (bank.amountKobo / 100).toFixed(2), "Amount")
                      }
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-cloud bg-paper/50 p-4">
                  <p className="text-[11px] font-medium text-ink-soft">Account number</p>
                  <div className="mt-1 flex items-center justify-between gap-3">
                    <p className="font-mono text-xl font-semibold tracking-wider text-ink">
                      {bank.accountNumber}
                    </p>
                    <CopyButton
                      done={copied === "account"}
                      label="Copy account number"
                      onClick={() => void copy("account", bank.accountNumber, "Account number")}
                    />
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-3 border-t border-cloud pt-3 text-sm">
                    <div className="min-w-0">
                      <dt className="text-[11px] font-medium text-ink-soft">Bank</dt>
                      <dd className="truncate font-medium text-ink">{bank.bankName || "—"}</dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-[11px] font-medium text-ink-soft">Account name</dt>
                      <dd className="truncate font-medium text-ink">{bank.accountName || "—"}</dd>
                    </div>
                  </dl>
                </div>

                {msLeft !== null && (
                  <p
                    className={`inline-flex items-center justify-center gap-1.5 text-xs ${
                      msLeft > 0 ? "text-ink-soft" : "text-rose-600"
                    }`}
                  >
                    <HugeiconsIcon icon={Clock01Icon} size={13} />
                    {msLeft > 0 ? (
                      <>
                        Account expires in{" "}
                        <span className="font-semibold tabular-nums">
                          {formatCountdown(msLeft)}
                        </span>
                      </>
                    ) : (
                      "This account has expired — don't send money to it. Checking for a final update…"
                    )}
                  </p>
                )}
              </div>
            ) : (
              <div className="mt-5 flex flex-col items-center gap-2 rounded-2xl border border-cloud bg-paper/50 p-5 text-center">
                <span className="h-6 w-6 animate-spin rounded-full border-2 border-brand/30 border-t-brand" />
                <p className="text-sm text-ink-soft">Setting up your transfer account…</p>
              </div>
            )}

            {breakdownCard}

            <div className="mt-5 flex items-center justify-center gap-2 text-xs text-ink-soft">
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-brand/30 border-t-brand" />
              Waiting for your transfer — this page updates on its own.
            </div>

            <button
              type="button"
              disabled={checking}
              onClick={() => check(true)}
              className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand text-sm font-semibold text-white transition-colors duration-300 hover:bg-brand-bright disabled:opacity-60 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
            >
              {checking ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              ) : (
                <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} />
              )}
              {checking ? "Checking…" : "I've sent the money"}
            </button>
            <p className="mt-3 text-center text-[11px] text-ink-soft">
              Reference <span className="font-semibold text-ink">{reference}</span>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function CopyButton({
  done,
  label,
  onClick,
}: {
  done: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-cloud bg-canvas px-3 text-xs font-semibold text-brand transition-colors duration-300 hover:bg-cloud cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
    >
      <HugeiconsIcon icon={done ? Tick02Icon : Copy01Icon} size={14} />
      {done ? "Copied" : "Copy"}
    </button>
  );
}
