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
import type { DueCategory, EmblemHue, Due, SpaceKind } from "./types";

export { naira } from "../../_components/format";

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

export function summarizeSpace(spaceId: string, source: Due[]): SpaceSummary {
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
