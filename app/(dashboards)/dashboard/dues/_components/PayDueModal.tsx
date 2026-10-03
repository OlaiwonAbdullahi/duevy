import { HugeiconsIcon } from "@hugeicons/react";
import { BankIcon, ArrowRight01Icon, InvoiceIcon } from "@hugeicons/core-free-icons";
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
  onConfirm: () => void;
}) {
  // Face values only: the service fee (2% + ₦20) is charged once per basket,
  // so for several dues it's less than the sum of each due's own fee — the
  // exact figure comes back with the checkout on the next screen.
  const face = dues.reduce((sum, d) => sum + d.faceAmount, 0);
  const multi = dues.length > 1;
  const singleFee = !multi && dues[0].fee > 0 ? dues[0].fee : null;

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
                  {naira(d.faceAmount)}
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
              {naira(dues[0].faceAmount)}
            </p>
          </div>
        )}

        <div className="mt-3 flex flex-col gap-1.5 border-t border-cloud pt-3">
          {singleFee !== null ? (
            <>
              <div className="flex items-center justify-between text-xs text-ink-soft">
                <span>Service fee (2% + ₦20)</span>
                <span className="font-medium text-ink">{naira(singleFee)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-ink-soft">Total to transfer</span>
                <span className="text-lg font-semibold tracking-tight text-ink">
                  {naira(face + singleFee)}
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-ink-soft">
                  {multi ? "Dues total" : "Due amount"}
                </span>
                <span className="text-lg font-semibold tracking-tight text-ink">
                  {naira(face)}
                </span>
              </div>
              <p className="text-[11px] leading-relaxed text-ink-soft">
                Plus a service fee of 2% + ₦20{multi ? ", charged once for all of these" : ""}.
                You&apos;ll see the exact total on the next screen.
              </p>
            </>
          )}
        </div>
      </div>

      <div className="mt-5 flex items-start gap-3 rounded-2xl border border-cloud bg-paper p-4">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-canvas text-brand">
          <HugeiconsIcon icon={BankIcon} size={18} />
        </span>
        <p className="text-xs leading-relaxed text-ink-soft">
          You&apos;ll get <span className="font-semibold text-ink">bank transfer details</span>{" "}
          — a one-time account number for {multi ? "these dues" : "this due"}. Send the exact
          amount from any bank app and we&apos;ll confirm it automatically.
        </p>
      </div>

      <button
        type="button"
        disabled={pending}
        onClick={onConfirm}
        className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand text-sm font-semibold text-white transition-colors duration-300 hover:bg-brand-bright disabled:opacity-60 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
      >
        {pending ? "Setting up…" : "Get transfer details"}
        {!pending && <HugeiconsIcon icon={ArrowRight01Icon} size={16} />}
      </button>
    </Modal>
  );
}
