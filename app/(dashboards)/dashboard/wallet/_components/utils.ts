export { naira } from "../../_components/format";

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
