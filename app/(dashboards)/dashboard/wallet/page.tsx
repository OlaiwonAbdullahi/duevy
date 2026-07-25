"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { CreditCardIcon } from "@hugeicons/core-free-icons";
import { getPaymentStatus } from "@/lib/api/dues";
import { ADDCARD_REF_KEY } from "./_components/utils";

const SETTINGS_TARGET = "/dashboard/settings#payment-methods";

/**
 * Card-save is the one payment flow that still redirects off-app (tokenizing
 * a card needs a real card-entry step, which an in-app bank-transfer invoice
 * can't do) — this route only exists as the gateway's fixed return target.
 * Card management itself now lives in Settings; this page just verifies the
 * charge and bounces there.
 */
export default function WalletRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlRef =
      params.get("reference") ||
      params.get("paymentReference") ||
      params.get("transactionReference");
    const ref = urlRef || sessionStorage.getItem(ADDCARD_REF_KEY);

    if (!ref) {
      router.replace(SETTINGS_TARGET);
      return;
    }

    let cancelled = false;
    let attempts = 0;
    const verifying = toast.loading("Verifying your card…");

    const finish = () => {
      sessionStorage.removeItem(ADDCARD_REF_KEY);
      router.replace(SETTINGS_TARGET);
    };

    const poll = async () => {
      try {
        const res = await getPaymentStatus(ref);
        if (cancelled) return;
        if (res.status === "completed") {
          toast.success("Card added", {
            id: verifying,
            description: "Your card is saved and ready to use.",
          });
          finish();
          return;
        }
        if (res.status === "failed") {
          toast.error("Couldn't add card", {
            id: verifying,
            description: "You were not charged.",
          });
          finish();
          return;
        }
        if (attempts++ < 8) {
          setTimeout(poll, 2500);
        } else {
          toast.info("Still verifying your card", {
            id: verifying,
            description: "We'll update this once it clears.",
          });
          finish();
        }
      } catch {
        if (!cancelled) {
          toast.dismiss(verifying);
          finish();
        }
      }
    };

    poll();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-4">
      <div className="rounded-3xl border border-cloud bg-canvas p-6 text-center sm:p-8">
        <span className="relative mx-auto grid h-14 w-14 place-items-center rounded-full bg-cloud text-brand">
          <HugeiconsIcon icon={CreditCardIcon} size={24} />
          <span className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-brand" />
        </span>
        <h1 className="mt-4 text-lg font-semibold tracking-tight text-ink">
          Taking you to Settings
        </h1>
        <p className="mt-1.5 text-sm text-ink-soft">
          Payment methods now live in your account settings.
        </p>
      </div>
    </div>
  );
}
