"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CreditCardIcon,
  CheckmarkCircle02Icon,
  SecurityLockIcon,
  ArrowUpRight01Icon,
  BankIcon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Modal } from "../../_components/Modal";

export function AddCardModal({
  hasCards,
  onClose,
  onContinue,
}: {
  /** Whether the caller already has a saved card — the first one is always forced default. */
  hasCards: boolean;
  onClose: () => void;
  onContinue: (isDefault: boolean) => Promise<void>;
}) {
  const [makeDefault, setMakeDefault] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    try {
      await onContinue(makeDefault);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title="Add card" icon={CreditCardIcon} onClose={onClose}>
      <div className="flex items-start gap-3 rounded-2xl border border-cloud bg-paper p-4">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-canvas text-brand">
          <HugeiconsIcon icon={BankIcon} size={18} />
        </span>
        <p className="text-xs leading-relaxed text-ink-soft">
          You&apos;ll be securely redirected to{" "}
          <span className="font-semibold text-ink">Paystack</span> to enter your
          card details. A one-time ₦50 charge verifies the card, then it&apos;s
          saved for future payments — your full card number never touches Duevy.
        </p>
      </div>

      {hasCards && (
        <button
          type="button"
          role="checkbox"
          aria-checked={makeDefault}
          onClick={() => setMakeDefault((v) => !v)}
          className="mt-4 flex w-full items-center gap-2 rounded-lg text-left text-[13px] text-ink cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        >
          <HugeiconsIcon
            icon={CheckmarkCircle02Icon}
            size={18}
            className={makeDefault ? "text-brand" : "text-ink-soft/40"}
          />
          Set as default payment method
        </button>
      )}

      <Button
        variant="brand"
        size="pill-xl"
        disabled={submitting}
        onClick={submit}
        className="mt-6 w-full"
      >
        {submitting ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
        ) : (
          <HugeiconsIcon icon={ArrowUpRight01Icon} size={16} />
        )}
        {submitting ? "Redirecting…" : "Continue to Paystack"}
      </Button>

      <p className="mt-3 flex items-center justify-center gap-1.5 text-[12px] text-ink-soft">
        <HugeiconsIcon icon={SecurityLockIcon} size={13} />
        Encrypted and stored securely
      </p>
    </Modal>
  );
}
