import {
  CheckmarkCircle02Icon,
  Clock01Icon,
  MoneyReceive02Icon,
  MoneySend01Icon,
  UserAdd01Icon,
  GiftIcon,
  Notification02Icon,
} from "@hugeicons/core-free-icons";
import type { HugeIcon } from "./nav-config";

export type NotificationTone = "brand" | "amber" | "rose";

/** Icon per server notification `kind` (§13). */
export const KIND_ICON: Record<string, HugeIcon> = {
  due_reminder: Clock01Icon,
  payment_received: MoneyReceive02Icon,
  join_request: UserAdd01Icon,
  payout_completed: MoneySend01Icon,
  poll_milestone: CheckmarkCircle02Icon,
  referral_earned: GiftIcon,
  system: Notification02Icon,
};

/** Compact relative time for the feed, e.g. "2h ago", "Yesterday", "3 days ago". */
export function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const mins = Math.round((Date.now() - then) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(iso).toLocaleDateString("en-NG", { day: "2-digit", month: "short" });
}

export type AppNotification = {
  id: string;
  icon: HugeIcon;
  tone: NotificationTone;
  title: string;
  detail: string;
  time: string;
  href?: string;
  read: boolean;
};

export const TONE_CLASS: Record<NotificationTone, string> = {
  brand: "bg-cloud text-brand",
  amber: "bg-amber-100 text-amber-700",
  rose: "bg-rose-100 text-rose-600",
};
