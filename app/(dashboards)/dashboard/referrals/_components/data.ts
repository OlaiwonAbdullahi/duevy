/** Where a referred friend has got to — drives the status badge + reward. */
export type ReferralStatus = "paid" | "joined" | "pending";

export type Referral = {
  id: string;
  name: string;
  initials: string;
  status: ReferralStatus;
  /** Naira earned from this friend so far (0 until they pay their first due). */
  reward: number;
  /** ISO date they were invited / joined. */
  date: string;
};

export { naira } from "../../_components/format";

export const REFERRAL_CODE = "AMARA500";
export const REWARD_PER_REFERRAL = 500;

/** Public join link carrying the referral code. */
export const referralLink = `https://duevy.app/join?ref=${REFERRAL_CODE}`;

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

/* ---- Mock referrals. Swapped for real queries once the API lands. ---- */
export const REFERRALS: Referral[] = [
  {
    id: "r1",
    name: "Chidera Okeke",
    initials: "CO",
    status: "paid",
    reward: 500,
    date: "2026-07-02",
  },
  {
    id: "r2",
    name: "Tunde Bakare",
    initials: "TB",
    status: "paid",
    reward: 500,
    date: "2026-06-24",
  },
  {
    id: "r3",
    name: "Ngozi Umeh",
    initials: "NU",
    status: "joined",
    reward: 0,
    date: "2026-06-30",
  },
  {
    id: "r4",
    name: "Fatima Sani",
    initials: "FS",
    status: "joined",
    reward: 0,
    date: "2026-06-29",
  },
  {
    id: "r5",
    name: "Emeka Nwosu",
    initials: "EN",
    status: "pending",
    reward: 0,
    date: "2026-06-27",
  },
];

/** Rolled-up referral position for the stat row. */
export function summarizeReferrals(source: Referral[] = REFERRALS) {
  return {
    invited: source.length,
    joined: source.filter((r) => r.status !== "pending").length,
    earned: source.reduce((sum, r) => sum + r.reward, 0),
  };
}
