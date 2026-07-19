"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { accountLabel, naira } from "./_components/data";
import type { BankAccount, Payout } from "./_components/types";

/** Placeholder until the rep's real account loads from the API. */
const EMPTY_ACCOUNT: BankAccount = { bankName: "", accountName: "", accountNumber: "" };
import { PayoutBalanceCard } from "./_components/PayoutBalanceCard";
import { PayoutAccountCard } from "./_components/PayoutAccountCard";
import { PayoutHistory } from "./_components/PayoutHistory";
import { WithdrawModal } from "./_components/WithdrawModal";
import { EditAccountModal } from "./_components/EditAccountModal";
import { useRepSpace } from "../_components/use-rep-space";
import { fromKobo } from "../_components/format";
import { timeAgo } from "../_components/notifications-data";
import { Skeleton } from "../_components/Skeleton";
import {
  getPayoutSummary,
  getPayoutAccount,
  setPayoutAccount,
  requestPayout,
  listPayouts,
} from "@/lib/api/payouts";
import type { AccountEdit } from "./_components/EditAccountModal";
import type { Payout as ApiPayout } from "@/lib/api/types";
import { ApiError } from "@/lib/api/errors";

/** API payout (kobo, ISO date) → history row. */
function adaptPayout(p: ApiPayout): Payout {
  return {
    id: p.id,
    amount: fromKobo(p.amount),
    requestedAt: timeAgo(p.requestedAt),
    reference: p.reference,
    status: p.status,
    account: p.account,
  };
}

export default function PayoutPage() {
  const repSpace = useRepSpace();
  const spaceId = repSpace?.id;

  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [account, setAccount] = useState<BankAccount>(EMPTY_ACCOUNT);
  const [hasAccount, setHasAccount] = useState(false);
  const [available, setAvailable] = useState(0);
  const [pending, setPending] = useState(0);
  const [collected, setCollected] = useState(0);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  async function refresh(id: string) {
    const [summary, acct, history] = await Promise.all([
      getPayoutSummary(id),
      getPayoutAccount(id).catch(() => null), // no account set yet is fine
      listPayouts(id),
    ]);
    setAvailable(fromKobo(summary.available));
    setPending(fromKobo(summary.pending));
    // Total ever in the department's favour — available + in-flight + paid out.
    setCollected(fromKobo(summary.available + summary.pending + summary.lifetime));
    if (acct && acct.accountNumber) {
      setAccount({
        bankName: acct.bankName ?? "",
        accountName: acct.accountName ?? "",
        accountNumber: acct.accountNumber,
      });
      setHasAccount(true);
    } else {
      setHasAccount(false);
    }
    setPayouts(history.map(adaptPayout));
  }

  useEffect(() => {
    if (!spaceId) return;
    refresh(spaceId)
      .catch(() => toast.error("Couldn't load your payout details."))
      .finally(() => setLoading(false));
  }, [spaceId]);

  const handleWithdraw = async (amount: number) => {
    if (!spaceId) return;
    try {
      await requestPayout(spaceId, { amount: amount * 100 });
      setWithdrawOpen(false);
      toast.success("Payout requested", {
        description: `${naira(amount)} on its way to ${account.accountName}.`,
      });
      await refresh(spaceId);
    } catch {
      toast.error("Couldn't request the payout. Please try again.");
    }
  };

  const handleSaveAccount = async (next: AccountEdit) => {
    if (!spaceId) return;
    try {
      // The API strictly takes { bankCode, accountNumber } — the account name is
      // resolved + verified server-side via Paystack name-enquiry.
      await setPayoutAccount(spaceId, {
        bankCode: next.bankCode,
        accountNumber: next.accountNumber,
      });
      setEditOpen(false);
      toast.success("Payout account updated", {
        description: `${next.bankName} · ${accountLabel({
          bankName: next.bankName,
          accountName: "",
          accountNumber: next.accountNumber,
        })}`,
      });
      await refresh(spaceId);
    } catch (err) {
      const unverifiable =
        err instanceof ApiError && err.code === "ACCOUNT_UNVERIFIABLE";
      toast.error(
        unverifiable ? "We couldn't verify that account" : "Couldn't update the account",
        {
          description: unverifiable
            ? "Double-check the bank and account number and try again."
            : "Something went wrong. Please try again.",
        },
      );
    }
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

      {loading ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <Skeleton className="h-48 rounded-3xl" />
          <Skeleton className="h-48 rounded-3xl" />
        </div>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <PayoutBalanceCard
            available={available}
            collected={collected}
            pending={pending}
            onWithdraw={() => setWithdrawOpen(true)}
          />
          <PayoutAccountCard
            account={account}
            hasAccount={hasAccount}
            onEdit={() => setEditOpen(true)}
          />
        </div>
      )}

      <div className="mt-6">
        {loading ? (
          <Skeleton className="h-64 rounded-3xl" />
        ) : (
          <PayoutHistory payouts={payouts} />
        )}
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
          spaceId={spaceId ?? ""}
          account={account}
          onClose={() => setEditOpen(false)}
          onSave={handleSaveAccount}
        />
      )}
    </div>
  );
}
