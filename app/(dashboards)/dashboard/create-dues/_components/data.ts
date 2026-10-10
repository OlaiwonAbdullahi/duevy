import type { RepDueStatus } from "./types";

export { naira } from "../../_components/format";

export const STATUS_META: Record<
  RepDueStatus,
  { label: string; className: string }
> = {
  active: { label: "Active", className: "bg-cloud text-brand" },
  draft: { label: "Draft", className: "bg-paper text-ink-soft" },
  closed: { label: "Closed", className: "bg-amber-100 text-amber-700" },
};
