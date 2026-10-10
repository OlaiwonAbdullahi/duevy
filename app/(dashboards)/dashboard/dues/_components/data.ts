import {
  Book02Icon,
  Restaurant01Icon,
  Coins01Icon,
  FootballIcon,
  FavouriteIcon,
  Building03Icon,
  UserMultipleIcon,
  MortarboardIcon,
  StarIcon,
} from "@hugeicons/core-free-icons";
import type { HugeIcon } from "../../_components/nav-config";
import type { Card } from "../../wallet/_components/types";
import type { DueCategory, EmblemHue, Space, Due, SpaceKind } from "./types";

export const naira = (n: number) =>
  `₦${Math.abs(n).toLocaleString("en-NG", { minimumFractionDigits: 0 })}`;

/**
 * Emblem palettes. Each space paints its crest from one of these — a deep base
 * for the plate, a brighter tint for the monogram sheen, and a soft ring color.
 * Tuned to sit calmly on the canvas rather than shout, so the wall of spaces
 * reads as a mature set of crests instead of a rainbow of app icons.
 */
export const EMBLEM_PALETTES: Record<
  EmblemHue,
  { base: string; sheen: string; ring: string; ink: string }
> = {
  emerald: { base: "#0b6e4f", sheen: "#14b581", ring: "#0f996d", ink: "#ffffff" },
  indigo: { base: "#33357a", sheen: "#5b5fd6", ring: "#474aa8", ink: "#ffffff" },
  amber: { base: "#8a5a12", sheen: "#e8a33d", ring: "#c07f1f", ink: "#ffffff" },
  rose: { base: "#8a2846", sheen: "#d6537a", ring: "#b23a60", ink: "#ffffff" },
  slate: { base: "#2b3a34", sheen: "#5c7268", ring: "#425049", ink: "#ffffff" },
};

export const SPACE_KIND_LABEL: Record<SpaceKind, string> = {
  department: "Department",
  association: "Association",
  faculty: "Faculty",
  club: "Club",
};

export const CATEGORY_ICON: Record<DueCategory, HugeIcon> = {
  levy: Coins01Icon,
  dinner: Restaurant01Icon,
  handout: Book02Icon,
  welfare: FavouriteIcon,
  sport: FootballIcon,
};

export const CATEGORY_LABEL: Record<DueCategory, string> = {
  levy: "Levy",
  dinner: "Dinner",
  handout: "Handout",
  welfare: "Welfare",
  sport: "Sports",
};

/** Glyph struck into the emblem medallion — reads the kind of body it is. */
export const KIND_GLYPH: Record<SpaceKind, HugeIcon> = {
  department: Building03Icon,
  association: UserMultipleIcon,
  faculty: MortarboardIcon,
  club: StarIcon,
};

/** Rolled-up dues position for a single space. */
export type SpaceSummary = {
  outstanding: number; // sum of unpaid + overdue amounts
  openCount: number; // number of unpaid/overdue dues
  overdueCount: number;
  paidCount: number;
  nextDue?: Due; // soonest-dated open due, if any
};

export function summarizeSpace(
  spaceId: string,
  source: Due[] = DUES,
): SpaceSummary {
  const dues = source.filter((d) => d.spaceId === spaceId);
  const open = dues.filter((d) => d.status !== "paid");
  const nextDue = [...open].sort(
    (a, b) => +new Date(a.dueDate) - +new Date(b.dueDate),
  )[0];
  return {
    outstanding: open.reduce((sum, d) => sum + d.amount, 0),
    openCount: open.length,
    overdueCount: dues.filter((d) => d.status === "overdue").length,
    paidCount: dues.filter((d) => d.status === "paid").length,
    nextDue,
  };
}

/** Human "in 5 days" / "3 days ago" / "today" for a due date. */
export function relativeDue(iso: string): { text: string; past: boolean } {
  const day = 86_400_000;
  const diff = Math.round((+new Date(iso) - Date.now()) / day);
  if (diff === 0) return { text: "due today", past: false };
  if (diff > 0)
    return { text: `due in ${diff} day${diff === 1 ? "" : "s"}`, past: false };
  const n = Math.abs(diff);
  return { text: `${n} day${n === 1 ? "" : "s"} overdue`, past: true };
}

/* ---- Mock data. Swapped for real queries once the API lands. ---- */

/** Saved cards, seeded to match the wallet demo. */
export const SAVED_CARDS: Card[] = [
  { id: "c1", brand: "Visa", last4: "4242", expiry: "08/27", isDefault: true },
  { id: "c2", brand: "Mastercard", last4: "5309", expiry: "11/26", isDefault: false },
  { id: "c3", brand: "Verve", last4: "8821", expiry: "03/28", isDefault: false },
];

export const SPACES: Space[] = [
  {
    id: "csc",
    name: "Computer Science Students' Association",
    short: "CSSA",
    kind: "association",
    membership: "member",
    hue: "emerald",
    memberCount: 412,
  },
  {
    id: "nacos",
    name: "Nigeria Association of Computing Students",
    short: "NACOS",
    kind: "association",
    membership: "member",
    hue: "indigo",
    memberCount: 1280,
  },
  {
    id: "sug",
    name: "Faculty of Science Students' Union",
    short: "FSSU",
    kind: "faculty",
    membership: "member",
    hue: "slate",
    memberCount: 5400,
  },
  {
    id: "eng",
    name: "Engineering Students' Society — Dinner",
    short: "ESS",
    kind: "association",
    membership: "guest",
    hue: "amber",
    memberCount: 2100,
  },
  {
    id: "robotics",
    name: "Robotics & Automation Club",
    short: "RAC",
    kind: "club",
    membership: "guest",
    hue: "rose",
    memberCount: 96,
  },
];

export const DUES: Due[] = [
  // CSSA
  {
    id: "d1",
    spaceId: "csc",
    title: "First Semester Departmental Levy",
    note: "Covers labs, printing credits and the resource portal.",
    amount: 7500,
    dueDate: "2026-07-18",
    status: "unpaid",
    category: "levy",
  },
  {
    id: "d2",
    spaceId: "csc",
    title: "Data Structures Handout",
    note: "Compiled lecture notes — CSC 201.",
    amount: 2000,
    dueDate: "2026-07-10",
    status: "overdue",
    category: "handout",
  },
  {
    id: "d3",
    spaceId: "csc",
    title: "Welfare Contribution",
    note: "Termly welfare pool for members in need.",
    amount: 1500,
    dueDate: "2026-06-20",
    status: "paid",
    category: "welfare",
  },
  // NACOS
  {
    id: "d4",
    spaceId: "nacos",
    title: "Annual Membership Dues",
    note: "National body registration for the session.",
    amount: 3000,
    dueDate: "2026-08-01",
    status: "unpaid",
    category: "levy",
  },
  {
    id: "d5",
    spaceId: "nacos",
    title: "Tech Week Access Pass",
    note: "Workshops, hackathon and career fair.",
    amount: 5000,
    dueDate: "2026-07-25",
    status: "unpaid",
    category: "sport",
  },
  // FSSU
  {
    id: "d6",
    spaceId: "sug",
    title: "Faculty Union Dues",
    note: "Faculty-wide student representation.",
    amount: 2500,
    dueDate: "2026-07-30",
    status: "unpaid",
    category: "levy",
  },
  {
    id: "d7",
    spaceId: "sug",
    title: "Science Games Levy",
    note: "Inter-departmental sports festival.",
    amount: 1000,
    dueDate: "2026-06-15",
    status: "paid",
    category: "sport",
  },
  // ESS (guest — paying at another association)
  {
    id: "d8",
    spaceId: "eng",
    title: "Annual Dinner & Awards Night",
    note: "Guest ticket — you were invited by a member.",
    amount: 12000,
    dueDate: "2026-07-12",
    status: "unpaid",
    category: "dinner",
  },
  // Robotics (guest)
  {
    id: "d9",
    spaceId: "robotics",
    title: "Build Season Kit",
    note: "Shared components for the competition build.",
    amount: 4500,
    dueDate: "2026-07-20",
    status: "unpaid",
    category: "handout",
  },
];
