// Shared by the app and scripts/sync-bank-logos.mjs (which imports this .ts
// file directly), so both sides key bank names the same way. Keep it
// dependency-free.

/** Lowercase, drop filler words ("bank", "plc", "microfinance"…) and punctuation. */
export function normaliseBankName(name: string): string {
  return name
    .toLowerCase()
    .replace(/micro[\s-]+finance/g, " ")
    .replace(/\b(plc|limited|ltd|bank|microfinance|mfb|mfbb|nigeria|of|the|psb|company)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Names the provider spells differently from the logo sources, for when the
 * bank code doesn't match either: fragment of the normalised name → file in
 * public/banks/ (without `.png`). The sync script fails if a target is missing.
 */
export const BANK_LOGO_ALIASES: [fragment: string, file: string][] = [
  ["opay", "opay-digital-services-limited-opay"],
  ["paycom", "opay-digital-services-limited-opay"],
  // Banks' own wallets and mobile-money arms use the parent bank's mark.
  ["access mobile", "access-bank"],
  ["ecobank mobile", "ecobank-nigeria"],
  ["ecobank express", "ecobank-xpress-account"],
  ["sterling mobile", "sterling-bank"],
  ["fbn mobile", "first-bank-of-nigeria"],
  ["firstmonie", "first-bank-of-nigeria"],
  ["gtbank mobile", "guaranty-trust-bank"],
  ["stanbic mobile", "stanbic-ibtc-bank"],
  ["flutterwave", "flutterwave-mfb"],
  ["nova merchant", "nova-bank"],
];
