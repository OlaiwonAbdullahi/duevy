import { HugeiconsIcon } from "@hugeicons/react";
import {
  BankIcon,
  SecurityCheckIcon,
  Analytics01Icon,
  Invoice01Icon,
  Building03Icon,
  ShoppingBasket01Icon,
  Key01Icon,
} from "@hugeicons/core-free-icons";

const features = [
  {
    icon: BankIcon,
    title: "Pay by bank transfer",
    body: "Pay straight from any Nigerian bank app — settles in seconds, no float sitting anywhere.",
  },
  {
    icon: SecurityCheckIcon,
    title: "Verified withdrawals",
    body: "Only a verified lead rep can withdraw, and only to a bank account in their own name.",
  },
  {
    icon: Analytics01Icon,
    title: "Live payment tracking",
    body: "See who has paid, who hasn't, and send reminders in one tap.",
  },
  {
    icon: Invoice01Icon,
    title: "Automatic receipts",
    body: "Every payment generates proof for both student and rep.",
  },
  {
    icon: ShoppingBasket01Icon,
    title: "Pay several dues at once",
    body: "Students tick the dues they owe and clear them all in one bank transfer.",
  },
  {
    icon: Key01Icon,
    title: "Join with a code",
    body: "Every department gets its own join code. Share it in the class group and students are in.",
  },

  {
    icon: Building03Icon,
    title: "Multi-school ready",
    body: "Built to run across departments, faculties, and campuses.",
  },
];

export default function Features() {
  return (
    <section className="bg-[#e6f2ec] px-6 md:px-12 py-24">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-2xl mb-16">
          <span className="inline-flex items-center bg-[#fbfaf7] text-[#0b6e4f] text-[13px] font-medium rounded-full px-3 py-1 mb-6">
            Features
          </span>
          <h2 className="text-[#1b2520] font-semibold tracking-tight text-3xl md:text-4xl leading-tight">
            The whole platform, in plain words.
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="bg-[#fbfaf7] rounded-3xl border border-[#e6f2ec] p-6 flex flex-col"
            >
              <span className="w-12 h-12 rounded-full bg-[#e6f2ec] text-[#0b6e4f] grid place-items-center mb-6">
                <HugeiconsIcon
                  icon={Icon}
                  size={22}
                  className="text-[#0b6e4f]"
                />
              </span>
              <h3 className="text-[#1b2520] font-semibold text-lg mb-3">
                {title}
              </h3>
              <p className="text-[#7a847f] text-base leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
