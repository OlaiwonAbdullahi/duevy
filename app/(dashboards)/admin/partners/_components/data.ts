import type { AdminPartner, AdminPartnerInput, AdminPartnerRedemption } from "@/lib/api/admin";
import type { PartnerRedemptionSource } from "@/lib/api/types";
import type { StatusTone } from "../../_components/StatusBadge";

/** Form state — numbers stay strings so a blank field can mean "no limit". */
export type PartnerFormState = {
  name: string;
  short: string;
  code: string;
  logoUrl: string | null;
  discount: string;
  durationDays: string;
  maxRedemptions: string;
  /** yyyy-mm-dd (local), blank = never expires. */
  expiresOn: string;
  isActive: boolean;
};

export const EMPTY_PARTNER_FORM: PartnerFormState = {
  name: "",
  short: "",
  code: "",
  logoUrl: null,
  discount: "",
  durationDays: "",
  maxRedemptions: "",
  expiresOn: "",
  isActive: true,
};

export const CODE_PATTERN = /^[A-Z0-9-]{3,20}$/;

/** At or above this, the discounted fee can dip under what Bachs charges us per payout. */
export const SUBSIDY_WARNING_PERCENT = 50;

export const SOURCE_LABEL: Record<PartnerRedemptionSource, string> = {
  signup: "Signup",
  settings: "Manage page",
  admin: "Admin",
};

/** Local yyyy-mm-dd for an ISO time, matching what DatePicker emits. */
function toLocalDate(iso: string) {
  const d = new Date(iso);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function formFromPartner(p: AdminPartner): PartnerFormState {
  return {
    name: p.name,
    short: p.short,
    code: p.code,
    logoUrl: p.logoUrl,
    discount: String(p.withdrawalFeeDiscountPercent),
    durationDays: p.durationDays == null ? "" : String(p.durationDays),
    maxRedemptions: p.maxRedemptions == null ? "" : String(p.maxRedemptions),
    expiresOn: p.expiresAt ? toLocalDate(p.expiresAt) : "",
    isActive: p.isActive,
  };
}

/** Blank → null; otherwise a positive whole number, or NaN to flag the field. */
function optionalCount(raw: string): number | null {
  const v = raw.trim();
  if (!v) return null;
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : NaN;
}

/** Validates the form and builds the API body, or returns the first problem. */
export function inputFromForm(
  form: PartnerFormState,
): { input: AdminPartnerInput } | { error: string } {
  const name = form.name.trim();
  const short = form.short.trim();
  if (!name || !short) return { error: "Name and short name are required." };
  if (!CODE_PATTERN.test(form.code)) {
    return { error: "Code must be 3–20 letters, numbers or dashes." };
  }
  const discount = Number(form.discount);
  if (!Number.isInteger(discount) || discount < 1 || discount > 100) {
    return { error: "Discount must be a whole number from 1 to 100." };
  }
  const durationDays = optionalCount(form.durationDays);
  if (Number.isNaN(durationDays)) return { error: "Duration must be a whole number of days, or blank." };
  const maxRedemptions = optionalCount(form.maxRedemptions);
  if (Number.isNaN(maxRedemptions)) return { error: "Max uses must be a whole number, or blank." };

  return {
    input: {
      name,
      short,
      code: form.code,
      logoUrl: form.logoUrl,
      withdrawalFeeDiscountPercent: discount,
      durationDays,
      maxRedemptions,
      // The code works through the whole of the chosen day.
      expiresAt: form.expiresOn ? new Date(`${form.expiresOn}T23:59:59`).toISOString() : null,
      isActive: form.isActive,
    },
  };
}

export function formatDuration(days: number | null) {
  return days == null ? "Permanent" : `${days} day${days === 1 ? "" : "s"}`;
}

export function redemptionStatus(r: AdminPartnerRedemption): { label: string; tone: StatusTone } {
  if (r.revokedAt) return { label: "Revoked", tone: "bad" };
  if (r.endsAt && new Date(r.endsAt).getTime() <= Date.now()) return { label: "Ended", tone: "neutral" };
  return { label: "Active", tone: "ok" };
}

export function signupLink(code: string) {
  return `${window.location.origin}/signup?partner=${encodeURIComponent(code)}`;
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
