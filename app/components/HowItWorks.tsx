import { BuildingIcon, WalletIcon, ReceiptIcon } from "./icons";

const steps = [
  {
    number: "01",
    icon: BuildingIcon,
    title: "Rep sets up department",
    description:
      "Course rep creates a department account, adds their team, and configures payment categories — dues, handouts, levies, and more.",
  },
  {
    number: "02",
    icon: WalletIcon,
    title: "Students fund their wallet",
    description:
      "Students create an account, fund their Duevy wallet once, and access every active payment in their department from one dashboard.",
  },
  {
    number: "03",
    icon: ReceiptIcon,
    title: "Pay once, done forever",
    description:
      "One tap to pay. Instant receipt. Automatic confirmation to the rep. No WhatsApp, no forms, no bank transfers.",
  },
];

export default function HowItWorks() {
  return (
    <section className="bg-[#f9fafb] px-6 md:px-12 py-20">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#10b981] mb-3">How it works</p>
          {/* display-lg */}
          <h2 className="text-[36px] md:text-[48px] font-bold leading-[1.2] text-[#030c0a]">
            From chaos to clarity —<br className="hidden md:block" /> in three steps.
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {steps.map(({ number, icon: Icon, title, description }) => (
            <div
              key={number}
              className="bg-white border border-[#e5e7eb] rounded-2xl p-6 hover:border-[#10b981]/40 transition-all"
            >
              <div className="flex items-start justify-between mb-5">
                <div className="w-10 h-10 bg-[#f0fdfa] border border-[#10b981]/20 rounded-xl flex items-center justify-center">
                  <Icon size={20} className="text-[#10b981]" />
                </div>
                <span className="text-3xl font-bold text-[#030c0a]/[0.06]">{number}</span>
              </div>
              {/* display-sm */}
              <h3 className="text-[20px] font-semibold leading-[1.3] text-[#030c0a] mb-2">{title}</h3>
              {/* body-md */}
              <p className="text-base font-normal leading-[1.6] text-[#374151]">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
