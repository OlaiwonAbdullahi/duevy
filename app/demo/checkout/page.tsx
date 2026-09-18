"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Alert01Icon,
  BankIcon,
  CheckmarkCircle02Icon,
  Loading03Icon,
  LockPasswordIcon,
} from "@hugeicons/core-free-icons";
import { failCheckout, getCheckout, settleCheckout } from "@/lib/demo/api";
import { EmptyState } from "@/app/(dashboards)/dashboard/_components/EmptyState";

type Checkout = NonNullable<ReturnType<typeof getCheckout>>;

function naira(kobo: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(kobo / 100);
}

/**
 * Stands in for the payment gateway's hosted checkout. The real flow leaves the
 * app entirely and comes back to /dashboard/pay/[reference]; this keeps the
 * shape of that round trip — including the return leg — without moving money or
 * leaving the demo.
 */
function DemoCheckout() {
  const router = useRouter();
  const params = useSearchParams();
  const reference = params.get("reference") ?? "";

  const [checkout, setCheckout] = useState<Checkout | null | undefined>(undefined);
  const [paying, setPaying] = useState(false);

  // Read on mount, not during render — the checkout lives in localStorage, which
  // doesn't exist on the server.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const found = getCheckout(reference);
      if (!cancelled) setCheckout(found);
    })();
    return () => {
      cancelled = true;
    };
  }, [reference]);

  if (checkout === undefined) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-canvas">
        <HugeiconsIcon icon={Loading03Icon} size={22} className="animate-spin text-ink-soft" />
      </div>
    );
  }

  if (checkout === null) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-canvas px-4">
        <div className="w-full max-w-md rounded-3xl border border-cloud bg-paper py-6">
          <EmptyState
            icon={Alert01Icon}
            title="This checkout has expired"
            description="The payment link is no longer valid. Head back to your dues and start the payment again."
            action={
              <button
                onClick={() => router.push("/dashboard/dues")}
                className="inline-flex h-10 items-center rounded-full bg-brand px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-bright"
              >
                Back to my dues
              </button>
            }
          />
        </div>
      </div>
    );
  }

  const done = checkout.status === "completed";

  const pay = () => {
    setPaying(true);
    // A beat of latency so the pending state is legible on a projector.
    setTimeout(() => {
      settleCheckout(reference);
      router.push(checkout.returnPath);
    }, 900);
  };

  const cancel = () => {
    failCheckout(reference);
    router.push(checkout.returnPath);
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-canvas px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-4 flex items-center justify-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs font-medium text-amber-800">
          <HugeiconsIcon icon={Alert01Icon} size={14} />
          Simulated checkout — no real money moves here
        </div>

        <div className="overflow-hidden rounded-3xl border border-cloud bg-paper shadow-sm">
          <div className="border-b border-hairline px-6 py-5">
            <div className="flex items-center gap-2 text-xs font-medium text-ink-soft">
              <HugeiconsIcon icon={LockPasswordIcon} size={14} />
              Secure checkout
            </div>
            <p className="mt-3 text-sm text-ink-soft">Paying {checkout.spaceName}</p>
            <p className="mt-1 text-3xl font-semibold tracking-tight text-ink">
              {naira(checkout.amount)}
            </p>
          </div>

          <div className="px-6 py-5">
            <ul className="flex flex-col gap-3">
              {checkout.lines.map((line) => (
                <li key={line.title} className="flex items-baseline justify-between gap-4 text-sm">
                  <span className="text-ink">{line.title}</span>
                  <span className="shrink-0 font-medium tabular-nums text-ink-soft">
                    {naira(line.amount)}
                  </span>
                </li>
              ))}
            </ul>

            <dl className="mt-5 flex items-center justify-between border-t border-hairline pt-4 text-xs">
              <dt className="text-ink-soft">Reference</dt>
              <dd className="font-medium tabular-nums text-ink">{checkout.reference}</dd>
            </dl>
          </div>

          <div className="border-t border-hairline bg-canvas/60 px-6 py-5">
            {done ? (
              <div className="flex items-center justify-center gap-2 text-sm font-medium text-brand">
                <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} />
                Already paid
              </div>
            ) : (
              <>
                <button
                  onClick={pay}
                  disabled={paying}
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand text-[15px] font-semibold text-white transition-colors hover:bg-brand-bright disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {paying ? (
                    <>
                      <HugeiconsIcon icon={Loading03Icon} size={16} className="animate-spin" />
                      Confirming…
                    </>
                  ) : (
                    <>
                      <HugeiconsIcon icon={BankIcon} size={16} />
                      Pay {naira(checkout.amount)}
                    </>
                  )}
                </button>
                <button
                  onClick={cancel}
                  disabled={paying}
                  className="mt-2 inline-flex h-10 w-full items-center justify-center rounded-full text-sm font-medium text-ink-soft transition-colors hover:text-ink disabled:opacity-60"
                >
                  Cancel payment
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DemoCheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-canvas">
          <HugeiconsIcon icon={Loading03Icon} size={22} className="animate-spin text-ink-soft" />
        </div>
      }
    >
      <DemoCheckout />
    </Suspense>
  );
}
