"use client";

import { useState } from "react";
import { UserAdd01Icon } from "@hugeicons/core-free-icons";
import { Modal } from "../../_components/Modal";
import { BRAND_INPUT } from "../../_components/form-styles";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { lookupBeneficiary } from "@/lib/api/payouts";
import { AccountFields, type VerifiedAccount } from "./AccountFields";

export type BeneficiaryDraft = {
  bankCode: string;
  bankName: string;
  accountNumber: string;
  label?: string;
};

export function AddBeneficiaryModal({
  spaceId,
  onClose,
  onSave,
}: {
  spaceId: string;
  onClose: () => void;
  onSave: (next: BeneficiaryDraft) => Promise<void>;
}) {
  const [account, setAccount] = useState<VerifiedAccount | null>(null);
  const [label, setLabel] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!account) return;
    setSaving(true);
    try {
      await onSave({
        bankCode: account.bankCode,
        bankName: account.bankName,
        accountNumber: account.accountNumber,
        label: label.trim() || undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Add beneficiary" icon={UserAdd01Icon} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <AccountFields
          lookup={(payload) => lookupBeneficiary(spaceId, payload)}
          onChange={setAccount}
        />

        <div>
          <label className="block text-xs font-medium text-ink-soft">
            Label <span className="font-normal">(optional)</span>
          </label>
          <Input
            value={label}
            maxLength={60}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Dr. Adeyemi (HOD)"
            className={cn(BRAND_INPUT, "mt-1.5")}
          />
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={saving}
          className="h-12 flex-1 rounded-full border border-cloud bg-canvas text-sm font-semibold text-ink transition-colors duration-300 hover:bg-paper disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={!account || saving}
          onClick={save}
          className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-brand text-sm font-semibold text-white transition-colors duration-300 hover:bg-brand-bright disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        >
          {saving && (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          )}
          {saving ? "Adding…" : "Add beneficiary"}
        </button>
      </div>
    </Modal>
  );
}
