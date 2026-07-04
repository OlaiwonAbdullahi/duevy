"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  INITIAL_PAYOUTS,
  PAYOUT_ACCOUNT,
  TOTAL_COLLECTED,
  accountLabel,
  naira,
} from "./_components/data";
import type { BankAccount, Payout } from "./_components/types";
import { PayoutBalanceCard } from "./_components/PayoutBalanceCard";
import { PayoutAccountCard } from "./_components/PayoutAccountCard";
import { PayoutHistory } from "./_components/PayoutHistory";
import { WithdrawModal } from "./_components/WithdrawModal";
import { EditAccountModal } from "./_components/EditAccountModal";

export default function PayoutPage() {
  const [payouts, setPayouts] = useState<Payout[]>(INITIAL_PAYOUTS);
  const [account, setAccount] = useState<BankAccount>(PAYOUT_ACCOUNT);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  // Money already withdrawn (completed) or in flight (processing) is no longer
  // available; failed payouts return to the pool.
  const { available, pending } = useMemo(() => {
    const claimed = payouts
      .filter((p) => p.status === "completed" || p.status === "processing")
      .reduce((sum, p) => sum + p.amount, 0);
    const inFlight = payouts
      .filter((p) => p.status === "processing")
      .reduce((sum, p) => sum + p.amount, 0);
    return { available: TOTAL_COLLECTED - claimed, pending: inFlight };
  }, [payouts]);

  const handleWithdraw = (amount: number) => {
    const created: Payout = {
      id: crypto.randomUUID(),
      amount,
      requestedAt: "Just now",
      reference: `PYT-${Math.floor(90000 + Math.random() * 9999)}`,
      status: "processing",
      account: accountLabel(account),
    };
    setPayouts((list) => [created, ...list]);
    setWithdrawOpen(false);
    toast.success("Payout requested", {
      description: `${naira(amount)} on its way to ${account.accountName}.`,
    });
  };

  const handleSaveAccount = (next: BankAccount) => {
    setAccount(next);
    setEditOpen(false);
    toast.success("Payout account updated", {
      description: `${next.bankName} · ${accountLabel(next)}`,
    });
  };

  return (
    <div className="mx-auto max-w-5xl">
      <header>
        <span className="mb-2 inline-block rounded-full bg-cloud px-3 py-1 text-[11px] font-semibold text-brand">
          Rep tools
        </span>
        <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">
          Payout
        </h1>
        <p className="mt-1 text-[13px] text-ink-soft">
          Withdraw the funds your department has collected to its bank account.
        </p>
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <PayoutBalanceCard
          available={available}
          collected={TOTAL_COLLECTED}
          pending={pending}
          onWithdraw={() => setWithdrawOpen(true)}
        />
        <PayoutAccountCard account={account} onEdit={() => setEditOpen(true)} />
      </div>

      <div className="mt-6">
        <PayoutHistory payouts={payouts} />
      </div>

      {withdrawOpen && (
        <WithdrawModal
          available={available}
          account={account}
          onClose={() => setWithdrawOpen(false)}
          onConfirm={handleWithdraw}
        />
      )}
      {editOpen && (
        <EditAccountModal
          account={account}
          onClose={() => setEditOpen(false)}
          onSave={handleSaveAccount}
        />
      )}
    </div>
  );
}
