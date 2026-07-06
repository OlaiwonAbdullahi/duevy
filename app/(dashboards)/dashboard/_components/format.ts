/** Formats an amount as naira, e.g. 2500 → "₦2,500". Sign is dropped —
 * callers that care about direction render it themselves. */
export const naira = (n: number) =>
  `₦${Math.abs(n).toLocaleString("en-NG", { minimumFractionDigits: 0 })}`;
