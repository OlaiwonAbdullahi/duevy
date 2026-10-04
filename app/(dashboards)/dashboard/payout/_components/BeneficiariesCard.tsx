"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, Delete02Icon, UserMultipleIcon } from "@hugeicons/core-free-icons";
import { EmptyState } from "../../_components/EmptyState";
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
  // Two-step remove: the first tap arms the row, the second removes it.
  const [armedId, setArmedId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const remove = async (b: Beneficiary) => {
    if (armedId !== b.id) {
      setArmedId(b.id);
      return;
    }
    setRemovingId(b.id);
    try {
      await onRemove(b);
    } finally {
      setRemovingId(null);
      setArmedId(null);
    }
  };

  return (
    <section className="flex flex-col rounded-3xl border border-cloud bg-canvas p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-base font-semibold tracking-tight text-ink">
            Beneficiaries
          </h2>
          <p className="mt-0.5 text-xs text-ink-soft">
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
        <ul className="mt-5 max-h-80 divide-y divide-cloud overflow-y-auto rounded-2xl border border-cloud">
          {beneficiaries.map((b) => (
            <li key={b.id} className="flex items-center gap-3 px-4 py-3">
              <BankLogo name={b.bankName} className="h-9 w-9 shrink-0 text-[11px]" />
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
                  onClick={() => remove(b)}
                  onBlur={() => armedId === b.id && removingId !== b.id && setArmedId(null)}
                  disabled={removingId === b.id}
                  aria-label={`Remove ${b.label ?? b.accountName}`}
                  className={
                    armedId === b.id
                      ? "inline-flex h-8 shrink-0 items-center rounded-full bg-rose-600 px-3 text-[11px] font-semibold text-white transition-colors disabled:opacity-60 cursor-pointer"
                      : "grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink-soft transition-colors hover:bg-rose-50 hover:text-rose-600 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                  }
                >
                  {armedId === b.id ? (
                    removingId === b.id ? "Removing…" : "Remove?"
                  ) : (
                    <HugeiconsIcon icon={Delete02Icon} size={16} />
                  )}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
