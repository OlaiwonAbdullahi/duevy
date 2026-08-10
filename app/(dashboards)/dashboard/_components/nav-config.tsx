import {
  Home01Icon,
  Invoice01Icon,
  AddInvoiceIcon,
  ReceiptDollarIcon,
  Settings02Icon,
  Building03Icon,
  UserMultipleIcon,
  CheckmarkSquare01Icon,
  MoneySend01Icon,
  Analytics01Icon,
  Shield01Icon,
  GiftIcon,
  UserGroup03Icon,
  Megaphone01Icon,
  AiChat01Icon,
} from "@hugeicons/core-free-icons";
import { FEATURES } from "@/lib/features";

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
  /** When true, the group header gets a chevron that collapses its links. */
  collapsible?: boolean;
};

/**
 * Every student (and every rep, since a rep is also a student) sees these.
 * `Overview` points at the dashboard root, not a separate `/overview` route.
 */
export const STUDENT_LINKS: NavLink[] = [
  { label: "Overview", href: "/dashboard", icon: Home01Icon },
  { label: "My dues", href: "/dashboard/dues", icon: Invoice01Icon },
  {
    label: "Transactions",
    href: "/dashboard/transactions",
    icon: ReceiptDollarIcon,
  },
  ...(FEATURES.assistant
    ? [{ label: "Assistant", href: "/dashboard/assistant", icon: AiChat01Icon }]
    : []),
  { label: "Settings", href: "/dashboard/settings", icon: Settings02Icon },
];

/**
 * Rep-only tools. Shown *in addition* to the student links when the viewer is a
 * rep — a rep runs the department's collections on top of their own dues and payments.
 * Referrals lives here (not in STUDENT_LINKS) because the backend restricts
 * the referral program to reps/admins — a plain student gets a 403.
 */
export const REP_LINKS: NavLink[] = [
  { label: "Overview", href: "/dashboard", icon: Home01Icon },
  {
    label: "Create dues",
    href: "/dashboard/create-dues",
    icon: AddInvoiceIcon,
  },
  { label: "Circle", href: "/dashboard/circle", icon: UserGroup03Icon }, // members etc.
  ...(FEATURES.polls
    ? [{ label: "Create Vote Poll", href: "/dashboard/polls", icon: CheckmarkSquare01Icon }]
    : []),
  { label: "Payout", href: "/dashboard/payout", icon: MoneySend01Icon },
  ...(FEATURES.referrals
    ? [{ label: "Referrals", href: "/dashboard/referrals", icon: GiftIcon }]
    : []),
  { label: "Manage dept.", href: "/dashboard/manage", icon: Building03Icon },
];

/**
 * Rep-only route prefixes — every REP_LINK except the shared Overview root.
 * Used to gate these routes for students who reach them by URL.
 */
export const REP_ONLY_PREFIXES = REP_LINKS.map((link) => link.href).filter(
  (href) => href !== "/dashboard",
);

export function isRepOnlyPath(pathname: string) {
  return REP_ONLY_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/"),
  );
}

/**
 * Dashboard route prefixes for pilot-cut features — blocked regardless of
 * role when the corresponding flag in lib/features.ts is off, so a direct
 * URL hit doesn't reach a page that's been hidden from the nav.
 */
const FEATURE_GATED_PREFIXES = [
  ...(FEATURES.assistant ? [] : ["/dashboard/assistant"]),
  ...(FEATURES.polls ? [] : ["/dashboard/polls"]),
  ...(FEATURES.referrals ? [] : ["/dashboard/referrals"]),
];

export function isFeatureGatedPath(pathname: string) {
  return FEATURE_GATED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/"),
  );
}

/**
 * Build the sidebar groups for a given role. A rep gets both sets; the student
 * links then gain a header so they can be collapsed away to focus on rep tools.
 */
export function getDashboardGroups(isRep: boolean): NavGroup[] {
  if (!isRep) return [{ links: STUDENT_LINKS }];
  return [
    { title: "Student", links: STUDENT_LINKS, collapsible: true },
    { title: "Rep tools", links: REP_LINKS, collapsible: true },
  ];
}

/** Admin is its own area with its own sidebar — no student/rep mixing. */
export const ADMIN_LINKS: NavLink[] = [
  { label: "Overview", href: "/admin", icon: Home01Icon },
  { label: "Users", href: "/admin/users", icon: UserMultipleIcon },
  { label: "Reps", href: "/admin/reps", icon: UserGroup03Icon },
  { label: "Spaces", href: "/admin/spaces", icon: Building03Icon },
  {
    label: "Transactions",
    href: "/admin/transactions",
    icon: ReceiptDollarIcon,
  },
  ...(FEATURES.referrals
    ? [{ label: "Referrals", href: "/admin/referrals", icon: GiftIcon }]
    : []),
  ...(FEATURES.polls
    ? [{ label: "Polls", href: "/admin/polls", icon: CheckmarkSquare01Icon }]
    : []),
  { label: "Disputes", href: "/admin/disputes", icon: Megaphone01Icon },
  { label: "Reports", href: "/admin/reports", icon: Analytics01Icon },
  { label: "Settings", href: "/admin/settings", icon: Shield01Icon },
];

export const ADMIN_GROUPS: NavGroup[] = [{ links: ADMIN_LINKS }];
