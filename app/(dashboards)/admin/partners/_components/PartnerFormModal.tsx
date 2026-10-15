"use client";

import { useState } from "react";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { Alert01Icon, DiscountTag01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BRAND_INPUT } from "../../../dashboard/_components/form-styles";
import { PhotoPicker } from "../../../dashboard/polls/_components/PhotoPicker";
import { DatePicker } from "../../../dashboard/create-dues/_components/DatePicker";
import { AdminModal } from "../../_components/AdminModal";
import { Switch } from "../../_components/Switch";
import { ApiError } from "@/lib/api/errors";
import {
  createAdminPartner,
  updateAdminPartner,
  uploadPartnerLogo,
  type AdminPartner,
} from "@/lib/api/admin";
import { normalizePartnerCode } from "@/lib/api/partners";
import {
  EMPTY_PARTNER_FORM,
  SUBSIDY_WARNING_PERCENT,
  formFromPartner,
  inputFromForm,
  type PartnerFormState,
} from "./data";

const LABEL = "mb-1.5 block text-xs font-semibold text-ink-soft";

/** Create (no `partner`) or edit a partner. Mounted only while open. */
export function PartnerFormModal({
  partner,
  onClose,
  onSaved,
}: {
  partner?: AdminPartner;
  onClose: () => void;
  onSaved: (saved: AdminPartner) => void;
}) {
  const [form, setForm] = useState<PartnerFormState>(() =>
    partner ? formFromPartner(partner) : EMPTY_PARTNER_FORM,
  );
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof PartnerFormState>(key: K, value: PartnerFormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const discount = Number(form.discount);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = inputFromForm(form);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    setSaving(true);
    try {
      const saved = partner
        ? await updateAdminPartner(partner.id, result.input)
        : await createAdminPartner(result.input);
      toast.success(partner ? "Partner updated." : `${saved.short} partner created.`);
      onSaved(saved);
    } catch (err) {
      toast.error(
        err instanceof ApiError
          ? err.code === "PARTNER_CODE_TAKEN"
            ? "Another partner already uses that code."
            : err.message
          : "Couldn't save this partner.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminModal
      icon={DiscountTag01Icon}
      title={partner ? `Edit ${partner.short}` : "New partner"}
      description="Reps who use this code get a discount on their withdrawal fees."
      onClose={onClose}
    >
      <form className="space-y-3" onSubmit={handleSubmit}>
        <div className="flex items-end gap-3">
          <div className="pb-0.5">
            <PhotoPicker
              imageUrl={form.logoUrl}
              label="partner logo"
              size={44}
              onUpload={async (file) => set("logoUrl", (await uploadPartnerLogo(file)).logoUrl)}
              onRemove={() => set("logoUrl", null)}
            />
          </div>
          <div className="flex-1">
            <label htmlFor="partner-name" className={LABEL}>
              Name
            </label>
            <Input
              id="partner-name"
              required
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Nigeria Association of Computing Students"
              className={BRAND_INPUT}
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="partner-short" className={LABEL}>
              Short name
            </label>
            <Input
              id="partner-short"
              required
              maxLength={12}
              value={form.short}
              onChange={(e) => set("short", e.target.value)}
              placeholder="e.g. NACOS"
              className={BRAND_INPUT}
            />
          </div>
          <div>
            <label htmlFor="partner-code" className={LABEL}>
              Code
            </label>
            <Input
              id="partner-code"
              required
              minLength={3}
              maxLength={20}
              value={form.code}
              onChange={(e) => set("code", normalizePartnerCode(e.target.value))}
              placeholder="e.g. NACOS"
              className={`${BRAND_INPUT} font-mono`}
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label htmlFor="partner-discount" className={LABEL}>
              Fee discount %
            </label>
            <Input
              id="partner-discount"
              required
              type="number"
              inputMode="numeric"
              min={1}
              max={100}
              step={1}
              value={form.discount}
              onChange={(e) => set("discount", e.target.value)}
              placeholder="e.g. 50"
              className={BRAND_INPUT}
            />
          </div>
          <div>
            <label htmlFor="partner-duration" className={LABEL}>
              Duration (days)
            </label>
            <Input
              id="partner-duration"
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              value={form.durationDays}
              onChange={(e) => set("durationDays", e.target.value)}
              placeholder="Permanent"
              className={BRAND_INPUT}
            />
          </div>
          <div>
            <label htmlFor="partner-max" className={LABEL}>
              Max uses
            </label>
            <Input
              id="partner-max"
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              value={form.maxRedemptions}
              onChange={(e) => set("maxRedemptions", e.target.value)}
              placeholder="Unlimited"
              className={BRAND_INPUT}
            />
          </div>
        </div>

        {discount >= SUBSIDY_WARNING_PERCENT && (
          <p className="flex items-start gap-2 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-3 py-2.5 text-xs text-amber-700">
            <HugeiconsIcon icon={Alert01Icon} size={14} className="mt-px shrink-0" />
            Duevy may subsidise Bachs payout costs at this level — the discounted fee can fall below
            what each payout costs us.
          </p>
        )}

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-soft">Code expires (optional)</span>
            {form.expiresOn && (
              <button
                type="button"
                onClick={() => set("expiresOn", "")}
                className="cursor-pointer text-xs font-medium text-brand hover:underline"
              >
                Clear
              </button>
            )}
          </div>
          <DatePicker
            value={form.expiresOn}
            onChange={(v) => set("expiresOn", v)}
            placeholder="Never expires"
          />
          <p className="mt-1.5 text-[11px] text-ink-soft">
            Only stops new redemptions — spaces that already applied it keep their discount.
          </p>
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-cloud px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-ink">Active</p>
            <p className="text-xs text-ink-soft">Inactive codes can&apos;t be redeemed.</p>
          </div>
          <Switch
            checked={form.isActive}
            onChange={(v) => set("isActive", v)}
            label="Partner code active"
          />
        </div>

        <Button type="submit" variant="brand" size="pill" className="w-full" disabled={saving}>
          {saving ? "Saving…" : partner ? "Save changes" : "Create partner"}
        </Button>
      </form>
    </AdminModal>
  );
}
