import type { Referral, ReferralStatus } from "@/lib/api/types";

export { naira } from "../../_components/format";

export const STATUS_META: Record<
  ReferralStatus,
  { label: string; className: string }
> = {
  paid: { label: "Paid · earned", className: "bg-cloud text-brand" },
  joined: { label: "Joined", className: "bg-amber-100 text-amber-700" },
  pending: { label: "Invite sent", className: "bg-paper text-ink-soft" },
};

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Two-letter initials for a referral row's avatar chip. */
export function initials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  );
}

/** Rolled-up referral position for the stat row. */
export function summarizeReferrals(referrals: Referral[]) {
  return {
    invited: referrals.length,
    joined: referrals.filter((r) => r.status !== "pending").length,
    earned: referrals.reduce((sum, r) => sum + r.reward, 0),
  };
}
