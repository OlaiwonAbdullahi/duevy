"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Alert01Icon,
  ArrowLeft02Icon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  Download04Icon,
} from "@hugeicons/core-free-icons";
import {
  dueReceiptPath,
  payDue,
  payDues,
  receiptPdfPath,
  type CheckoutStatus,
} from "@/lib/api/dues";
import { apiClient } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import { queryKeys, usePaymentStatus } from "@/lib/api/queries";
import {
  BankTransferPanel,
  PaymentBreakdown,
  PaymentStatusAnnouncer,
  exactNaira,
} from "@/components/payments/BankTransferPanel";
import { DUES_PAGE_KEY, payPageHref, toastCheckoutError } from "../../dues/_components/checkout";

const ANNOUNCE: Record<CheckoutStatus, string> = {
  pending: "Waiting for your transfer.",
  paid: "Payment confirmed.",
  expired: "This payment expired. Nothing was charged.",
  underpaid: "Less than the total arrived. Nothing was marked paid.",
};

const PRIMARY =
  "inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-brand px-4 text-sm font-semibold text-white transition-colors duration-300 hover:bg-brand-bright disabled:opacity-60 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40";
const SECONDARY =
  "inline-flex h-10 items-center justify-center gap-1.5 rounded-full border border-cloud px-4 text-sm font-semibold text-ink transition-colors duration-300 hover:border-brand/40 hover:text-brand disabled:opacity-60 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40";

/**
 * Dedicated page for a bank-transfer checkout — a real URL to sit on
 * (bookmark, reload, come back to). Needs only the reference: GET
 * /payments/:reference/status returns the checkout with its one-time 9jaPay
 * account, so this works on a cold load too. `usePaymentStatus` polls while
 * pending; polling only reads, and the provider's webhook is what moves the
 * status to paid / expired / underpaid.
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

  const query = usePaymentStatus(reference);
  const checkout = query.data;
  const status = checkout?.status;
  const [checking, setChecking] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [restarting, setRestarting] = useState(false);

  // Once the status is final, everything it touched comes back from the
  // server; a change seen on this visit also gets a toast.
  const lastStatus = useRef<CheckoutStatus | undefined>(undefined);
  useEffect(() => {
    if (!status) return;
    const prev = lastStatus.current;
    lastStatus.current = status;
    if (status === "pending" || prev === status) return;
    void queryClient.invalidateQueries({ queryKey: queryKeys.transactionsRoot });
    void queryClient.invalidateQueries({ queryKey: queryKeys.studentOverview });
    void queryClient.invalidateQueries({ queryKey: DUES_PAGE_KEY });
    if (prev !== "pending") return;
    if (status === "paid") toast.success("Payment confirmed", { description: "Your receipt is ready." });
    else if (status === "expired") toast.error("This payment expired", { description: "Nothing was charged." });
    else toast.warning("Less than the total arrived", { description: "Nothing was marked paid. Support will follow up." });
  }, [status, queryClient]);

  const check = async () => {
    setChecking(true);
    try {
      const res = await query.refetch();
      if (res.error) toast.error(res.error instanceof ApiError ? res.error.message : "Couldn't check payment status.");
      else if (res.data?.status === "pending")
        toast.info("Still waiting for your transfer", {
          description: "Transfers usually land within a minute or two. We'll keep checking automatically.",
        });
    } finally {
      setChecking(false);
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

  const payHref = (ref: string, ids: string[]) =>
    payPageHref(ref, { dueId: ids.length === 1 ? ids[0] : null, from, conversationId });

  // A fresh checkout for the same dues, after this one expired.
  const startAgain = async () => {
    const ids = (checkout?.items ?? []).map((i) => i.dueId);
    if (ids.length === 0) {
      router.push(backHref);
      return;
    }
    setRestarting(true);
    try {
      const next = ids.length === 1 ? await payDue(ids[0]!) : await payDues(ids);
      router.replace(payHref(next.reference, ids));
    } catch (err) {
      setRestarting(false);
      toastCheckoutError(err, (ref) => router.replace(payHref(ref, ids)));
    }
  };

  const backLink = (
    <button
      type="button"
      onClick={() => router.push(backHref)}
      className="inline-flex items-center gap-1.5 rounded-full text-sm font-medium text-ink-soft transition-colors duration-300 hover:text-brand cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
    >
      <HugeiconsIcon icon={ArrowLeft02Icon} size={15} aria-hidden />
      {backLabel}
    </button>
  );

  if (query.isPending) {
    return (
      <div className="mx-auto max-w-lg animate-pulse" aria-busy aria-label="Loading payment">
        <div className="h-6 w-32 rounded-full bg-cloud" />
        <div className="mt-6 h-[28rem] rounded-3xl border border-cloud bg-canvas" />
      </div>
    );
  }

  if (!checkout) {
    const notFound = query.error instanceof ApiError && query.error.status === 404;
    return (
      <div className="mx-auto max-w-lg text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-rose-50 text-rose-600">
          <HugeiconsIcon icon={Alert01Icon} size={24} />
        </span>
        <h1 className="mt-4 text-lg font-semibold text-ink">
          {notFound ? "Payment not found" : "Couldn't load this payment"}
        </h1>
        <p className="mt-1 text-sm text-ink-soft">
          {notFound
            ? "This payment link is invalid or belongs to a different account."
            : "Check your connection and try again."}
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {!notFound && (
            <button type="button" onClick={() => void query.refetch()} className={PRIMARY}>
              Try again
            </button>
          )}
          {backLink}
        </div>
      </div>
    );
  }

  const breakdown = checkout.breakdown;
  const total = breakdown?.total ?? checkout.amount ?? null;
  const items = checkout.items ?? [];
  const canDownload = !!checkout.receiptNumber || !!dueId;

  return (
    <div className="mx-auto max-w-lg">
      {backLink}
      <PaymentStatusAnnouncer message={status ? ANNOUNCE[status] : ""} />

      <div className="mt-6">
        {status === "paid" ? (
          <Outcome tone="brand" icon={CheckmarkCircle02Icon} title="Payment confirmed">
            <p className="text-sm text-ink-soft">
              {total !== null ? `${exactNaira(checkout.receivedKobo ?? total)} received. ` : ""}
              {items.length > 1 ? `All ${items.length} dues are settled.` : "Your due is settled."}
            </p>
            {checkout.overpaidKobo > 0 && (
              <p className="text-xs text-ink-soft">
                You sent {exactNaira(checkout.overpaidKobo)} more than needed. Our support team has been
                notified and will follow up.
              </p>
            )}
            {breakdown && <PaymentBreakdown {...breakdown} items={items} className="mt-2 w-full" />}
            <dl className="flex w-full flex-col gap-1.5 text-xs">
              {checkout.receiptNumber && (
                <div className="flex justify-between gap-3 text-ink-soft">
                  <dt>Receipt no.</dt>
                  <dd className="font-medium text-ink">{checkout.receiptNumber}</dd>
                </div>
              )}
              <div className="flex justify-between gap-3 text-ink-soft">
                <dt>Reference</dt>
                <dd className="min-w-0 truncate font-medium text-ink">{reference}</dd>
              </div>
              {checkout.paidAt && (
                <div className="flex justify-between gap-3 text-ink-soft">
                  <dt>Paid</dt>
                  <dd className="font-medium text-ink">
                    {new Date(checkout.paidAt).toLocaleString("en-NG", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </dd>
                </div>
              )}
            </dl>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              {canDownload && (
                <button
                  type="button"
                  disabled={downloading}
                  onClick={() => void downloadReceipt()}
                  className={SECONDARY}
                >
                  <HugeiconsIcon icon={Download04Icon} size={15} aria-hidden />
                  {downloading ? "Downloading…" : "Download receipt"}
                </button>
              )}
              <button type="button" onClick={() => router.push(backHref)} className={PRIMARY}>
                {backLabel}
              </button>
            </div>
          </Outcome>
        ) : status === "expired" ? (
          <Outcome tone="rose" icon={Clock01Icon} title="This payment expired">
            <p className="text-sm text-ink-soft">
              The transfer account closed before any money arrived, so nothing was charged. Start a new payment
              to get a fresh account.
            </p>
            <p className="text-xs text-ink-soft">
              Already sent money to this account? Contact support with reference{" "}
              <span className="font-semibold text-ink">{reference}</span>.
            </p>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
              {items.length > 0 && (
                <button type="button" disabled={restarting} onClick={() => void startAgain()} className={PRIMARY}>
                  {restarting && (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden />
                  )}
                  {restarting ? "Starting…" : "Start a new payment"}
                </button>
              )}
              <button type="button" onClick={() => router.push(backHref)} className={items.length > 0 ? SECONDARY : PRIMARY}>
                {backLabel}
              </button>
            </div>
          </Outcome>
        ) : status === "underpaid" ? (
          <Outcome tone="amber" icon={Alert01Icon} title="Less than the total arrived">
            <p className="text-sm text-ink-soft">
              {checkout.receivedKobo != null && total !== null
                ? `We received ${exactNaira(checkout.receivedKobo)} of the ${exactNaira(total)} due. `
                : "The amount received was less than the total. "}
              Nothing has been marked paid. Our support team will contact you to sort out the difference —
              please don&apos;t pay again in the meantime.
            </p>
            <p className="text-xs text-ink-soft">
              Reference <span className="font-semibold text-ink">{reference}</span>
            </p>
            <button type="button" onClick={() => router.push(backHref)} className={`mt-2 ${PRIMARY}`}>
              {backLabel}
            </button>
          </Outcome>
        ) : (
          <BankTransferPanel
            reference={reference}
            bankTransfer={checkout.bankTransfer ?? null}
            expiresAt={checkout.expiresAt}
            breakdown={breakdown}
            items={items}
            checking={checking}
            onCheck={() => void check()}
            onRefresh={() => query.refetch()}
          />
        )}
      </div>
    </div>
  );
}

const TONE = {
  brand: "bg-brand/10 text-brand",
  rose: "bg-rose-50 text-rose-600",
  amber: "bg-amber-50 text-amber-600",
} as const;

function Outcome({
  tone,
  icon,
  title,
  children,
}: {
  tone: keyof typeof TONE;
  icon: typeof Alert01Icon;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-cloud bg-canvas p-5 sm:p-8">
      <div className="flex flex-col items-center gap-3 py-2 text-center">
        <span className={`grid h-14 w-14 place-items-center rounded-full ${TONE[tone]}`}>
          <HugeiconsIcon icon={icon} size={26} aria-hidden />
        </span>
        <h1 className="text-lg font-semibold text-ink">{title}</h1>
        {children}
      </div>
    </div>
  );
}
