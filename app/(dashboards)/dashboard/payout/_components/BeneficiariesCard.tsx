"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, Delete02Icon, UserMultipleIcon } from "@hugeicons/core-free-icons";
import { EmptyState } from "../../_components/EmptyState";
import { ConfirmDialog } from "../../_components/ConfirmDialog";
import { BankLogo } from "./BankLogo";
import type { Beneficiary } from "./types";

/**
 * The accounts this space can withdraw to. Any rep can see them; only the lead
 * can add or remove one.
 */
export function BeneficiariesCard({
  beneficiaries,
  canManage,
  onAdd,
  onRemove,
}: {
  beneficiaries: Beneficiary[];
  canManage: boolean;
  onAdd: () => void;
  onRemove: (beneficiary: Beneficiary) => Promise<void>;
}) {
  // Removing asks first; the row shows a spinner while the request runs.
  const [toRemove, setToRemove] = useState<Beneficiary | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const remove = async (b: Beneficiary) => {
    setToRemove(null);
    setRemovingId(b.id);
    try {
      await onRemove(b);
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <section className="flex flex-col rounded-3xl border border-cloud bg-canvas p-4 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-base font-semibold tracking-tight text-ink">
            Beneficiaries
          </h2>
          <p className="mt-0.5 text-xs text-ink-soft max-sm:hidden">
            Accounts you can withdraw to: yours, a lecturer&apos;s or a vendor&apos;s.
          </p>
        </div>

        {canManage && beneficiaries.length > 0 && (
          <button
            type="button"
            onClick={onAdd}
            className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-full border border-cloud bg-paper px-4 text-xs font-semibold text-ink transition-colors duration-300 hover:bg-cloud cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
          >
            <HugeiconsIcon icon={Add01Icon} size={14} className="text-brand" />
            Add
          </button>
        )}
      </div>

      {beneficiaries.length === 0 ? (
        <EmptyState
          className="mt-5 flex-1 rounded-2xl border border-dashed border-cloud bg-paper"
          icon={UserMultipleIcon}
          title="No beneficiaries yet"
          description={
            canManage
              ? "Add the bank accounts you want to send your department's funds to."
              : "Your lead rep hasn't added any accounts to withdraw to yet."
          }
          action={
            canManage ? (
              <button
                type="button"
                onClick={onAdd}
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-brand px-5 text-[13px] font-semibold text-white transition-colors duration-300 hover:bg-brand-bright cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
              >
                <HugeiconsIcon icon={Add01Icon} size={15} />
                Add beneficiary
              </button>
            ) : undefined
          }
        />
      ) : (
        <ul className="mt-4 max-h-80 sm:mt-5 divide-y divide-cloud overflow-y-auto rounded-2xl border border-cloud">
          {beneficiaries.map((b) => (
            <li key={b.id} className="flex items-center gap-3 px-4 py-3">
              <BankLogo name={b.bankName} code={b.bankCode} className="h-9 w-9 shrink-0 text-[11px]" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">
                  {b.label ?? b.accountName}
                </p>
                <p className="truncate text-xs text-ink-soft">
                  {b.label ? `${b.accountName} · ` : ""}
                  {b.bankName} {b.accountNumber}
                </p>
              </div>
              {canManage && (
                <button
                  type="button"
                  onClick={() => setToRemove(b)}
                  disabled={removingId === b.id}
                  aria-label={`Remove ${b.label ?? b.accountName}`}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink-soft transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:cursor-progress cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                >
                  {removingId === b.id ? (
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-rose-600/30 border-t-rose-600" />
                  ) : (
                    <HugeiconsIcon icon={Delete02Icon} size={16} />
                  )}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={!!toRemove}
        icon={Delete02Icon}
        title="Remove this beneficiary?"
        description={
          toRemove
            ? `You won't be able to withdraw to ${toRemove.label ?? toRemove.accountName} (${toRemove.bankName} ${toRemove.accountNumber}) until it's added again. Past withdrawals aren't affected.`
            : ""
        }
        confirmLabel="Remove"
        onConfirm={() => toRemove && remove(toRemove)}
        onClose={() => setToRemove(null)}
      />
    </section>
  );
}
