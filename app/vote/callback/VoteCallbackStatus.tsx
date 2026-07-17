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
import { IconChip } from "@/app/(dashboards)/dashboard/_components/IconChip";
import { nairaFromKobo } from "@/app/(dashboards)/dashboard/_components/format";
import { readPendingVoteCheckout, clearPendingVoteCheckout } from "../pending-checkout";

type State = "verifying" | "completed" | "failed" | "timeout" | "signin" | "missing";

const POLL_INTERVAL_MS = 2000;
const MAX_ATTEMPTS = 30; // ~60s

export default function VoteCallbackStatus({ reference }: { reference: string | null }) {
  const [state, setState] = useState<State>(reference ? "verifying" : "missing");
  const [result, setResult] = useState<PaymentStatus | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // The slug never travels through the redirect — it was stashed client-side
  // right before checkout, keyed by the same reference we get back here.
  const [slug] = useState<string | null>(() => {
    if (typeof window === "undefined" || !reference) return null;
    const pending = readPendingVoteCheckout();
    return pending && pending.reference === reference ? pending.slug : null;
  });
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
          clearPendingVoteCheckout();
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

  const backHref = slug ? `/vote/${slug}` : "/";
  const backLabel = slug ? "Back to poll" : "Go to Duevy";

  return (
    <main className="min-h-screen bg-canvas">
      <header className="bg-brand px-4 py-4 sm:px-8">
        <div className="mx-auto max-w-3xl">
          <Link href="/" className="text-xl font-semibold tracking-tight text-white cursor-pointer">
            Duevy.
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-md px-4 py-16 sm:px-8">
        {state === "verifying" && (
          <Card>
            <span className="mx-auto mb-4 h-14 w-14 animate-pulse rounded-full bg-cloud" />
            <h1 className="text-lg font-semibold tracking-tight text-ink">
              Confirming your vote
            </h1>
            <p className="mt-1.5 text-sm text-ink-soft">
              Hang tight — we&apos;re checking with your bank. This only takes a
              moment.
            </p>
          </Card>
        )}

        {state === "missing" && (
          <ResultCard
            title="Missing payment reference"
            description="This link doesn't include a payment reference to check."
            ctaHref={backHref}
            ctaLabel={backLabel}
          />
        )}

        {state === "signin" && (
          <ResultCard
            title="Sign in to view this vote"
            description="Your session expired while you were away. Sign back in and we'll pick up right where you left off."
            ctaHref={`/login?next=${encodeURIComponent(`/vote/callback?reference=${reference ?? ""}`)}`}
            ctaLabel="Sign in"
          />
        )}

        {state === "timeout" && (
          <ResultCard
            title="Still processing"
            description="This is taking longer than usual. Your vote may still go through — check back on the poll in a few minutes."
            ctaHref={backHref}
            ctaLabel={backLabel}
          />
        )}

        {state === "failed" && (
          <ResultCard
            title="Vote didn't go through"
            description={
              errorMessage ??
              "Something went wrong confirming this payment. If you were charged, it will be reversed automatically — your vote wasn't counted."
            }
            ctaHref={backHref}
            ctaLabel={backLabel}
          />
        )}

        {state === "completed" && (
          <Card>
            <IconChip icon={CheckmarkBadge01Icon} size="lg" tone="brand" className="mx-auto" />
            <h1 className="mt-4 text-lg font-semibold tracking-tight text-ink">
              Vote counted!
            </h1>
            <p className="mt-1.5 text-sm text-ink-soft">
              {result?.transaction
                ? `${nairaFromKobo(Math.abs(result.transaction.amount))} — ${result.transaction.title ?? "your vote"} went through successfully.`
                : "Thanks for voting — your payment went through successfully."}
            </p>

            <Link
              href={backHref}
              className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand text-sm font-semibold text-white transition-colors duration-300 hover:bg-brand-bright focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
            >
              {backLabel}
              <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
            </Link>
          </Card>
        )}
      </div>
    </main>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-cloud bg-canvas p-6 text-center sm:p-8">
      {children}
    </div>
  );
}

function ResultCard({
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
    <Card>
      <IconChip icon={Alert01Icon} size="lg" tone="danger" className="mx-auto" />
      <h1 className="mt-4 text-lg font-semibold tracking-tight text-ink">{title}</h1>
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
