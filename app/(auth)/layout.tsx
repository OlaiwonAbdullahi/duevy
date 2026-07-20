import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import { CheckIcon, ShieldIcon } from "../components/icons";

const points = [
  "Collect dues and levies by card or bank transfer",
  "Payouts only move after students approve them",
  "Every naira tracked with an automatic receipt trail",
];

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#fbfaf7] lg:grid lg:grid-cols-2">
      <aside className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-[#0b6e4f] p-12 xl:p-16">
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

        <Link
          href="/"
          className="relative inline-flex items-center gap-1 text-white text-xl tracking-tight cursor-pointer w-fit"
        >
          <Image
            src="/icons/logo2.svg"
            alt=""
            width={28}
            height={28}
            className="h-7 w-7 rounded-lg"
          />
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
            className="flex items-center gap-2 text-[#1b2520] text-xl tracking-tight cursor-pointer"
          >
            <Image
              src="/icons/logo2.svg"
              alt=""
              width={25}
              height={32}
              className="h-6 w-auto"
            />
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
