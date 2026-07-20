"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowRight01Icon,
  Alert01Icon,
  CheckmarkBadge01Icon,
} from "@hugeicons/core-free-icons";
import { getPaymentStatus, type PaymentStatus } from "@/lib/api/dues";
import { ApiError } from "@/lib/api/errors";
import { IconChip } from "../../_components/IconChip";
import { nairaFromKobo } from "../../_components/format";
import type { HugeIcon } from "../../_components/nav-config";

type State = "verifying" | "completed" | "failed" | "timeout" | "signin" | "missing";

const POLL_INTERVAL_MS = 2000;
const MAX_ATTEMPTS = 30; // ~60s

const NEXT_STEP: Record<string, { href: string; label: string }> = {
  due: { href: "/dashboard/dues", label: "View my dues" },
  card_verification: { href: "/dashboard/wallet", label: "View payment methods" },
  vote: { href: "/dashboard/transactions", label: "View transactions" },
  withdrawal: { href: "/dashboard/payout", label: "View payout" },
  refund: { href: "/dashboard/transactions", label: "View transactions" },
  referral: { href: "/dashboard/referrals", label: "View referrals" },
};
const DEFAULT_NEXT = { href: "/dashboard", label: "Go to dashboard" };

export function PaymentCallbackStatus({ reference }: { reference: string | null }) {
  const [state, setState] = useState<State>(reference ? "verifying" : "missing");
  const [result, setResult] = useState<PaymentStatus | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const ran = useRef(false);

  useEffect(() => {
    if (!reference || ran.current) return;
    ran.current = true;

    let cancelled = false;

    (async () => {
      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        try {
          const res = await getPaymentStatus(reference);
          if (cancelled) return;

          if (res.status === "pending") {
            await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
            continue;
          }

          setResult(res);
          setState(res.status === "completed" ? "completed" : "failed");
          return;
        } catch (err) {
          if (cancelled) return;
          if (err instanceof ApiError && (err.status === 401 || err.code === "UNAUTHENTICATED")) {
            setState("signin");
            return;
          }
          if (err instanceof ApiError && err.status === 404) {
            setErrorMessage("We couldn't find that payment. It may still be processing.");
            setState("failed");
            return;
          }
          setErrorMessage(
            err instanceof ApiError
              ? err.message
              : "Couldn't reach the server. Check your connection and try again.",
          );
          setState("failed");
          return;
        }
      }
      if (!cancelled) setState("timeout");
    })();

    return () => {
      cancelled = true;
    };
  }, [reference]);

  if (state === "verifying") {
    return (
      <Card>
        <span className="mx-auto mb-4 h-14 w-14 animate-pulse rounded-full bg-cloud" />
        <h1 className="text-lg font-semibold tracking-tight text-ink">
          Confirming your payment
        </h1>
        <p className="mt-1.5 text-sm text-ink-soft">
          Hang tight — we&apos;re checking with your bank. This only takes a
          moment.
        </p>
      </Card>
    );
  }

  if (state === "missing") {
    return (
      <ResultCard
        tone="danger"
        icon={Alert01Icon}
        title="Missing payment reference"
        description="This link doesn't include a payment reference to check. If you just completed a payment, check your transactions instead."
        ctaHref="/dashboard/transactions"
        ctaLabel="View transactions"
      />
    );
  }

  if (state === "signin") {
    const next = reference
      ? `/dashboard/wallet/callback?reference=${encodeURIComponent(reference)}`
      : "/dashboard/wallet/callback";
    return (
      <ResultCard
        tone="danger"
        icon={Alert01Icon}
        title="Sign in to view this payment"
        description="Your session expired while you were away. Sign back in and we'll pick up right where you left off."
        ctaHref={`/login?next=${encodeURIComponent(next)}`}
        ctaLabel="Sign in"
      />
    );
  }

  if (state === "timeout") {
    return (
      <ResultCard
        tone="danger"
        icon={Alert01Icon}
        title="Still processing"
        description="This is taking longer than usual. Your payment may still complete — check your transactions in a few minutes."
        ctaHref="/dashboard/transactions"
        ctaLabel="View transactions"
      />
    );
  }

  if (state === "failed") {
    return (
      <ResultCard
        tone="danger"
        icon={Alert01Icon}
        title="Payment didn't go through"
        description={
          errorMessage ??
          "Something went wrong confirming this payment. If you were charged, it will be reversed automatically — check your transactions for the latest status."
        }
        ctaHref="/dashboard/transactions"
        ctaLabel="View transactions"
      />
    );
  }

  // completed
  const txn = result?.transaction;
  const next = (txn && NEXT_STEP[txn.type]) || DEFAULT_NEXT;

  return (
    <Card>
      <IconChip icon={CheckmarkBadge01Icon} size="lg" tone="brand" className="mx-auto" />
      <h1 className="mt-4 text-lg font-semibold tracking-tight text-ink">
        Payment confirmed
      </h1>
      <p className="mt-1.5 text-sm text-ink-soft">
        {txn
          ? `${nairaFromKobo(Math.abs(txn.amount))} — ${txn.title ?? "your payment"} went through successfully.`
          : "Your payment went through successfully."}
      </p>

      {txn && (
        <div className="mt-5 rounded-2xl border border-cloud bg-paper/50 p-4 text-left">
          <Row label="Reference" value={txn.reference} />
          {txn.method && <Row label="Method" value={txn.method} />}
          <Row
            label="Date"
            value={new Date(txn.createdAt).toLocaleString("en-NG", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          />
        </div>
      )}

      <Link
        href={next.href}
        className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand text-sm font-semibold text-white transition-colors duration-300 hover:bg-brand-bright focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
      >
        {next.label}
        <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
      </Link>
    </Card>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-md">
      <div className="rounded-3xl border border-cloud bg-canvas p-6 text-center sm:p-8">
        {children}
      </div>
    </div>
  );
}

function ResultCard({
  icon,
  tone,
  title,
  description,
  ctaHref,
  ctaLabel,
}: {
  icon: HugeIcon;
  tone: "danger";
  title: string;
  description: string;
  ctaHref: string;
  ctaLabel: string;
}) {
  return (
    <Card>
      <IconChip icon={icon} size="lg" tone={tone} className="mx-auto" />
      <h1 className="mt-4 text-lg font-semibold tracking-tight text-ink">
        {title}
      </h1>
      <p className="mt-1.5 text-sm text-ink-soft">{description}</p>

      <Link
        href={ctaHref}
        className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand text-sm font-semibold text-white transition-colors duration-300 hover:bg-brand-bright focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
      >
        {ctaLabel}
        <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
      </Link>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5 first:pt-0 last:pb-0">
      <span className="text-xs text-ink-soft">{label}</span>
      <span className="text-xs font-medium text-ink">{value}</span>
    </div>
  );
}
