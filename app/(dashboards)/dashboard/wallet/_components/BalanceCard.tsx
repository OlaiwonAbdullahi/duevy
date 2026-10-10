import { HugeiconsIcon } from "@hugeicons/react";
import {
  Wallet01Icon,
  MoneyAdd01Icon,
  MoneySend01Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { naira } from "./utils";

export function BalanceCard({
  balance,
  onTopUp,
}: {
  balance: number;
  onTopUp: () => void;
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

      {/* Concentric rings, top-right */}
      <div className="pointer-events-none absolute right-0 top-0 -translate-y-1/3 translate-x-1/3">
        <div className="relative h-72 w-72">
          <span className="absolute inset-0 rounded-full border border-white/15" />
          <span className="absolute inset-8 rounded-full border border-white/10" />
          <span className="absolute inset-16 rounded-full border border-white/[0.07]" />
        </div>
      </div>

      {/* Soft ring anchoring the bottom-left */}
      <div className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full border border-white/10" />

      <div className="relative flex items-center gap-2 text-white/80">
        <HugeiconsIcon icon={Wallet01Icon} size={16} />
        <span className="text-xs font-medium">Available balance</span>
      </div>
      <p className="relative mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
        {naira(balance)}
      </p>

      <div className="relative mt-8 flex flex-col gap-3 sm:flex-row">
        <Button
          onClick={onTopUp}
          className="h-12 rounded-full bg-white px-7 text-sm font-semibold text-brand hover:bg-cloud"
        >
          <HugeiconsIcon icon={MoneyAdd01Icon} size={16} />
          Top up
        </Button>
        <Button className="h-12 rounded-full bg-white/15 px-7 text-sm font-semibold text-white hover:bg-white/25">
          <HugeiconsIcon icon={MoneySend01Icon} size={16} />
          Withdraw
        </Button>
      </div>
    </div>
  );
}
