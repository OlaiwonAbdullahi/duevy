import { HugeiconsIcon } from "@hugeicons/react";
import {
  PercentIcon,
  CheckmarkBadge01Icon,
  EyeIcon,
  Wallet01Icon,
} from "@hugeicons/core-free-icons";

const included = [
  {
    icon: Wallet01Icon,
    title: "No monthly fees",
    body: "You never pay to set up a department, invite students, or keep the platform running. Duevy only earns when money actually moves.",
  },
  {
    icon: CheckmarkBadge01Icon,
    title: "No hidden charges",
    body: "The 3% is the whole story — no setup fees, no withdrawal fees, no surprise deductions when it's time to pay out.",
  },
  {
    icon: EyeIcon,
    title: "Shown before you pay",
    body: "The exact fee is displayed on every transaction, so students and reps always see what's being charged before confirming.",
  },
];

export default function Pricing() {
  return (
    <section id="pricing-fee" className="bg-[#fbfaf7] px-6 md:px-12 py-24">
      <div className="max-w-[1280px] mx-auto">
        {/* Header */}
        <div className="max-w-2xl mb-16">
          <span className="inline-flex items-center bg-[#e6f2ec] text-[#0b6e4f] text-[13px] font-medium rounded-full px-3 py-1 mb-6">
            Pricing
          </span>
          <h2 className="text-[#1b2520] font-semibold tracking-tight text-3xl md:text-4xl leading-tight mb-4">
            One flat fee. Nothing hidden.
          </h2>
          <p className="text-[#7a847f] text-base md:text-lg leading-relaxed">
            Duevy charges a simple 3% on every transaction — and that&apos;s it.
            No signup cost, no monthly subscription, no fee to withdraw. You only
            ever pay when a payment actually goes through, so it scales with what
            you collect instead of billing you for sitting still.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Headline fee card */}
          <div className="lg:col-span-2 bg-[#0b6e4f] rounded-[32px] p-8 md:p-12 flex flex-col justify-between overflow-hidden relative">
            {/* soft decorative rings */}
            <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full border border-white/15" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full border border-white/15" />

            <div className="relative">
              <span className="w-12 h-12 rounded-full bg-white/15 text-white grid place-items-center mb-8">
                <HugeiconsIcon icon={PercentIcon} size={22} />
              </span>
              <div className="flex items-start gap-1 mb-3">
                <span className="text-white font-semibold tracking-tight text-6xl md:text-7xl leading-none">
                  3
                </span>
                <span className="text-white/80 font-semibold text-3xl md:text-4xl leading-none mt-1">
                  %
                </span>
              </div>
              <p className="text-white/80 text-lg font-medium">
                on every transaction
              </p>
            </div>

            <p className="relative text-white/70 text-sm leading-relaxed mt-8 max-w-xs">
              That single percentage covers everything — collecting, tracking,
              receipts, and approved payouts. If no money moves, you owe
              nothing.
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
        <div className="mt-6 bg-[#e6f2ec] rounded-3xl p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
          <div className="shrink-0">
            <span className="text-[#0b6e4f] text-xs font-semibold uppercase tracking-[0.14em]">
              For example
            </span>
            <p className="text-[#1b2520] font-semibold text-lg mt-1">
              A ₦2,000 due
            </p>
          </div>
          <p className="text-[#1b2520]/80 text-base leading-relaxed">
            On a ₦2,000 payment, the fee is just{" "}
            <span className="font-semibold text-[#0b6e4f]">₦60</span> — the
            department receives the rest in full. No matter how small or large
            the payment, the maths never changes: three naira out of every
            hundred, and the rest is yours.
          </p>
        </div>
      </div>
    </section>
  );
}
