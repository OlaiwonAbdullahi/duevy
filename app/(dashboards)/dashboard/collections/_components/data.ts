import type { StatusFilter } from "./types";

export const COLLECTION_TABS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "paid", label: "Paid" },
  { value: "unpaid", label: "Unpaid" },
];
