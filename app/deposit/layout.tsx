import type { Metadata } from "next";
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";

/**
 * Test tool for `POST /dev/simulate-deposit`. Public (no sign-in). The endpoint
 * only exists on a sandbox API; anywhere else it 404s and the page says so.
 */
export const metadata: Metadata = {
  title: "Simulate deposit (sandbox)",
  robots: { index: false, follow: false },
};

export default function DepositLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen bg-canvas">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-gradient-to-b from-cloud/70 to-transparent" />
      <header className="relative mx-auto flex h-16 max-w-lg items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logos/duevy-mark.svg" alt="Duevy" width={24} height={24} style={{ width: "auto" }} className="h-6" />
          <span className="text-lg tracking-tight text-ink">Duevy.</span>
        </Link>
        <span className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-700">
          Sandbox
        </span>
      </header>
      <main className="relative mx-auto max-w-lg px-4 pb-10 pt-2 sm:px-5">{children}</main>
    </div>
  );
}
