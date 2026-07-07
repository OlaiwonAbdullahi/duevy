import type { ReactNode } from "react";

export default function OverviewTabIcon({ children }: { children: ReactNode }) {
  return (
    <span
      aria-hidden="true"
      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-cloud bg-paper/40 text-lg"
    >
      {children}
    </span>
  );
}

