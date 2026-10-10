/** Formats an amount as naira, e.g. 2500 → "₦2,500". Sign is dropped —
 * callers that care about direction render it themselves. */
export const naira = (n: number) =>
  `₦${Math.abs(n).toLocaleString("en-NG", { minimumFractionDigits: 0 })}`;

/** API amounts are integers in kobo; convert at the display boundary (₦1 = 100 kobo). */
export const fromKobo = (kobo: number) => kobo / 100;

/** Formats a kobo amount as naira, e.g. 250000 → "₦2,500". */
export const nairaFromKobo = (kobo: number) => naira(fromKobo(kobo));
