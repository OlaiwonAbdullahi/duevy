import { HugeiconsIcon } from "@hugeicons/react";
import {
  BankIcon,
  PencilEdit02Icon,
  Add01Icon,
  CheckmarkCircle02Icon,
} from "@hugeicons/core-free-icons";
import { EmptyState } from "../../_components/EmptyState";
import { maskAccount } from "./data";
import type { BankAccount } from "./types";

export function PayoutAccountCard({
  account,
  hasAccount,
  onEdit,
}: {
  account: BankAccount;
  /** Whether a payout account has been set up yet. */
  hasAccount: boolean;
  onEdit: () => void;
}) {
  return (
    <section className="flex flex-col rounded-3xl border border-cloud bg-canvas p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-base font-semibold tracking-tight text-ink">
            Payout account
          </h2>
          <p className="mt-0.5 text-xs text-ink-soft">
            Cleared funds are settled here, usually within 24 hours.
          </p>
        </div>

        {hasAccount && (
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-full border border-cloud bg-paper px-4 text-xs font-semibold text-ink transition-colors duration-300 hover:bg-cloud cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
          >
            <HugeiconsIcon
              icon={PencilEdit02Icon}
              size={14}
              className="text-brand"
            />
            Edit
          </button>
        )}
      </div>

      {hasAccount ? (
        <div className="relative mt-5 flex-1 overflow-hidden rounded-2xl bg-[#101512] p-5 text-white">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(135deg, #fff 0px, #fff 1px, transparent 1px, transparent 7px)",
            }}
          />
          <div className="pointer-events-none absolute -bottom-8 -right-8 h-40 w-40">
            <div
              className="absolute inset-0 opacity-[0.08]"
              style={{
                backgroundColor: "#fff",
                WebkitMaskImage: "url(/icons/logo-mark.svg)",
                maskImage: "url(/icons/logo-mark.svg)",
                WebkitMaskSize: "contain",
                maskSize: "contain",
                WebkitMaskRepeat: "no-repeat",
                maskRepeat: "no-repeat",
                WebkitMaskPosition: "center",
                maskPosition: "center",
              }}
            />
            <div
              className="absolute inset-0 opacity-[0.14]"
              style={{
                backgroundColor: "#fff",
                WebkitMaskImage: "url(/icons/logo-mark-accent.svg)",
                maskImage: "url(/icons/logo-mark-accent.svg)",
                WebkitMaskSize: "contain",
                maskSize: "contain",
                WebkitMaskRepeat: "no-repeat",
                maskRepeat: "no-repeat",
                WebkitMaskPosition: "center",
                maskPosition: "center",
              }}
            />
            {/* Punches the D's inner counter back out to the card's own background,
                so it reads as a true hole instead of solid fill. */}
            <div
              className="absolute inset-0"
              style={{
                backgroundColor: "#101512",
                WebkitMaskImage: "url(/icons/logo-mark-hole.svg)",
                maskImage: "url(/icons/logo-mark-hole.svg)",
                WebkitMaskSize: "contain",
                maskSize: "contain",
                WebkitMaskRepeat: "no-repeat",
                maskRepeat: "no-repeat",
                WebkitMaskPosition: "center",
                maskPosition: "center",
              }}
            />
          </div>
          {/* Brand-tinted glow, ties the card to the space's colour theme */}
          <div
            className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-20 blur-2xl"
            style={{ backgroundColor: "var(--color-brand)" }}
          />
          <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10" />

          <div className="relative flex items-start justify-between">
            {/* EMV-style chip, segmented like a real contact pad */}
            <span className="grid h-8 w-10 grid-cols-3 grid-rows-2 overflow-hidden rounded-md bg-gradient-to-br from-amber-200 to-amber-400/80">
              <span className="border-r border-b border-amber-700/30" />
              <span className="border-r border-b border-amber-700/30" />
              <span className="border-b border-amber-700/30" />
              <span className="border-r border-amber-700/30" />
              <span className="border-r border-amber-700/30" />
              <span />
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-semibold text-white/80">
              <HugeiconsIcon icon={CheckmarkCircle02Icon} size={12} />
              Verified
            </span>
          </div>

          <p className="relative mt-6 text-lg font-semibold tracking-[0.12em] tabular-nums">
            {maskAccount(account.accountNumber)}
          </p>

          <div className="relative mt-5 flex items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-medium uppercase tracking-wide text-white/50">
                Account name
              </p>
              <p className="truncate text-sm font-semibold">
                {account.accountName}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-[10px] font-medium uppercase tracking-wide text-white/50">
                Bank
              </p>
              <p className="text-sm font-semibold">{account.bankName}</p>
            </div>
          </div>
        </div>
      ) : (
        <EmptyState
          className="mt-5 flex-1 rounded-2xl border border-dashed border-cloud bg-paper"
          icon={BankIcon}
          title="No payout account yet"
          description="Add a bank account so you can withdraw the funds your department has collected."
          action={
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-brand px-5 text-[13px] font-semibold text-white transition-colors duration-300 hover:bg-brand-bright cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
            >
              <HugeiconsIcon icon={Add01Icon} size={15} />
              Add account
            </button>
          }
        />
      )}
    </section>
  );
}
