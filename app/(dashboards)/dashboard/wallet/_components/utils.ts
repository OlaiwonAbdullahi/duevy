export const naira = (n: number) =>
  `₦${Math.abs(n).toLocaleString("en-NG", { minimumFractionDigits: 0 })}`;

/** Rough brand guess from the first digit — enough for a demo. */
export function brandFromNumber(digits: string) {
  if (digits.startsWith("4")) return "Visa";
  if (digits.startsWith("5")) return "Mastercard";
  if (digits.startsWith("6") || digits.startsWith("50")) return "Verve";
  return "Card";
}

/** Brand → local SVG logo (downloaded to /public/cards). */
export const CARD_LOGOS: Record<string, string> = {
  Visa: "/cards/visa.svg",
  Mastercard: "/cards/mastercard.svg",
  Verve: "/cards/verve.jpeg",
};

export const TOP_UP_PRESETS = [1000, 2000, 5000, 10000];

/* Brand-styled overrides for shadcn primitives (Guild green, taller fields). */

export const PRIMARY_BUTTON =
  "h-12 w-full rounded-full bg-brand text-sm font-semibold text-white hover:bg-brand-bright";

export const BRAND_INPUT =
  "h-11 rounded-2xl border-cloud bg-canvas px-4 text-sm text-ink shadow-none placeholder:text-ink-soft focus-visible:border-brand focus-visible:ring-[3px] focus-visible:ring-brand/15";

/** For an Input nested inside a bordered container (prefix/suffix layouts). */
export const BARE_INPUT =
  "h-11 border-0 bg-transparent px-2 text-sm shadow-none focus-visible:ring-0 text-ink placeholder:text-ink-soft";
