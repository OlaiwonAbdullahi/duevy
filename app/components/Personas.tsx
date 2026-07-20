import { CheckIcon } from "./icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserGroup03Icon,
  StudentIcon,
  UniversityIcon,
  CheckmarkBadge01Icon,
} from "@hugeicons/core-free-icons";

const personas = [
  {
    icon: UserGroup03Icon,
    role: "The class rep",
    name: "Tunde, 300L",
    meta: "Class rep · 120 classmates",
    challenge:
      "Collects ₦2,000 dues from 120 classmates every semester. Spends weeks chasing payments on WhatsApp, tracking who paid in a notebook.",
    gives: [
      "One link students pay through",
      "A live list of who's paid",
      "Automatic receipts — zero notebook",
    ],
  },
  {
    icon: StudentIcon,
    role: "The student",
    name: "Aisha, 200L",
    meta: "Student · Pays across the year",
    challenge:
      "Pays dues, departmental levies, and event fees across the year. Never sure if her money reached the right place.",
    gives: [
      "A card she saves once",
      "Instant payment confirmation",
      "A clear view of what every naira funded",
    ],
  },
  {
    icon: UniversityIcon,
    role: "The department",
    name: "Faculty exec.",
    meta: "Association · Multiple levels",
    challenge:
      "Runs money across multiple levels and hundreds of students. No unified record for handover to the next set of execs.",
    gives: [
      "One dashboard for all levels",
      "Verified identities via matric number",
      "A clean audit trail for handover",
    ],
  },
];

export default function Personas() {
  return (
    <section className="bg-[#fbfaf7] px-6 md:px-12 py-24">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-2xl mb-16">
          <span className="inline-flex items-center bg-[#e6f2ec] text-[#0b6e4f] text-[13px] font-medium rounded-full px-3 py-1 mb-6">
            Who it&apos;s for
          </span>
          <h2 className="text-[#1b2520] font-semibold tracking-tight text-3xl md:text-4xl leading-tight">
            Made for the people who run campus money.
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {personas.map((p) => {
            const Icon = p.icon;
            return (
              <div
                key={p.role}
                className="bg-[#fbfaf7] rounded-3xl border border-[#e6f2ec] p-8 flex flex-col"
              >
                {/* Icon (left) + role label (right) */}
                <div className="flex items-center justify-between mb-6">
                  <span className="w-11 h-11 rounded-full bg-[#e6f2ec] text-[#0b6e4f] grid place-items-center">
                    <HugeiconsIcon
                      icon={Icon}
                      size={20}
                      className="text-[#0b6e4f]"
                    />
                  </span>
                  <span className="text-[#7a847f] text-[13px] font-medium">
                    {p.role}
                  </span>
                </div>

                {/* Name + meta */}
                <h3 className="text-[#1b2520] font-semibold text-2xl tracking-tight">
                  {p.name}
                </h3>
                <p className="text-[#7a847f] text-sm mt-1 mb-6">{p.meta}</p>

                {/* Challenge */}
                <p className="text-[#1b2520] text-base leading-relaxed">
                  {p.challenge}
                </p>

                {/* Divider */}
                <div className="border-t border-[#e6f2ec] my-6" />

                {/* What Duevy gives them */}
                <p className="text-[#0b6e4f] text-[13px] font-semibold mb-4">
                  What Duevy gives them
                </p>
                <ul className="flex flex-col gap-3 mt-auto">
                  {p.gives.map((g) => (
                    <li key={g} className="flex items-start gap-3">
                      <span className="w-5 h-5 shrink-0 mt-0.5 rounded-full bg-[#e6f2ec] text-[#0b6e4f] grid place-items-center">
                        <HugeiconsIcon
                          icon={CheckmarkBadge01Icon}
                          size={12}
                          className="text-[#0b6e4f]"
                        />
                      </span>
                      <span className="text-[#1b2520] text-[15px] leading-snug">
                        {g}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
