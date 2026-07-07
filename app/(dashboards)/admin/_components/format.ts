/** Admin money/percent formatting — same naira style as the dashboard. */
export { naira } from "../../dashboard/_components/format";

/** Formats a 0..1 ratio as a whole percent, e.g. 0.86 → "86%". */
export function formatPercent01(value: number) {
  return `${Math.round(value * 100)}%`;
}
