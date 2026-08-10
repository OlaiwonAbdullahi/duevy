"use client";

import { useEffect, useMemo, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  BankIcon,
  CheckmarkCircle02Icon,
  Alert01Icon,
} from "@hugeicons/core-free-icons";
import { Modal } from "../../_components/Modal";
import { BRAND_INPUT } from "../../_components/form-styles";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { listBanks, lookupPayoutAccount, type Bank } from "@/lib/api/payouts";
import { ApiError } from "@/lib/api/errors";
import { BankCombobox } from "./BankCombobox";
import type { BankAccount } from "./types";

export type AccountEdit = {
  bankCode: string;
  bankName: string;
  accountNumber: string;
};

export function EditAccountModal({
  spaceId,
  account,
  onClose,
  onSave,
}: {
  spaceId: string;
  account: BankAccount;
  onClose: () => void;
  onSave: (next: AccountEdit) => Promise<void>;
}) {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [banksLoading, setBanksLoading] = useState(true);
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState(account.accountNumber);
  const [saving, setSaving] = useState(false);

  // Name-enquiry state — the resolved holder name the rep confirms before saving.
  const [resolvedName, setResolvedName] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);

  // Live bank list (name + CBN code), scoped to this space's own Bachs
  // connected account. Preselect the current bank by name.
  useEffect(() => {
    let cancelled = false;
    setBanksLoading(true);
    listBanks(spaceId)
      .then((list) => {
        if (cancelled) return;
        setBanks(list);
        const current = list.find((b) => b.name === account.bankName);
        if (current) setBankCode(current.code);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setBanksLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [spaceId, account.bankName]);

  const bankName = useMemo(
    () => banks.find((b) => b.code === bankCode)?.name ?? account.bankName,
    [banks, bankCode, account.bankName],
  );

  const inputsReady = bankCode !== "" && /^\d{10}$/.test(accountNumber);

  // Name-enquiry (POST …/payout/account/lookup) — resolves without saving so the
  // rep can confirm the name. Fires immediately once a bank + full 10-digit
  // number are entered (inputsReady only flips true on the last digit), and
  // re-runs if either changes.
  useEffect(() => {
    setResolvedName(null);
    setResolveError(null);
    if (!spaceId || !inputsReady) {
      // Diagnostic: shows which precondition blocked the name-enquiry.
      console.warn("[payout lookup skipped]", {
        spaceId,
        bankCode,
        accountNumberLength: accountNumber.length,
        inputsReady,
      });
      return;
    }

    let cancelled = false;
    setResolving(true);
    (async () => {
      try {
        const { accountName } = await lookupPayoutAccount(spaceId, {
          bankCode,
          accountNumber,
        });
        if (!cancelled) setResolvedName(accountName);
      } catch (err) {
        if (!cancelled) {
          setResolveError(
            err instanceof ApiError && err.code === "ACCOUNT_UNVERIFIABLE"
              ? "We couldn't verify this account. Check the bank and number."
              : "Couldn't verify the account. Please try again.",
          );
        }
      } finally {
        if (!cancelled) setResolving(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [spaceId, bankCode, accountNumber, inputsReady]);

  const canSave = inputsReady && resolvedName !== null;

  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await onSave({ bankCode, bankName, accountNumber });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Edit payout account" icon={BankIcon} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <div>
          <label className="block text-xs font-medium text-ink-soft">Bank</label>
          <BankCombobox
            banks={banks}
            value={bankCode}
            onChange={setBankCode}
            loading={banksLoading}
          />
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
            10-digit account number — we&apos;ll look up the account name to confirm.
          </p>
        </div>

        {/* Name-enquiry confirmation */}
        {resolving && (
          <div className="flex items-center gap-2 rounded-2xl border border-cloud bg-paper px-4 py-3 text-sm text-ink-soft">
            <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-cloud border-t-brand" />
            Checking account…
          </div>
        )}
        {!resolving && resolvedName && (
          <div className="flex items-start gap-2.5 rounded-2xl border border-brand/30 bg-cloud/40 px-4 py-3">
            <HugeiconsIcon
              icon={CheckmarkCircle02Icon}
              size={18}
              className="mt-0.5 shrink-0 text-brand"
            />
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-ink-soft">Account name</p>
              <p className="truncate text-sm font-semibold text-ink">{resolvedName}</p>
              <p className="mt-0.5 text-[11px] text-ink-soft">
                Confirm this is correct before saving.
              </p>
            </div>
          </div>
        )}
        {!resolving && resolveError && (
          <div className="flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
            <HugeiconsIcon icon={Alert01Icon} size={18} className="mt-0.5 shrink-0" />
            <p>{resolveError}</p>
          </div>
        )}
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
          disabled={!canSave || saving}
          onClick={save}
          className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-brand text-sm font-semibold text-white transition-colors duration-300 hover:bg-brand-bright disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        >
          {saving && (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          )}
          {saving ? "Saving…" : "Save account"}
        </button>
      </div>
    </Modal>
  );
}
