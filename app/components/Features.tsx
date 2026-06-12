import { UsersIcon, WalletIcon, ShieldIcon, CheckIcon } from "./icons";

const repFeatures = [
  "Create unlimited payment types",
  "Real-time collection dashboard",
  "Team access management",
  "Export payment records",
];

const studentFeatures = [
  "Instant payment confirmation",
  "Full transaction history",
  "Digital receipts always accessible",
  "No bank transfer friction",
];

export default function Features() {
  return (
    <section className="bg-[#faf9f5] px-6 md:px-12 py-20">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#10b981] mb-3">Built for both sides</p>
          {/* display-md */}
          <h2 className="text-[36px] font-bold leading-[1.2] text-[#030c0a]">
            Powerful for reps. Simple for students.
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {/* Reps card */}
          <div className="bg-white border border-[#e5e7eb] rounded-2xl p-6 hover:border-[#10b981]/40 transition-all">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-[#f0fdfa] border border-[#10b981]/20 rounded-xl flex items-center justify-center">
                <UsersIcon size={20} className="text-[#10b981]" />
              </div>
              <span className="text-xs font-semibold tracking-[0.15em] uppercase text-[#374151]/60">For Course Reps</span>
            </div>
            {/* display-sm */}
            <h3 className="text-xl font-semibold leading-[1.3] text-[#030c0a] mb-3">Department control panel</h3>
            {/* body-md */}
            <p className="text-base leading-[1.6] text-[#374151] mb-5">
              Create your department, invite your team, set up payment categories, and track every naira collected — with full visibility across the board.
            </p>
            <ul className="space-y-2.5">
              {repFeatures.map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-sm text-[#374151]">
                  <CheckIcon size={13} className="text-[#10b981] shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Students card */}
          <div className="bg-white border border-[#e5e7eb] rounded-2xl p-6 hover:border-[#10b981]/40 transition-all">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-[#f0fdfa] border border-[#10b981]/20 rounded-xl flex items-center justify-center">
                <WalletIcon size={20} className="text-[#10b981]" />
              </div>
              <span className="text-xs font-semibold tracking-[0.15em] uppercase text-[#374151]/60">For Students</span>
            </div>
            <h3 className="text-xl font-semibold leading-[1.3] text-[#030c0a] mb-3">One wallet, all payments</h3>
            <p className="text-base leading-[1.6] text-[#374151] mb-5">
              Fund your Duevy wallet and access every active payment in your department — handouts, dues, levies — paid with a single tap, anytime.
            </p>
            <ul className="space-y-2.5">
              {studentFeatures.map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-sm text-[#374151]">
                  <CheckIcon size={13} className="text-[#10b981] shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Trust card — full width */}
          <div className="bg-white border border-[#e5e7eb] rounded-2xl p-6 md:col-span-2 flex flex-col md:flex-row md:items-center gap-8 hover:border-[#10b981]/40 transition-all">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-[#f0fdfa] border border-[#10b981]/20 rounded-xl flex items-center justify-center">
                  <ShieldIcon size={20} className="text-[#10b981]" />
                </div>
                <span className="text-xs font-semibold tracking-[0.15em] uppercase text-[#374151]/60">Trust & Security</span>
              </div>
              <h3 className="text-xl font-semibold leading-[1.3] text-[#030c0a] mb-3">Built on trust, not chaos</h3>
              <p className="text-base leading-[1.6] text-[#374151] max-w-lg">
                Every transaction is verified, recorded, and accessible to both student and rep. No disputed payments. No &quot;I didn&apos;t receive it.&quot; No lost receipts.
              </p>
            </div>
            <div className="bg-[#f0fdfa] border border-[#10b981]/20 rounded-2xl p-6 md:w-60 shrink-0">
              <div className="text-5xl font-bold text-[#10b981] mb-2">100%</div>
              <p className="text-sm text-[#374151] leading-normal">of payments logged with real-time receipt generation</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
