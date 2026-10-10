import type React from "react";

const badgeClasses = {
  ok: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  warn: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  bad: "bg-rose-500/10 text-rose-700 border-rose-500/20",
  neutral: "bg-cloud text-ink-soft border-cloud",
} as const;

export type StatusTone = keyof typeof badgeClasses;

export default function StatusBadge({
  tone = "neutral",
  children,
}: {
  tone?: StatusTone;
  children: React.ReactNode;
}) {
  return (
    <span
      className={
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[12px] font-medium " +
        badgeClasses[tone]
      }
    >
      {children}
    </span>
  );
}
