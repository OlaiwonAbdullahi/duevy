"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Alert01Icon,
  BankIcon,
  MoneySend01Icon,
} from "@hugeicons/core-free-icons";
import { Modal } from "../../wallet/_components/Modal";
import { BARE_INPUT } from "../../wallet/_components/utils";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { accountLabel, naira } from "./data";
import type { BankAccount } from "./types";

export function WithdrawModal({
  available,
  account,
  onClose,
  onConfirm,
}: {
  available: number;
  account: BankAccount;
  onClose: () => void;
  onConfirm: (amount: number) => void;
}) {
  const [amount, setAmount] = useState("");
  const parsed = Number(amount.replace(/[^0-9]/g, ""));
  const tooMuch = parsed > available;
  const valid = parsed > 0 && !tooMuch;

  return (
    <Modal title="Withdraw funds" icon={MoneySend01Icon} onClose={onClose}>
      <div className="rounded-2xl border border-cloud bg-paper p-4">
        <p className="text-[11px] font-medium text-ink-soft">
          Available to withdraw
        </p>
        <p className="mt-1 text-2xl font-semibold tracking-tight text-ink">
          {naira(available)}
        </p>
      </div>

      <div className="mt-4">
        <label className="block text-xs font-medium text-ink-soft">Amount</label>
        <div className="mt-1.5 flex items-center rounded-2xl border border-cloud bg-canvas px-4 focus-within:border-brand">
          <span className="text-sm font-semibold text-ink-soft">₦</span>
          <Input
            inputMode="numeric"
            value={amount}
            onChange={(e) =>
              setAmount(e.target.value.replace(/[^0-9]/g, ""))
            }
            placeholder="0"
            className={cn(BARE_INPUT, "flex-1")}
          />
          <button
            type="button"
            onClick={() => setAmount(String(available))}
            className="shrink-0 rounded-full bg-cloud px-3 py-1 text-[11px] font-semibold text-brand transition-colors hover:bg-brand hover:text-white cursor-pointer"
          >
            Max
          </button>
        </div>
        {tooMuch && (
          <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-rose-600">
            <HugeiconsIcon icon={Alert01Icon} size={13} />
            Amount is more than your available balance.
          </p>
        )}
      </div>

      <div className="mt-4 flex items-center gap-3 rounded-2xl border border-cloud bg-paper p-4">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-cloud text-brand">
          <HugeiconsIcon icon={BankIcon} size={18} />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink">
            {account.accountName}
          </p>
          <p className="truncate text-xs text-ink-soft">
            {accountLabel(account)}
          </p>
        </div>
      </div>

      <p className="mt-3 text-xs leading-5 text-ink-soft">
        Payouts are reviewed and typically settle to your bank within 24 hours.
        You&apos;ll get a notification once it clears.
      </p>

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
          onClick={() => valid && onConfirm(parsed)}
          className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-brand text-sm font-semibold text-white transition-colors duration-300 hover:bg-brand-bright disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        >
          <HugeiconsIcon icon={MoneySend01Icon} size={16} />
          Withdraw
        </button>
      </div>
    </Modal>
  );
}
