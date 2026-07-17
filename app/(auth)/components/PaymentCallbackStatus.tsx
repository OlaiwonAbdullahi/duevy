"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { Alert01Icon } from "@hugeicons/core-free-icons";
import { getPaymentStatus, type PaymentStatus } from "@/lib/api/dues";
import { ApiError } from "@/lib/api/errors";
import { nairaFromKobo } from "../../(dashboards)/dashboard/_components/format";
import { ArrowRightIcon, CheckIcon } from "../../components/icons";

type State = "verifying" | "completed" | "failed" | "timeout" | "signin" | "missing";

const POLL_INTERVAL_MS = 2000;
const MAX_ATTEMPTS = 30; // ~60s

const NEXT_STEP: Record<string, { href: string; label: string }> = {
  due: { href: "/dashboard/dues", label: "View my dues" },
  topup: { href: "/dashboard/wallet", label: "Go to wallet" },
  vote: { href: "/dashboard/transactions", label: "View transactions" },
  withdrawal: { href: "/dashboard/payout", label: "View payout" },
  refund: { href: "/dashboard/transactions", label: "View transactions" },
  referral: { href: "/dashboard/referrals", label: "View referrals" },
};
const DEFAULT_NEXT = { href: "/dashboard", label: "Go to dashboard" };

export default function PaymentCallbackStatus({
  reference,
}: {
  reference: string | null;
}) {
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

  if (state === "missing") {
    return (
      <StatusShell
        title="Missing payment reference"
        description="This link doesn't include a payment reference to check. If you just completed a payment, check your transactions instead."
        ctaHref="/dashboard/transactions"
        ctaLabel="View transactions"
      />
    );
  }

  if (state === "verifying") {
    return (
      <div className="flex flex-col items-center text-center">
        <span className="mx-auto mb-6 h-14 w-14 animate-pulse rounded-2xl bg-[#e6f2ec]" />
        <h1 className="text-[#1b2520] font-semibold tracking-tight text-3xl leading-tight mb-2">
          Confirming your payment
        </h1>
        <p className="text-[#7a847f] text-[15px] leading-relaxed">
          Hang tight — we&apos;re checking with your bank. This only takes a moment.
        </p>
      </div>
    );
  }

  if (state === "signin") {
    const next = reference ? `/wallet/callback?reference=${encodeURIComponent(reference)}` : "/wallet/callback";
    return (
      <StatusShell
        title="Sign in to view this payment"
        description="Your session expired while you were away. Sign back in and we'll pick up right where you left off."
        ctaHref={`/login?next=${encodeURIComponent(next)}`}
        ctaLabel="Sign in"
      />
    );
  }

  if (state === "timeout") {
    return (
      <StatusShell
        title="Still processing"
        description="This is taking longer than usual. Your payment may still complete — check your transactions in a few minutes."
        ctaHref="/dashboard/transactions"
        ctaLabel="View transactions"
      />
    );
  }

  if (state === "failed") {
    return (
      <StatusShell
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
    <div className="flex flex-col text-center">
      <span className="mx-auto mb-6 grid h-14 w-14 place-items-center rounded-2xl bg-[#e6f2ec] text-[#0b6e4f]">
        <CheckIcon size={22} />
      </span>

      <h1 className="text-[#1b2520] font-semibold tracking-tight text-3xl leading-tight mb-2">
        Payment confirmed
      </h1>
      <p className="text-[#7a847f] text-[15px] leading-relaxed mb-8">
        {txn
          ? `${nairaFromKobo(Math.abs(txn.amount))} — ${txn.title ?? "your payment"} went through successfully.`
          : "Your payment went through successfully."}
      </p>

      {txn && (
        <div className="mb-8 rounded-2xl border border-[#e6f2ec] bg-[#fbfaf7] p-5 text-left">
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
        className="group mt-1 inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-[#0b6e4f] text-white text-[15px] font-semibold transition-colors duration-300 hover:bg-[#0f996d] cursor-pointer"
      >
        {next.label}
        <ArrowRightIcon
          size={16}
          className="transition-transform duration-500 group-hover:translate-x-1"
        />
      </Link>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5 first:pt-0 last:pb-0">
      <span className="text-[#7a847f] text-[13px]">{label}</span>
      <span className="text-[#1b2520] text-[13px] font-medium">{value}</span>
    </div>
  );
}

function StatusShell({
  title,
  description,
  ctaHref,
  ctaLabel,
}: {
  title: string;
  description: string;
  ctaHref: string;
  ctaLabel: string;
}) {
  return (
    <div className="flex flex-col text-center">
      <span className="mx-auto mb-6 grid h-14 w-14 place-items-center rounded-2xl bg-[#fdeceb] text-[#c0362c]">
        <HugeiconsIcon icon={Alert01Icon} size={26} />
      </span>

      <h1 className="text-[#1b2520] font-semibold tracking-tight text-3xl leading-tight mb-2">
        {title}
      </h1>
      <p className="text-[#7a847f] text-[15px] leading-relaxed mb-8">{description}</p>

      <Link
        href={ctaHref}
        className="group mt-1 inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-[#0b6e4f] text-white text-[15px] font-semibold transition-colors duration-300 hover:bg-[#0f996d] cursor-pointer"
      >
        {ctaLabel}
        <ArrowRightIcon
          size={16}
          className="transition-transform duration-500 group-hover:translate-x-1"
        />
      </Link>
    </div>
  );
}
