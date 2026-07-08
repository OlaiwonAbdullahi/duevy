import { HugeiconsIcon } from "@hugeicons/react";
import { MoneySend01Icon, Wallet01Icon } from "@hugeicons/core-free-icons";
import { naira } from "./data";

/**
 * Hero card for the payout page — mirrors the wallet BalanceCard treatment so
 * the two money surfaces feel like one family. Shows what can be withdrawn now,
 * with the collected total and pending clearance as context chips.
 */
export function PayoutBalanceCard({
  available,
  collected,
  pending,
  onWithdraw,
}: {
  available: number;
  collected: number;
  pending: number;
  onWithdraw: () => void;
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-brand p-6 sm:p-8">
      {/* Dotted texture, fading in from the top-right corner */}
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.18) 1px, transparent 1.5px)",
          backgroundSize: "18px 18px",
          maskImage:
            "radial-gradient(130% 130% at 100% 0%, #000 0%, transparent 55%)",
          WebkitMaskImage:
            "radial-gradient(130% 130% at 100% 0%, #000 0%, transparent 55%)",
        }}
      />
      <div className="pointer-events-none absolute right-0 top-0 -translate-y-1/4 translate-x-1/4">
        <div className="relative h-72 w-72">
          <span className="absolute inset-0 rounded-[3.25rem] border border-white/15" />
          <span className="absolute inset-8 rounded-[2.5rem] border border-white/10" />
          <span className="absolute inset-16 rounded-[1.75rem] border border-white/[0.07]" />
          <span className="absolute inset-16 rounded-l-[1.75rem] rounded-r-[6rem] border-r border-white/10" />
        </div>
      </div>
      <div className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-[4rem] border border-white/10" />

      <div className="relative flex items-center gap-2 text-white/80">
        <HugeiconsIcon icon={Wallet01Icon} size={16} />
        <span className="text-xs font-medium">Available to withdraw</span>
      </div>
      <p className="relative mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
        {naira(available)}
      </p>

      <div className="relative mt-6 flex flex-wrap gap-3">
        <Chip label="Total collected" value={naira(collected)} />
        <Chip label="Pending clearance" value={naira(pending)} />
      </div>

      <div className="relative mt-8">
        <button
          type="button"
          onClick={onWithdraw}
          disabled={available <= 0}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-7 text-sm font-semibold text-brand transition-colors duration-300 hover:bg-cloud disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        >
          <HugeiconsIcon icon={MoneySend01Icon} size={16} />
          Withdraw funds
        </button>
      </div>
    </div>
  );
}

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/12 px-4 py-2.5">
      <p className="text-[11px] font-medium text-white/70">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}
