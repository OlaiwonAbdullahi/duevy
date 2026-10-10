"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { BankIcon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { Modal } from "@/app/(dashboards)/dashboard/_components/Modal";
import { nairaFromKobo } from "@/app/(dashboards)/dashboard/_components/format";

export function PayVoteModal({
  totalKobo,
  pending,
  onClose,
  onConfirm,
}: {
  totalKobo: number;
  pending: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal title="Confirm your vote" icon={BankIcon} onClose={onClose}>
      <div className="rounded-2xl border border-cloud bg-paper/50 p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-ink-soft">Total</span>
          <span className="text-lg font-semibold tracking-tight text-ink">
            {nairaFromKobo(totalKobo)}
          </span>
        </div>
      </div>

      <div className="mt-5 flex items-start gap-3 rounded-2xl border border-cloud bg-paper p-4">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-canvas text-brand">
          <HugeiconsIcon icon={BankIcon} size={18} />
        </span>
        <p className="text-xs leading-relaxed text-ink-soft">
          You&apos;ll get a secure <span className="font-semibold text-ink">Bachs</span> checkout
          link, right here in the app.
        </p>
      </div>

      <button
        type="button"
        disabled={pending}
        onClick={onConfirm}
        className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand text-sm font-semibold text-white transition-colors duration-300 hover:bg-brand-bright disabled:opacity-60 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
      >
        {pending ? "Processing…" : "Get checkout link"}
        {!pending && <HugeiconsIcon icon={ArrowRight01Icon} size={16} />}
      </button>
    </Modal>
  );
}
