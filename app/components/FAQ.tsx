"use client";

import { useState } from "react";
import { MinusIcon, PlusIcon } from "./icons";

const faqs = [
  {
    q: "Do students need to download an app?",
    a: "No — but they have the option to add a shortcut to their phone's app list. Reps get a full dashboard.",
  },
  {
    q: "How is my money kept safe?",
    a: "Student funds sit in a separate, partitioned account from platform revenue, on Paystack's secure rails.",
  },
  {
    q: "Can a rep run away with the money?",
    a: "No. Payouts require quorum approval before any funds are released.",
  },
  {
    q: "How do you know a payer is a real student?",
    a: "Every account is verified by matric number through an admin approval queue.",
  },
  {
    q: "What does it cost?",
    a: "3% per transaction.",
  },
  {
    q: "Which schools can use it?",
    a: "Duevy is launching at LAUTECH and is built to expand to any Nigerian university.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="bg-[#fbfaf7] px-6 md:px-12 py-24">
      <div className="max-w-3xl mx-auto">
        <div className="mb-16">
          <span className="inline-flex items-center bg-[#e6f2ec] text-[#0b6e4f] text-[13px] font-medium rounded-full px-3 py-1 mb-6">
            FAQ
          </span>
          <h2 className="text-[#1b2520] font-semibold tracking-tight text-3xl md:text-4xl leading-tight">
            Questions, answered.
          </h2>
        </div>

        <div className="flex flex-col gap-3">
          {faqs.map((faq, i) => {
            const isOpen = open === i;
            return (
              <div
                key={faq.q}
                className="bg-[#f4f2ec] rounded-3xl border border-[#e6f2ec] overflow-hidden"
              >
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="w-full flex items-center justify-between gap-4 text-left px-6 py-5 cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <span className="text-[#1b2520] font-semibold text-base">{faq.q}</span>
                  <span className="w-8 h-8 shrink-0 rounded-full bg-[#fbfaf7] text-[#0b6e4f] grid place-items-center">
                    {isOpen ? <MinusIcon size={18} /> : <PlusIcon size={18} />}
                  </span>
                </button>
                {isOpen && (
                  <p className="text-[#7a847f] text-base leading-relaxed px-6 pb-6 -mt-1">
                    {faq.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
