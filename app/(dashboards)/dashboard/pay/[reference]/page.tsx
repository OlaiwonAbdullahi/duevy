"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft02Icon,
  ArrowUpRight01Icon,
  CheckmarkCircle02Icon,
  Alert01Icon,
} from "@hugeicons/core-free-icons";
import { getPaymentStatus, dueReceiptPath } from "@/lib/api/dues";
import { ApiError } from "@/lib/api/errors";
import { nairaFromKobo } from "../../_components/format";

const BACKGROUND_POLL_MS = 5000;

/**
 * Dedicated page for the checkout return flow — a real URL to sit on
 * (bookmark, reload, come back to) instead of state trapped in whatever page
 * opened it. Needs only the reference in the URL: GET /payments/:reference/status
 * returns the checkout for as long as it's pending, so this works on a cold
 * load too. The source page redirects to checkoutUrl immediately; Bachs's
 * callback brings the payer back here to confirm.
 */
export default function PaymentPage() {
  const params = useParams<{ reference: string }>();
  const router = useRouter();
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
  const [amount, setAmount] = useState<number | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<"pending" | "completed" | "failed">("pending");
  const [checking, setChecking] = useState(false);
  const settled = useRef(false);

  const check = async (manual: boolean) => {
    if (settled.current) return;
    if (manual) setChecking(true);
    try {
      const res = await getPaymentStatus(reference);
      if (res.amount !== undefined) setAmount(res.amount);
      if (res.checkoutUrl) setCheckoutUrl(res.checkoutUrl);
      if (settled.current) return;
      if (res.status === "completed") {
        settled.current = true;
        setStatus("completed");
        return;
      }
      if (res.status === "failed") {
        settled.current = true;
        setStatus("failed");
        return;
      }
      if (manual) {
        toast.info("Still waiting for your transfer", {
          description: "We'll keep checking automatically — no need to keep tapping.",
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
    check(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reference]);

  useEffect(() => {
    if (status !== "pending" || notFound) return;
    const interval = setInterval(() => check(false), BACKGROUND_POLL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, notFound]);

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
        {status === "completed" ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-brand/10 text-brand">
              <HugeiconsIcon icon={CheckmarkCircle02Icon} size={26} />
            </span>
            <h1 className="text-lg font-semibold text-ink">Payment confirmed</h1>
            <p className="text-sm text-ink-soft">
              {amount !== null ? `${nairaFromKobo(amount)} settled successfully.` : "Settled successfully."}
            </p>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              {dueId && (
                <a
                  href={dueReceiptPath(dueId)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-10 items-center rounded-full border border-cloud px-4 text-sm font-semibold text-ink transition-colors duration-300 hover:border-brand/40 hover:text-brand"
                >
                  View receipt
                </a>
              )}
              <button
                type="button"
                onClick={() => router.push(backHref)}
                className="inline-flex h-10 items-center rounded-full bg-brand px-4 text-sm font-semibold text-white transition-colors duration-300 hover:bg-brand-bright cursor-pointer"
              >
                {backLabel}
              </button>
            </div>
          </div>
        ) : status === "failed" ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-rose-50 text-rose-600">
              <HugeiconsIcon icon={Alert01Icon} size={24} />
            </span>
            <h1 className="text-lg font-semibold text-ink">Payment failed</h1>
            <p className="text-sm text-ink-soft">
              This payment didn&apos;t go through. You weren&apos;t charged — go back and try again.
            </p>
            <button
              type="button"
              onClick={() => router.push(backHref)}
              className="mt-2 inline-flex h-10 items-center rounded-full bg-brand px-4 text-sm font-semibold text-white transition-colors duration-300 hover:bg-brand-bright cursor-pointer"
            >
              {backLabel}
            </button>
          </div>
        ) : (
          <>
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <span className="grid h-14 w-14 place-items-center rounded-full bg-brand/10 text-brand">
                <span className="h-6 w-6 animate-spin rounded-full border-2 border-brand/30 border-t-brand" />
              </span>
              <h1 className="text-lg font-semibold text-ink">Confirming your payment</h1>
              <p className="text-sm text-ink-soft">
                {amount !== null ? `${nairaFromKobo(amount)} — ` : ""}
                We're waiting for the payment provider to confirm this. This usually only takes a moment.
              </p>
            </div>

            <button
              type="button"
              disabled={checking}
              onClick={() => check(true)}
              className="mt-2 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand text-sm font-semibold text-white transition-colors duration-300 hover:bg-brand-bright disabled:opacity-60 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
            >
              {checking ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              ) : (
                <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} />
              )}
              {checking ? "Checking…" : "Check status now"}
            </button>

            {checkoutUrl && (
              <a
                href={checkoutUrl}
                className="mt-3 inline-flex w-full items-center justify-center gap-1.5 text-xs font-semibold text-ink-soft transition-colors duration-300 hover:text-brand"
              >
                Haven't paid yet? Return to checkout
                <HugeiconsIcon icon={ArrowUpRight01Icon} size={13} />
              </a>
            )}
          </>
        )}
      </div>
    </div>
  );
}
