"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Building03Icon,
  Share08Icon,
  Wallet01Icon,
  CheckmarkBadge01Icon,
  Invoice01Icon,
} from "@hugeicons/core-free-icons";

const steps = [
  {
    number: "01",
    title: "Rep sets up their dept",
    body: "The class or departmental rep creates a space in minutes — names it (e.g. “200L CSC Department”), invites the team, and assigns roles. Everyone knows who can collect, who approves, and who just pays. No spreadsheets, no confusion over who’s holding the money.",
    Icon: Building03Icon,
    color: "#0b6e4f",
  },
  {
    number: "02",
    title: "Students get the link",
    body: "A single payment link is shared on WhatsApp or the class group chat — the places students already live. There’s no app to install and no account hoops to jump through. Anyone with the link can see what they owe and pay in seconds, right from their phone.",
    Icon: Share08Icon,
    color: "#1f5f7a",
  },
  {
    number: "03",
    title: "Students top up & pay",
    body: "Students fund their Duevy wallet, then pay dues, levies, or one-off charges in a couple of taps. Every payment lands instantly with a receipt they can keep, so there’s never a “did my money enter?” back-and-forth with the rep.",
    Icon: Wallet01Icon,
    color: "#b4562c",
  },
  {
    number: "04",
    title: "Payout needs approval",
    body: "Money doesn’t move on one person’s say-so. When the rep wants to spend, a quorum of students has to approve the payout first. It keeps collections honest, protects the rep from blame, and gives the whole class real say over shared funds.",
    Icon: CheckmarkBadge01Icon,
    color: "#5b4a86",
  },
  {
    number: "05",
    title: "Money moves, cleanly",
    body: "Once approved, funds release straight to the verified destination — no cash changing hands in the dark. A full, timestamped trail of every naira is kept automatically, ready for handover to the next set of reps or any audit down the line.",
    Icon: Invoice01Icon,
    color: "#1b2520",
  },
];

export default function HowItWorks() {
  const targetRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: targetRef });

  const x = useTransform(
    scrollYProgress,
    [0, 1],
    ["0vw", `-${(steps.length - 1) * 100}vw`],
  );

  return (
    <section
      id="how-it-works"
      ref={targetRef}
      className="relative bg-[#fbfaf7]"
      style={{ height: `${steps.length * 100}vh` }}
    >
      <div className="sticky top-0  overflow-hidden flex flex-col justify-center py-20 md:py-24">
        <div className="px-6 md:px-12 mb-10 shrink-0">
          <span className="inline-flex items-center bg-[#e6f2ec] text-[#0b6e4f] text-[13px] font-medium rounded-full px-3 py-1 mb-4">
            How it works
          </span>
          <h2 className="text-[#1b2520] font-semibold tracking-tight text-2xl md:text-4xl leading-tight">
            One simple flow, from set-up to settled.
          </h2>
        </div>
        <motion.div style={{ x }} className="flex">
          {steps.map((step) => (
            <div key={step.number} className="w-screen shrink-0 px-6 md:px-12">
              <div className="max-w-295 mx-auto">
                <div
                  className="grid grid-cols-1 md:grid-cols-2 gap-0 rounded-[2rem] overflow-hidden min-h-95 md:min-h-140"
                  style={{ backgroundColor: step.color }}
                >
                  <div className="order-2 md:order-1 flex flex-col justify-center p-8 md:p-12 lg:p-14">
                    <div className="flex items-center gap-3 mb-6">
                      <span className="w-11 h-11 rounded-2xl bg-white/15 text-white grid place-items-center shrink-0">
                        <HugeiconsIcon icon={step.Icon} size={22} />
                      </span>
                      <span className="text-white/70 text-xs font-semibold uppercase tracking-[0.14em]">
                        Step {step.number} / 05
                      </span>
                    </div>

                    <h3 className="text-white font-semibold tracking-tight text-2xl md:text-[2.5rem] leading-[1.15] md:leading-[1.1] mb-4">
                      {step.title}
                    </h3>
                    <p className="text-white/70 text-base md:text-lg leading-relaxed max-w-md">
                      {step.body}
                    </p>
                  </div>

                  <div className="hidden md:grid order-1 md:order-2 relative min-h-70 md:min-h-0 bg-white/5 p-8 md:p-12 place-items-center overflow-hidden">
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

                    <div className="relative w-full max-w-75 rounded-3xl bg-white shadow-[0_24px_60px_-30px_rgba(11,110,79,0.5)] border border-white/60 p-6">
                      <div className="flex items-center justify-between mb-6">
                        <span className="w-14 h-14 rounded-2xl bg-[#0b6e4f] text-white grid place-items-center">
                          <HugeiconsIcon icon={step.Icon} size={28} />
                        </span>
                        <span className="text-[#0b6e4f]/30 font-semibold text-4xl leading-none tracking-tight">
                          {step.number}
                        </span>
                      </div>
                      <div className="h-2.5 rounded-full bg-[#e6f2ec] w-3/4 mb-3" />
                      <div className="h-2.5 rounded-full bg-[#eef2f0] w-1/2" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
