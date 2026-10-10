import Link from "next/link";
import type { ReactNode } from "react";
import { CheckIcon, ShieldIcon } from "../components/icons";

const points = [
  "Collect dues and levies straight to a shared wallet",
  "Payouts only move after students approve them",
  "Every naira tracked with an automatic receipt trail",
];

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#fbfaf7] lg:grid lg:grid-cols-2">
      {/* Brand panel — desktop only */}
      <aside className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-[#0b6e4f] p-12 xl:p-16">
        {/* soft decorative rings */}
        <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full border border-white/15" />
        <div className="pointer-events-none absolute -bottom-32 -left-24 h-96 w-96 rounded-full border border-white/15" />

        <Link
          href="/"
          className="relative inline-flex items-center gap-2 text-white text-xl tracking-tight cursor-pointer w-fit"
        >
          Duevy.
        </Link>

        <div className="relative max-w-md">
          <h2 className="text-white font-semibold tracking-tight text-3xl xl:text-4xl leading-tight mb-8">
            Campus money, run the clean way.
          </h2>

          <ul className="flex flex-col gap-4">
            {points.map((point) => (
              <li key={point} className="flex items-start gap-3">
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/15 text-white">
                  <CheckIcon size={13} />
                </span>
                <span className="text-white/80 text-[15px] leading-relaxed">
                  {point}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative flex items-center gap-3 text-white/70">
          <ShieldIcon size={18} />
          <p className="text-[13px] leading-snug">
            Just 3% per transaction. No setup or monthly fees.
          </p>
        </div>
      </aside>

      {/* Form panel */}
      <main className="flex min-h-screen flex-col">
        {/* Mobile logo bar */}
        <div className="flex items-center justify-between px-6 pt-6 lg:hidden">
          <Link
            href="/"
            className="text-[#1b2520] text-xl tracking-tight cursor-pointer"
          >
            Duevy.
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center px-6 py-12 sm:px-10">
          <div className="w-full max-w-[400px]">{children}</div>
        </div>
      </main>
    </div>
  );
}
