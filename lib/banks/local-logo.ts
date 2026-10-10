import { BANK_LOGO_BY_CODE, BANK_LOGO_BY_NAME } from "./logo-files";
import { BANK_LOGO_ALIASES, normaliseBankName } from "./normalise";

export { normaliseBankName };

/**
 * `/banks/<file>.png` for a bank we host a logo for, else `null`. The bank
 * code first (exact, so "FCMB Plc" 214 can't pick up "FCMB MFB"), then the
 * normalised name, then the aliases. No looser matching: names share words
 * ("First Bank" / "First City Monument"), and a wrong logo is worse than the
 * initials fallback.
 */
export function localBankLogo(name: string, code?: string): string | null {
  const n = normaliseBankName(name);
  const file =
    (code ? BANK_LOGO_BY_CODE[code.trim()] : undefined) ??
    (n ? BANK_LOGO_BY_NAME[n] : undefined) ??
    (n ? BANK_LOGO_ALIASES.find(([fragment]) => n.includes(fragment))?.[1] : undefined);
  return file ? `/banks/${file}.png` : null;
}
