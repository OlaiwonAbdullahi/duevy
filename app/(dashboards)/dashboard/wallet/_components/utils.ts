export { naira } from "../../_components/format";

/** Brand → local SVG logo (downloaded to /public/cards). */
export const CARD_LOGOS: Record<string, string> = {
  Visa: "/cards/visa.svg",
  Mastercard: "/cards/mastercard.svg",
  Verve: "/cards/verve.jpeg",
};

export const TOP_UP_PRESETS = [1000, 2000, 5000, 10000];
