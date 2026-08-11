import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { BankIcon, ArrowUpRight01Icon, InvoiceIcon, Discount01Icon } from "@hugeicons/core-free-icons";
import { Modal } from "../../_components/Modal";
import type { Due, Space } from "./types";
import { naira, CATEGORY_LABEL, SPACE_KIND_LABEL } from "./data";

export function PayDueModal({
  dues,
  space,
  pending,
  onClose,
  onConfirm,
}: {
  dues: Due[];
  space: Space;
  pending: boolean;
  onClose: () => void;
  onConfirm: (discountCode?: string) => void;
}) {
  const total = dues.reduce((sum, d) => sum + d.amount, 0);
  const multi = dues.length > 1;
  const [discountCode, setDiscountCode] = useState("");

  const title = multi ? `Pay ${dues.length} dues` : "Confirm payment";

  return (
    <Modal title={title} icon={InvoiceIcon} onClose={onClose}>
      {/* What's being paid. */}
      <div className="rounded-2xl border border-cloud bg-paper/50 p-4">
        <p className="text-[11px] font-medium text-ink-soft">
          {space.name} · {SPACE_KIND_LABEL[space.kind]}
        </p>

        {multi ? (
          <ul className="mt-2 flex flex-col gap-2">
            {dues.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">
                    {d.title}
                  </p>
                  <p className="text-[11px] text-ink-soft">
                    {CATEGORY_LABEL[d.category]}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-semibold text-ink">
                  {naira(d.amount)}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-2 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">
                {dues[0].title}
              </p>
              <p className="text-xs text-ink-soft">
                {CATEGORY_LABEL[dues[0].category]}
              </p>
            </div>
            <p className="shrink-0 text-lg font-semibold tracking-tight text-ink">
              {naira(dues[0].amount)}
            </p>
          </div>
        )}

        <div className="mt-3 flex items-center justify-between border-t border-cloud pt-3">
          <span className="text-xs font-medium text-ink-soft">Total</span>
          <span className="text-lg font-semibold tracking-tight text-ink">
            {naira(total)}
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

      {/* Discount code — optional, redeems a referral reward against this payment. */}
      <div className="mt-4">
        <label className="flex items-center gap-1.5 text-xs font-medium text-ink-soft">
          <HugeiconsIcon icon={Discount01Icon} size={14} />
          Discount code (optional)
        </label>
        <input
          value={discountCode}
          onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
          placeholder="e.g. REF-8XQP2K4M"
          disabled={pending}
          className="mt-1.5 h-11 w-full rounded-xl border border-cloud bg-canvas px-3.5 text-sm text-ink outline-none transition-colors duration-300 placeholder:text-ink-soft/60 focus:border-brand focus:ring-2 focus:ring-brand/15 disabled:opacity-60"
        />
      </div>

      <button
        type="button"
        disabled={pending}
        onClick={() => onConfirm(discountCode.trim() || undefined)}
        className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand text-sm font-semibold text-white transition-colors duration-300 hover:bg-brand-bright disabled:opacity-60 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
      >
        {pending ? "Processing…" : "Get checkout link"}
        {!pending && <HugeiconsIcon icon={ArrowUpRight01Icon} size={16} />}
      </button>
    </Modal>
  );
}
