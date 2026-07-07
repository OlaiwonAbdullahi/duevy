import {
  Home01Icon,
  Wallet01Icon,
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
  { label: "Overview", href: "/dashboard", icon: Home01Icon },
  {
    label: "Create dues",
    href: "/dashboard/create-dues",
    icon: AddInvoiceIcon,
  },
  { label: "Circle", href: "/dashboard/circle", icon: UserGroup03Icon }, // members etc.
  {
    label: "Collections",
    href: "/dashboard/collections",
    icon: UserMultipleIcon,
  }, // who's paid / unpaid
  {
    label: "Create Vote Poll",
    href: "/dashboard/polls",
    icon: CheckmarkSquare01Icon,
  },
  { label: "Payout", href: "/dashboard/payout", icon: MoneySend01Icon },
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
  { label: "Reps", href: "/admin/reps", icon: UserMultipleIcon },
  { label: "Spaces", href: "/admin/spaces", icon: Building03Icon },
  {
    label: "Transactions",
    href: "/admin/transactions",
    icon: ReceiptDollarIcon,
  },
  { label: "Referrals", href: "/admin/referrals", icon: GiftIcon },
  { label: "Disputes", href: "/admin/disputes", icon: Megaphone01Icon },  
  { label: "Reports", href: "/admin/reports", icon: Analytics01Icon },
  { label: "Settings", href: "/admin/settings", icon: Shield01Icon },
];

export const ADMIN_GROUPS: NavGroup[] = [{ links: ADMIN_LINKS }];
