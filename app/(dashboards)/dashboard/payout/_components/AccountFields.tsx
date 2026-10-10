"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useBanks } from "@/lib/api/queries";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkCircle02Icon, Alert01Icon } from "@hugeicons/core-free-icons";
import { BRAND_INPUT } from "../../_components/form-styles";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { predictBanks } from "@/lib/banks/predict";
import {
  type Bank,
  type BeneficiaryInput,
  type ResolvedAccount,
} from "@/lib/api/payouts";
import { ApiError } from "@/lib/api/errors";
import { BankCombobox } from "./BankCombobox";
import { BankLogo } from "./BankLogo";

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
  lookup,
  onChange,
  hint = "Any account: yours, a lecturer's or a vendor's. We'll look up the name to confirm.",
  confirmNote = "Make sure this is who you mean to pay. Money sent here can't be pulled back.",
  disabled = false,
}: {
  /** Name-enquiry that resolves without saving. */
  lookup: (payload: BeneficiaryInput) => Promise<ResolvedAccount>;
  onChange: (account: VerifiedAccount | null) => void;
  hint?: string;
  confirmNote?: string;
  disabled?: boolean;
}) {
  // Kept in a ref so an inline `lookup` doesn't re-run the name-enquiry every render.
  const lookupRef = useRef(lookup);
  useEffect(() => {
    lookupRef.current = lookup;
  }, [lookup]);
  // Fetched once per session and shared by every form that picks a bank.
  const banksQuery = useBanks();
  const banks: Bank[] = useMemo(() => banksQuery.data ?? [], [banksQuery.data]);
  const banksLoading = banksQuery.isPending;
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");

  const [resolvedName, setResolvedName] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);

  useEffect(() => {
    if (banksQuery.isError) toast.error("Couldn't load the bank list. Close this and try again.");
  }, [banksQuery.isError]);

  const bankName = useMemo(
    () => banks.find((b) => b.code === bankCode)?.name ?? "",
    [banks, bankCode],
  );

  const inputsReady = bankCode !== "" && /^\d{10}$/.test(accountNumber);

  // Likely banks for the number typed so far — shown as one-tap picks above the full list.
  const suggestions = useMemo(() => predictBanks(accountNumber, banks), [accountNumber, banks]);

  // Name-enquiry via `lookup` — resolves without saving.
  // Fires once a bank + full 10-digit number are entered, and re-runs if either changes.
  useEffect(() => {
    setResolvedName(null);
    setResolveError(null);
    if (!inputsReady) return;

    let cancelled = false;
    setResolving(true);
    (async () => {
      try {
        const { accountName } = await lookupRef.current({ bankCode, accountNumber });
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
  }, [bankCode, accountNumber, inputsReady]);

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
          disabled={disabled}
          className={cn(BRAND_INPUT, "mt-1.5 tabular-nums")}
        />
        <p className="mt-1 text-[11px] text-ink-soft">{hint}</p>
      </div>

      <div>
        <label className="block text-xs font-medium text-ink-soft">Bank</label>
        {suggestions.length > 0 && (
          <div className="mt-1.5">
            <p className="text-[11px] text-ink-soft">Likely banks for this number</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {suggestions.map((bank) => {
                const selected = bank.code === bankCode;
                return (
                  <button
                    key={bank.code}
                    type="button"
                    onClick={() => setBankCode(bank.code)}
                    disabled={disabled}
                    aria-pressed={selected}
                    className={cn(
                      "flex max-w-full cursor-pointer items-center gap-1.5 rounded-full border py-1 pl-1 pr-3 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60",
                      selected
                        ? "border-brand bg-brand/5 text-brand"
                        : "border-cloud bg-canvas text-ink hover:border-brand/40",
                    )}
                  >
                    <BankLogo name={bank.name} code={bank.code} className="h-5 w-5 text-[7px]" />
                    <span className="truncate">{bank.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
        <BankCombobox
          banks={banks}
          value={bankCode}
          onChange={setBankCode}
          loading={banksLoading}
          disabled={disabled}
        />
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
            {bankName && (
              <p className="mt-1 flex items-center gap-1.5 text-[11px] text-ink-soft">
                <BankLogo name={bankName} code={bankCode} className="h-4 w-4 text-[6px]" />
                <span className="truncate">
                  {bankName} · {accountNumber}
                </span>
              </p>
            )}
            <p className="mt-0.5 text-[11px] text-ink-soft">{confirmNote}</p>
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
