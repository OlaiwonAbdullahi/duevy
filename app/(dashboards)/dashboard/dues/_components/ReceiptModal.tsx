import { HugeiconsIcon } from "@hugeicons/react";
import {
  CheckmarkBadge01Icon,
  Download04Icon,
  InvoiceIcon,
} from "@hugeicons/core-free-icons";
import { Modal } from "../../_components/Modal";
import { naira, CATEGORY_LABEL } from "./data";
import { downloadReceipt, downloadAllReceipts, type Receipt } from "./receipt";

/**
 * Shown once a payment posts. Every due settled gets its own receipt row with
 * an individual download, plus a "Download all" that fires them together.
 */
export function ReceiptModal({
  receipts,
  onClose,
}: {
  receipts: Receipt[];
  onClose: () => void;
}) {
  const multi = receipts.length > 1;
  const total = receipts.reduce((sum, r) => sum + r.amount, 0);
  const title = multi ? `${receipts.length} receipts` : "Payment receipt";

  return (
    <Modal title={title} icon={InvoiceIcon} onClose={onClose}>
      {/* Success banner. */}
      <div className="flex items-center gap-3 rounded-2xl border border-brand/20 bg-cloud/60 p-4">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand text-white">
          <HugeiconsIcon icon={CheckmarkBadge01Icon} size={20} />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink">
            {naira(total)} paid successfully
          </p>
          <p className="text-xs text-ink-soft">
            {multi
              ? `${receipts.length} dues settled · a receipt for each`
              : "Your receipt is ready to download"}
          </p>
        </div>
      </div>

      {/* Per-due receipts. */}
      <ul className="mt-4 flex flex-col gap-2">
        {receipts.map((r) => (
          <li
            key={r.reference}
            className="flex items-center gap-3 rounded-2xl border border-cloud bg-paper/50 p-3"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink">
                {r.dueTitle}
              </p>
              <p className="truncate text-[11px] text-ink-soft">
                {CATEGORY_LABEL[r.category]} · {r.reference}
              </p>
            </div>
            <p className="shrink-0 text-sm font-semibold text-ink">
              {naira(r.amount)}
            </p>
            <button
              type="button"
              onClick={() => void downloadReceipt(r)}
              aria-label={`Download receipt for ${r.dueTitle}`}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-cloud bg-canvas text-brand transition-colors duration-300 hover:bg-cloud cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
            >
              <HugeiconsIcon icon={Download04Icon} size={16} />
            </button>
          </li>
        ))}
      </ul>

      {/* Actions. */}
      <button
        type="button"
        onClick={() => void downloadAllReceipts(receipts)}
        className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand text-sm font-semibold text-white transition-colors duration-300 hover:bg-brand-bright cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
      >
        <HugeiconsIcon icon={Download04Icon} size={16} />
        {multi ? "Download all receipts" : "Download receipt"}
      </button>
      <button
        type="button"
        onClick={onClose}
        className="mt-2 inline-flex h-11 w-full items-center justify-center rounded-full text-sm font-medium text-ink-soft transition-colors duration-300 hover:text-ink cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
      >
        Done
      </button>
    </Modal>
  );
}
