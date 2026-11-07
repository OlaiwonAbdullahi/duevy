"use client";

import { useRepSpace } from "../_components/use-rep-space";
import { LedgerCard } from "../payout/_components/LedgerCard";

/**
 * Every movement in the department's balance (`GET /spaces/:spaceId/ledger`),
 * paginated by the server: student payments, direct deposits into the
 * department account, withdrawals, transfer fees, reversals and refunds.
 */
export default function ActivityPage() {
  const repSpace = useRepSpace();

  return (
    <div className="mx-auto max-w-6xl">
      <header>
        <span className="mb-2 hidden rounded-full bg-cloud px-3 py-1 text-[11px] font-semibold text-brand sm:inline-block">
          Rep tools
        </span>
        <div className="flex items-center gap-1.5">
          <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">Activity</h1>
        </div>
      </header>

      <div className="mt-4 sm:mt-6">
        <LedgerCard spaceId={repSpace?.id} perPage={20} />
      </div>
    </div>
  );
}
