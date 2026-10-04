"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkCircle02Icon, Alert01Icon } from "@hugeicons/core-free-icons";
import { BRAND_INPUT } from "../../_components/form-styles";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { listBanks, lookupBeneficiary, type Bank } from "@/lib/api/payouts";
import { ApiError } from "@/lib/api/errors";
import { BankCombobox } from "./BankCombobox";

/** A bank account the rep has typed in and the bank has confirmed. */
export type VerifiedAccount = {
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
};

/**
 * Bank + account number entry with live name-enquiry. Reports the account to
 * `onChange` once the bank confirms its name, and `null` while it isn't.
 */
export function AccountFields({
  spaceId,
  onChange,
}: {
  spaceId: string;
  onChange: (account: VerifiedAccount | null) => void;
}) {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [banksLoading, setBanksLoading] = useState(true);
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");

  const [resolvedName, setResolvedName] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setBanksLoading(true);
    listBanks()
      .then((list) => {
        if (!cancelled) setBanks(list);
      })
      .catch(() => {
        if (!cancelled) toast.error("Couldn't load the bank list. Close this and try again.");
      })
      .finally(() => {
        if (!cancelled) setBanksLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [spaceId]);

  const bankName = useMemo(
    () => banks.find((b) => b.code === bankCode)?.name ?? "",
    [banks, bankCode],
  );

  const inputsReady = bankCode !== "" && /^\d{10}$/.test(accountNumber);

  // Name-enquiry (POST …/payout/beneficiaries/lookup) — resolves without saving.
  // Fires once a bank + full 10-digit number are entered, and re-runs if either changes.
  useEffect(() => {
    setResolvedName(null);
    setResolveError(null);
    if (!spaceId || !inputsReady) return;

    let cancelled = false;
    setResolving(true);
    (async () => {
      try {
        const { accountName } = await lookupBeneficiary(spaceId, { bankCode, accountNumber });
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

  useEffect(() => {
    onChange(
      inputsReady && resolvedName
        ? { bankCode, bankName, accountNumber, accountName: resolvedName }
        : null,
    );
    // onChange is the parent's setter; re-run only when the account changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputsReady, resolvedName, bankCode, bankName, accountNumber]);

  return (
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
          Any account: yours, a lecturer&apos;s or a vendor&apos;s. We&apos;ll look up the name to confirm.
        </p>
      </div>

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
              Make sure this is who you mean to pay. Money sent here can&apos;t be pulled back.
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
  );
}
