export { naira } from "../../_components/format";

/** Brand → local SVG logo (downloaded to /public/cards). */
export const CARD_LOGOS: Record<string, string> = {
  Visa: "/cards/visa.svg",
  Mastercard: "/cards/mastercard.svg",
  Verve: "/cards/verve.jpeg",
};

/** Survives the gateway redirect round-trip so the return page can verify the add-card charge. */
export const ADDCARD_REF_KEY = "duevy-addcard-ref";
