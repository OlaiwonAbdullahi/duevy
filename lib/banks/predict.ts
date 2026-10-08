import getPredictedBanks from "nuban-prediction";
import type { Bank } from "@/lib/api/payouts";

const firstWord = (name: string) => name.trim().split(/\s+/)[0]?.toLowerCase() ?? "";

/**
 * Likely banks for a 10-digit account number, most popular first, drawn from
 * our live `/banks` list. Uses the NUBAN check-digit rule (or, for a number
 * that looks like a phone number, the phone-number fintechs like OPay), via
 * `nuban-prediction`. Only a hint: the name-enquiry still confirms the bank.
 *
 * Predicts against the library's own CBN-code list, then maps each hit onto
 * `banks` by code, falling back to the bank's first word, so it still works
 * if the provider's codes differ. An unmatched hit is dropped, never guessed.
 */
export function predictBanks(accountNumber: string, banks: Bank[], limit = 6): Bank[] {
  if (!/^\d{10}$/.test(accountNumber) || banks.length === 0) return [];

  let predicted: { code: string; name: string }[];
  try {
    predicted = getPredictedBanks(accountNumber);
  } catch {
    return [];
  }

  const out: Bank[] = [];
  for (const p of predicted) {
    const match =
      banks.find((b) => b.code === p.code) ??
      banks.find((b) => firstWord(b.name) === firstWord(p.name));
    if (match && !out.some((b) => b.code === match.code)) out.push(match);
    if (out.length >= limit) break;
  }
  return out;
}
