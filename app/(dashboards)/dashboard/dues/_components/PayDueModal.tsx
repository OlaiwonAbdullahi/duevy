import { HugeiconsIcon } from "@hugeicons/react";
import {
  Wallet01Icon,
  Alert01Icon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons";
import Link from "next/link";
import { Modal } from "../../wallet/_components/Modal";
import type { Due, Space } from "./types";
import {
  naira,
  CATEGORY_ICON,
  CATEGORY_LABEL,
  SPACE_KIND_LABEL,
} from "./data";

export function PayDueModal({
  due,
  space,
  balance,
  pending,
  onClose,
  onConfirm,
}: {
  due: Due;
  space: Space;
  balance: number;
  pending: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const enough = balance >= due.amount;

  return (
    <Modal title="Confirm payment" icon={CATEGORY_ICON[due.category]} onClose={onClose}>
      <div className="rounded-2xl border border-cloud bg-paper/50 p-4">
        <p className="text-[11px] font-medium text-ink-soft">
          {space.name} · {SPACE_KIND_LABEL[space.kind]}
        </p>
        <div className="mt-2 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">{due.title}</p>
            <p className="text-xs text-ink-soft">{CATEGORY_LABEL[due.category]}</p>
          </div>
          <p className="shrink-0 text-lg font-semibold tracking-tight text-ink">
            {naira(due.amount)}
          </p>
        </div>
      </div>

      {/* Wallet source row. */}
      <div className="mt-3 flex items-center gap-3 rounded-2xl border border-cloud p-4">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-cloud text-brand">
          <HugeiconsIcon icon={Wallet01Icon} size={18} />
        </span>
        <div className="flex-1">
          <p className="text-sm font-medium text-ink">Duevy wallet</p>
          <p className="text-xs text-ink-soft">Balance {naira(balance)}</p>
        </div>
        {enough && (
          <span className="rounded-full bg-cloud px-2.5 py-1 text-[11px] font-medium text-brand">
            After · {naira(balance - due.amount)}
          </span>
        )}
      </div>

      {!enough && (
        <div className="mt-3 flex items-start gap-2 rounded-2xl bg-rose-50 p-3 text-xs text-rose-700">
          <HugeiconsIcon icon={Alert01Icon} size={15} className="mt-px shrink-0" />
          <p>
            You&apos;re {naira(due.amount - balance)} short. Top up your wallet
            first, then come back to settle this due.
          </p>
        </div>
      )}

      {enough ? (
        <button
          type="button"
          onClick={onConfirm}
          disabled={pending}
          className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand text-sm font-semibold text-white transition-colors duration-300 hover:bg-brand-bright disabled:opacity-60 cursor-pointer"
        >
          {pending ? "Processing…" : `Pay ${naira(due.amount)}`}
        </button>
      ) : (
        <Link
          href="/dashboard/wallet"
          className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand text-sm font-semibold text-white transition-colors duration-300 hover:bg-brand-bright"
        >
          Top up wallet
          <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
        </Link>
      )}
    </Modal>
  );
}
