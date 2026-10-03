import { HugeiconsIcon } from "@hugeicons/react";
import {
  PercentIcon,
  EyeIcon,
  MoneyBag01Icon,
  BankIcon,
} from "@hugeicons/core-free-icons";

const included = [
  {
    icon: MoneyBag01Icon,
    title: "No setup or monthly fees",
    body: "You never pay to set up a department, invite students, or keep the platform running. Duevy only earns when money actually moves.",
  },
  {
    icon: BankIcon,
    title: "Flat withdrawal fee",
    body: "₦100 to withdraw under ₦50,000, and ₦200 for ₦50,000 or more — no percentage taken from your payout.",
  },
  {
    icon: EyeIcon,
    title: "Shown before you pay",
    body: "The exact fee is displayed on every transaction, so students and reps always see what's being charged before confirming.",
  },
];

const examples = [
  { due: "₦2,000", fee: "₦60" },
  { due: "₦10,000", fee: "₦220" },
  { due: "₦50,000", fee: "₦1,020" },
  { due: "₦100,000+", fee: "₦2,020" },
];

export default function Pricing() {
  return (
    <section id="pricing-fee" className="bg-[#fbfaf7] px-6 md:px-12 py-24">
      <div className="max-w-[1280px] mx-auto">
        <div className="max-w-2xl mb-16">
          <span className="inline-flex items-center bg-[#e6f2ec] text-[#0b6e4f] text-[13px] font-medium rounded-full px-3 py-1 mb-6">
            Pricing
          </span>
          <h2 className="text-[#1b2520] font-semibold tracking-tight text-3xl md:text-4xl leading-tight mb-4">
            Simple fees. Nothing hidden.
          </h2>
          <p className="text-[#7a847f] text-base md:text-lg leading-relaxed">
            Duevy charges 2% + ₦20 on every dues payment, capped at ₦2,020. No
            signup cost and no monthly subscription. You only ever pay when a
            payment actually goes through, so it scales with what you collect
            instead of billing you for sitting still.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Headline fee card */}
          <div className="lg:col-span-2 bg-[#0b6e4f] rounded-[32px] p-8 md:p-12 flex flex-col justify-between overflow-hidden relative">
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

            <div className="relative">
              <span className="w-12 h-12 rounded-full bg-white/15 text-white grid place-items-center mb-8">
                <HugeiconsIcon icon={PercentIcon} size={22} />
              </span>
              <div className="flex items-start gap-1 mb-3">
                <span className="text-white font-semibold tracking-tight text-6xl md:text-7xl leading-none">
                  2
                </span>
                <span className="text-white/80 font-semibold text-3xl md:text-4xl leading-none mt-1">
                  % + ₦20
                </span>
              </div>
              <p className="text-white/80 text-lg font-medium">
                per dues payment
              </p>
            </div>

            <p className="relative text-white/70 text-sm leading-relaxed mt-8 max-w-xs">
              Capped at ₦2,020, however big the payment. Covers collecting,
              tracking and receipts. If no money moves, you owe nothing.
            </p>
          </div>

          {/* What's included */}
          <div className="lg:col-span-3 grid sm:grid-cols-1 gap-6">
            {included.map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="bg-white rounded-3xl border border-[#e6f2ec] p-6 flex items-start gap-5"
              >
                <span className="w-12 h-12 rounded-full bg-[#e6f2ec] text-[#0b6e4f] grid place-items-center shrink-0">
                  <HugeiconsIcon icon={Icon} size={22} />
                </span>
                <div>
                  <h3 className="text-[#1b2520] font-semibold text-lg mb-2">
                    {title}
                  </h3>
                  <p className="text-[#7a847f] text-base leading-relaxed">
                    {body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Worked example */}
        <div className="mt-6 bg-[#e6f2ec] rounded-3xl p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-6 md:gap-8">
          <div className="shrink-0">
            <span className="text-[#0b6e4f] text-xs font-semibold uppercase tracking-[0.14em]">
              For example
            </span>
            <p className="text-[#1b2520] font-semibold text-lg mt-1">
              What a payment costs
            </p>
          </div>
          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1">
            {examples.map(({ due, fee }) => (
              <div key={due} className="bg-white/70 rounded-2xl px-4 py-3">
                <dt className="text-[#7a847f] text-sm">{due} due</dt>
                <dd className="text-[#0b6e4f] font-semibold text-lg">
                  {fee} fee
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
