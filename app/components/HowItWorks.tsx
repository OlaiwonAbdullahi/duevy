import { HugeiconsIcon } from "@hugeicons/react";
import {
  Building03Icon,
  Share08Icon,
  BankIcon,
  CheckmarkBadge01Icon,
  Invoice01Icon,
} from "@hugeicons/core-free-icons";

const steps = [
  {
    number: "01",
    title: "Rep creates the department",
    body: "The rep signs up, creates a space for their department (e.g. “Computer Science Student Association”) and adds the dues students need to pay.",
    Icon: Building03Icon,
    color: "#0b6e4f",
  },
  {
    number: "02",
    title: "Share the join code",
    body: "Every space gets its own join code, like CSSA-7F2K. The rep drops it in the class WhatsApp group, and students sign up and enter the code to join.",
    Icon: Share08Icon,
    color: "#1f5f7a",
  },
  {
    number: "03",
    title: "Pick dues, pay once",
    body: "Students see all their department’s dues in one place, select as many as they want, and clear them in a single bank transfer. A receipt lands for every payment.",
    Icon: BankIcon,
    color: "#b4562c",
  },
  {
    number: "04",
    title: "Verified reps withdraw",
    body: "Before a space can collect, the lead rep verifies their identity (NIN) and student ID. Withdrawals only go to a bank account in that rep’s own name.",
    Icon: CheckmarkBadge01Icon,
    color: "#5b4a86",
  },
  {
    number: "05",
    title: "Funds reach the department",
    body: "Every payment, withdrawal and fee is logged against the department, so there’s always a clear record of where the money went.",
    Icon: Invoice01Icon,
    color: "#1b2520",
  },
];

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="bg-[#fbfaf7] px-6 md:px-12 py-20 md:py-28"
    >
      <div className="max-w-295 mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-12 lg:gap-20">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <span className="inline-flex items-center bg-[#e6f2ec] text-[#0b6e4f] text-[13px] font-medium rounded-full px-3 py-1 mb-4">
            How it works
          </span>
          <h2 className="text-[#1b2520] font-semibold tracking-tight text-2xl md:text-4xl leading-tight mb-4">
            One simple flow, from set-up to settled.
          </h2>
          <p className="text-[#7a847f] text-base md:text-lg leading-relaxed max-w-md">
            Create a space, share the code, and let students clear their dues
            in one go.
          </p>
        </div>

        <ol className="relative">
          {steps.map((step, i) => (
            <li
              key={step.number}
              className="relative flex gap-5 md:gap-6 pb-10 last:pb-0"
            >
              {i < steps.length - 1 && (
                <span
                  aria-hidden="true"
                  className="absolute left-[22px] top-12 bottom-0 w-px bg-[#e3e1da]"
                />
              )}
              <span
                className="relative w-11 h-11 rounded-2xl text-white grid place-items-center shrink-0"
                style={{ backgroundColor: step.color }}
              >
                <HugeiconsIcon icon={step.Icon} size={22} />
              </span>
              <div className="pt-1">
                <span className="text-[#7a847f] text-xs font-semibold uppercase tracking-[0.14em]">
                  Step {step.number}
                </span>
                <h3 className="text-[#1b2520] font-semibold tracking-tight text-xl md:text-2xl leading-snug mt-1 mb-2">
                  {step.title}
                </h3>
                <p className="text-[#7a847f] text-base leading-relaxed">
                  {step.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
