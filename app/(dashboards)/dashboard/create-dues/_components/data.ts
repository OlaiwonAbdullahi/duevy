import type { RepDueStatus, RepDue } from "./types";

export const naira = (n: number) =>
  `₦${Math.abs(n).toLocaleString("en-NG", { minimumFractionDigits: 0 })}`;

/** The body this rep runs collections for — dues are raised against it. */
export const REP_SPACE = {
  name: "Computer Science Students' Association",
  short: "CSSA",
  memberCount: 412,
};

export const STATUS_META: Record<
  RepDueStatus,
  { label: string; className: string }
> = {
  active: { label: "Active", className: "bg-cloud text-brand" },
  draft: { label: "Draft", className: "bg-paper text-ink-soft" },
  closed: { label: "Closed", className: "bg-amber-100 text-amber-700" },
};

/* ---- Seed dues the rep has already raised. Mock until the API lands. ---- */
export const INITIAL_REP_DUES: RepDue[] = [
  {
    id: "rd1",
    title: "First Semester Departmental Levy",
    note: "Covers labs, printing credits and the resource portal.",
    amount: 7500,
    dueDate: "2026-07-18",
    category: "levy",
    allowGuests: false,
    status: "active",
    paidCount: 168,
    memberCount: REP_SPACE.memberCount,
  },
  {
    id: "rd2",
    title: "Data Structures Handout",
    note: "Compiled lecture notes — CSC 201.",
    amount: 2000,
    dueDate: "2026-07-10",
    category: "handout",
    allowGuests: false,
    status: "active",
    paidCount: 251,
    memberCount: REP_SPACE.memberCount,
  },
  {
    id: "rd3",
    title: "Annual Dinner & Awards Night",
    note: "Ticket to the end-of-session dinner.",
    amount: 5000,
    dueDate: "2026-08-05",
    category: "dinner",
    allowGuests: true,
    status: "draft",
    paidCount: 0,
    memberCount: REP_SPACE.memberCount,
  },
  {
    id: "rd4",
    title: "Welfare Contribution",
    note: "Termly welfare pool for members in need.",
    amount: 1500,
    dueDate: "2026-06-20",
    category: "welfare",
    allowGuests: false,
    status: "closed",
    paidCount: 389,
    memberCount: REP_SPACE.memberCount,
  },
];
