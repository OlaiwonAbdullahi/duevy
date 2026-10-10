"use client";

import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion, type Variants } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CancelCircleIcon,
  CheckmarkBadge01Icon,
} from "@hugeicons/core-free-icons";

const listVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.05 },
  },
  exit: {
    opacity: 0,
    transition: { staggerChildren: 0.03, staggerDirection: -1 },
  },
};

const rowVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
  },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
};

const rows = [
  {
    old: "Dues collected in cash or scattered transfers",
    fixed: "Every payment flows through one wallet",
  },
  {
    old: "No receipts. No records to point to.",
    fixed: "Automatic receipts on every kobo",
  },
  {
    old: "“Where did our money go?” — no clean answer",
    fixed: "Students see exactly where the money went",
  },
  {
    old: "Reps get accused of eating the money",
    fixed: "Payouts need quorum approval to release",
  },
  {
    old: "Trust breaks down, every single semester",
    fixed: "Trust is built into the record by default",
  },
];

const views = {
  old: { label: "The old way", caption: "Before Duevy" },
  fixed: { label: "The Duevy way", caption: "With Duevy" },
} as const;

type ViewKey = keyof typeof views;

export default function Problem() {
  const [view, setView] = useState<ViewKey>("old");
  const [locked, setLocked] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const isOld = view === "old";

  // Auto-reveal "The Duevy way" when the section scrolls into view,
  // unless the visitor has taken control by clicking a tab.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || locked) return;

    let timer: ReturnType<typeof setTimeout>;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          timer = setTimeout(() => setView("fixed"), 1400);
        } else {
          clearTimeout(timer);
          // Only re-arm (show the problem again) when the section leaves via the
          // bottom — i.e. the user scrolled back UP toward the trust section.
          // Scrolling DOWN into the next section keeps "The Duevy way" showing.
          if (entry.boundingClientRect.top > 0) {
            setView("old");
          }
        }
      },
      { threshold: 0.55 },
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, [locked]);

  const handleSelect = (key: ViewKey) => {
    setLocked(true);
    setView(key);
  };

  return (
    <section ref={sectionRef} className="bg-[#fbfaf7] px-6 md:px-12 py-24">
      <div className="max-w-3xl mx-auto text-center mb-12">
        <span className="inline-flex items-center bg-[#e6f2ec] text-[#0b6e4f] text-[13px] font-medium rounded-full px-3 py-1 mb-6">
          Why Duevy
        </span>
        <h2 className="text-[#1b2520] font-semibold tracking-tight text-3xl md:text-4xl leading-tight mb-5">
          Every semester, the same story.
        </h2>
        <p className="text-[#7a847f] text-base md:text-lg leading-relaxed">
          A rep collects dues, students ask where their money went, and
          there&apos;s no clean answer. Duevy fixes the record — see the
          difference for yourself.
        </p>
      </div>

      {/* Segmented toggle */}
      <div className="max-w-3xl mx-auto flex justify-center mb-8">
        <div className="inline-flex items-center gap-1 bg-[#f4f2ec] rounded-full p-1">
          {(Object.keys(views) as ViewKey[]).map((key) => {
            const active = view === key;
            return (
              <button
                key={key}
                onClick={() => handleSelect(key)}
                aria-pressed={active}
                className={`text-sm font-semibold rounded-full px-5 h-10 transition-colors duration-300 cursor-pointer ${
                  active
                    ? key === "old"
                      ? "bg-[#fbfaf7] text-[#1b2520]"
                      : "bg-[#0b6e4f] text-white"
                    : "text-[#7a847f] hover:text-[#1b2520]"
                }`}
              >
                {views[key].label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Comparison card */}
      <div className="max-w-3xl mx-auto">
        <div className="bg-[#fbfaf7] rounded-[32px] border border-[#e6f2ec] overflow-hidden">
          <div
            className={`flex items-center justify-between px-6 md:px-8 py-5 border-b border-[#e6f2ec] transition-colors duration-500 ${
              isOld ? "bg-[#f4f2ec]" : "bg-[#e6f2ec]"
            }`}
          >
            <span className="text-[#1b2520] font-semibold text-lg">
              {views[view].label}
            </span>
            <span
              className={`text-[13px] font-medium rounded-full px-3 py-1 transition-colors duration-500 ${
                isOld
                  ? "bg-[#fbfaf7] text-[#7a847f]"
                  : "bg-[#0b6e4f] text-white"
              }`}
            >
              {views[view].caption}
            </span>
          </div>

          <div className="p-4 sm:p-6">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={view}
                variants={listVariants}
                initial="hidden"
                animate="show"
                exit="exit"
                className="flex flex-col gap-2"
              >
                {rows.map((row, i) => (
                  <motion.div
                    key={i}
                    variants={rowVariants}
                    className="group flex items-center gap-4 rounded-2xl px-4 py-4 transition-colors duration-300 hover:bg-[#f4f2ec]"
                  >
                    <span
                      className={`w-8 h-8 shrink-0 rounded-full grid place-items-center ${
                        isOld
                          ? "bg-[#f4f2ec] text-[#7a847f]"
                          : "bg-[#0b6e4f] text-white"
                      }`}
                    >
                      {isOld ? (
                        <HugeiconsIcon icon={CancelCircleIcon} size={14} />
                      ) : (
                        <HugeiconsIcon
                          icon={CheckmarkBadge01Icon}
                          size={16}
                          className="text-white"
                        />
                      )}
                    </span>
                    <p
                      className={`text-base leading-snug ${
                        isOld ? "text-[#7a847f]" : "text-[#1b2520] font-medium"
                      }`}
                    >
                      {isOld ? row.old : row.fixed}
                    </p>
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
