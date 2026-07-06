"use client";

import { useState } from "react";
import { BankIcon } from "@hugeicons/core-free-icons";
import { Modal } from "../../_components/Modal";
import { BRAND_INPUT } from "../../_components/form-styles";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { BANK_OPTIONS } from "./data";
import type { BankAccount } from "./types";

export function EditAccountModal({
  account,
  onClose,
  onSave,
}: {
  account: BankAccount;
  onClose: () => void;
  onSave: (next: BankAccount) => void;
}) {
  const [bankName, setBankName] = useState(account.bankName);
  const [accountName, setAccountName] = useState(account.accountName);
  const [accountNumber, setAccountNumber] = useState(account.accountNumber);

  const valid =
    accountName.trim() !== "" && /^\d{10}$/.test(accountNumber);

  return (
    <Modal title="Edit payout account" icon={BankIcon} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <div>
          <label className="block text-xs font-medium text-ink-soft">Bank</label>
          <select
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            className="mt-1.5 h-11 w-full rounded-2xl border border-cloud bg-canvas px-4 text-sm text-ink outline-none focus:border-brand cursor-pointer"
          >
            {BANK_OPTIONS.map((bank) => (
              <option key={bank} value={bank}>
                {bank}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-ink-soft">
            Account number
          </label>
          <Input
            inputMode="numeric"
            maxLength={10}
            value={accountNumber}
            onChange={(e) =>
              setAccountNumber(e.target.value.replace(/[^0-9]/g, "").slice(0, 10))
            }
            placeholder="0123456789"
            className={cn(BRAND_INPUT, "mt-1.5 tabular-nums")}
          />
          <p className="mt-1 text-[11px] text-ink-soft">
            10-digit NUBAN account number.
          </p>
        </div>

        <div>
          <label className="block text-xs font-medium text-ink-soft">
            Account name
          </label>
          <Input
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            placeholder="CSSA Departmental Account"
            className={cn(BRAND_INPUT, "mt-1.5")}
          />
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={onClose}
          className="h-12 flex-1 rounded-full border border-cloud bg-canvas text-sm font-semibold text-ink transition-colors duration-300 hover:bg-paper cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={!valid}
          onClick={() =>
            valid && onSave({ bankName, accountName, accountNumber })
          }
          className="h-12 flex-1 rounded-full bg-brand text-sm font-semibold text-white transition-colors duration-300 hover:bg-brand-bright disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        >
          Save account
        </button>
      </div>
    </Modal>
  );
}
