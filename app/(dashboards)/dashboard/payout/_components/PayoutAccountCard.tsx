import { HugeiconsIcon } from "@hugeicons/react";
import { BankIcon, PencilEdit02Icon, Add01Icon } from "@hugeicons/core-free-icons";
import { EmptyState } from "../../_components/EmptyState";
import { maskAccount } from "./data";
import type { BankAccount } from "./types";

export function PayoutAccountCard({
  account,
  hasAccount,
  onEdit,
}: {
  account: BankAccount;
  /** Whether a payout account has been set up yet. */
  hasAccount: boolean;
  onEdit: () => void;
}) {
  return (
    <section className="rounded-3xl border border-cloud bg-canvas p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-cloud text-brand">
            <HugeiconsIcon icon={BankIcon} size={21} />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-semibold tracking-tight text-ink">
              Payout account
            </h2>
            <p className="mt-0.5 text-xs text-ink-soft">
              Cleared funds are settled here, usually within 24 hours.
            </p>
          </div>
        </div>

        {hasAccount && (
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-full border border-cloud bg-paper px-4 text-xs font-semibold text-ink transition-colors duration-300 hover:bg-cloud cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
          >
            <HugeiconsIcon icon={PencilEdit02Icon} size={14} className="text-brand" />
            Edit
          </button>
        )}
      </div>

      {hasAccount ? (
        <dl className="mt-5 grid gap-4 rounded-2xl border border-cloud bg-paper p-4 sm:grid-cols-3">
          <div>
            <dt className="text-[11px] font-medium text-ink-soft">Bank</dt>
            <dd className="mt-1 text-sm font-semibold text-ink">{account.bankName}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-medium text-ink-soft">Account name</dt>
            <dd className="mt-1 text-sm font-semibold text-ink">
              {account.accountName}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] font-medium text-ink-soft">Account number</dt>
            <dd className="mt-1 text-sm font-semibold text-ink tabular-nums">
              {maskAccount(account.accountNumber)}
            </dd>
          </div>
        </dl>
      ) : (
        <EmptyState
          className="mt-5 rounded-2xl border border-dashed border-cloud bg-paper"
          icon={BankIcon}
          title="No payout account yet"
          description="Add a bank account so you can withdraw the funds your department has collected."
          action={
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-brand px-5 text-[13px] font-semibold text-white transition-colors duration-300 hover:bg-brand-bright cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
            >
              <HugeiconsIcon icon={Add01Icon} size={15} />
              Add account
            </button>
          }
        />
      )}
    </section>
  );
}
