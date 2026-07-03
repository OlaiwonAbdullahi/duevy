import {
  Home01Icon,
  Wallet01Icon,
  Invoice01Icon,
  ReceiptDollarIcon,
  Settings02Icon,
  Building03Icon,
  UserMultipleIcon,
  Megaphone01Icon,
  MoneySend01Icon,
  Analytics01Icon,
  Shield01Icon,
  GiftIcon,
} from "@hugeicons/core-free-icons";

/** The icon-data shape exported by @hugeicons/core-free-icons. */
export type HugeIcon = typeof Home01Icon;

export type NavLink = {
  label: string;
  href: string;
  icon: HugeIcon;
};

export type NavGroup = {
  /** Section label shown above the group. Omit for the top group. */
  title?: string;
  links: NavLink[];
};

/**
 * Every student (and every rep, since a rep is also a student) sees these.
 * `Overview` points at the dashboard root, not a separate `/overview` route.
 */
export const STUDENT_LINKS: NavLink[] = [
  { label: "Overview", href: "/dashboard", icon: Home01Icon },
  { label: "My dues", href: "/dashboard/dues", icon: Invoice01Icon },
  { label: "Wallet", href: "/dashboard/wallet", icon: Wallet01Icon }, // personal wallet — top up, cards
  {
    label: "Transactions",
    href: "/dashboard/transactions",
    icon: ReceiptDollarIcon,
  },
  { label: "Referrals", href: "/dashboard/referrals", icon: GiftIcon },
  { label: "Settings", href: "/dashboard/settings", icon: Settings02Icon },
];

/**
 * Rep-only tools. Shown *in addition* to the student links when the viewer is a
 * rep — a rep runs the department's collections on top of their own wallet.
 */
export const REP_LINKS: NavLink[] = [
  { label: "Manage dept", href: "/dashboard/manage", icon: Building03Icon },
  {
    label: "Collections",
    href: "/dashboard/collections",
    icon: UserMultipleIcon,
  }, // who's paid / unpaid
  {
    label: "Send reminders",
    href: "/dashboard/reminders",
    icon: Megaphone01Icon,
  },
  { label: "Payout", href: "/dashboard/payout", icon: MoneySend01Icon },
];

/** Build the sidebar groups for a given role. A rep gets both sets. */
export function getDashboardGroups(isRep: boolean): NavGroup[] {
  const groups: NavGroup[] = [{ links: STUDENT_LINKS }];
  if (isRep) groups.push({ title: "Rep tools", links: REP_LINKS });
  return groups;
}

/** Admin is its own area with its own sidebar — no student/rep mixing. */
export const ADMIN_LINKS: NavLink[] = [
  { label: "Overview", href: "/admin", icon: Home01Icon },
  { label: "Reps", href: "/admin/reps", icon: UserMultipleIcon },
  { label: "Departments", href: "/admin/departments", icon: Building03Icon },
  {
    label: "Transactions",
    href: "/admin/transactions",
    icon: ReceiptDollarIcon,
  },
  { label: "Reports", href: "/admin/reports", icon: Analytics01Icon },
  { label: "Settings", href: "/admin/settings", icon: Shield01Icon },
];

export const ADMIN_GROUPS: NavGroup[] = [{ links: ADMIN_LINKS }];
