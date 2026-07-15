import type { RepDueStatus } from "./types";

export { naira } from "../../_components/format";

/**
 * The body this rep runs collections for. Only the orphaned `/dashboard/collections`
 * route (unreachable — it has no `page.tsx`; the live "view collections" flow
 * is `create-dues`'s embedded `DueCollections`) still reads this; every live
 * page gets the real space from `useRepSpace()`.
 */
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
