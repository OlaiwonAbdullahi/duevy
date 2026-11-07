import { naira } from "../../create-dues/_components/data";
import { fromKobo } from "../../_components/format";
import { timeAgo } from "../../_components/notifications-data";
import type { Payout as ApiPayout } from "@/lib/api/types";
import type { Beneficiary, Payout, PayoutStatus } from "./types";

export { naira };

/** Mask all but the last four digits of an account number. */
export function maskAccount(number: string) {
  const last4 = number.slice(-4);
  return `•••• ${last4}`;
}

/** Short destination label for a payout row, e.g. "GTBank •••• 4021". */
export function accountLabel(account: Pick<Beneficiary, "bankName" | "accountNumber">) {
  const short = account.bankName.split(" ")[0];
  return `${short} •••• ${account.accountNumber.slice(-4)}`;
}

/** Statuses where the withdrawal hasn't settled yet (money reserved, outcome unknown). */
export const IN_FLIGHT_STATUSES: readonly PayoutStatus[] = ["awaiting_approval", "pending", "processing"];

export const isPayoutInFlight = (status: PayoutStatus) => IN_FLIGHT_STATUSES.includes(status);

/** One badge style per status, used by the history, detail modal and receipt. */
export const PAYOUT_STATUS_META: Record<
  PayoutStatus,
  { label: string; className: string; dot: string }
> = {
  awaiting_approval: { label: "Awaiting approval", className: "bg-amber-100 text-amber-700", dot: "bg-amber-500" },
  pending: { label: "Pending", className: "bg-amber-100 text-amber-700", dot: "bg-amber-500" },
  processing: { label: "Processing", className: "bg-sky-100 text-sky-700", dot: "bg-sky-500" },
  success: { label: "Paid out", className: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
  failed: { label: "Failed", className: "bg-rose-100 text-rose-600", dot: "bg-rose-500" },
  reversed: { label: "Reversed", className: "bg-paper text-ink-soft", dot: "bg-ink-soft" },
  cancelled: { label: "Cancelled", className: "bg-paper text-ink-soft", dot: "bg-ink-soft" },
};

/** API payout (kobo, ISO dates) → view row (naira, display date + raw timeline). */
export function adaptPayout(p: ApiPayout): Payout {
  return {
    id: p.id,
    amount: fromKobo(p.amount),
    fee: fromKobo(p.fee),
    net: fromKobo(p.net),
    requestedAt: timeAgo(p.requestedAt),
    reference: p.reference,
    status: p.status,
    requestedById: p.requestedById,
    dueId: p.dueId ?? null,
    account: p.account,
    accountName: p.accountName ?? null,
    failureReason: p.failureReason,
    note: p.note ?? null,
    timeline: {
      requestedAt: p.requestedAt,
      processingAt: p.processingAt,
      settledAt: p.settledAt,
      failedAt: p.failedAt,
      reversedAt: p.reversedAt,
      cancelledAt: p.cancelledAt ?? null,
      approvalExpiresAt: p.approvalExpiresAt ?? null,
    },
  };
}
