"use client";

import { useEffect } from "react";
import { Manrope } from "next/font/google";
import { HugeiconsIcon } from "@hugeicons/react";
import { AlertDiamondIcon, RefreshIcon } from "@hugeicons/core-free-icons";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

// global-error replaces the whole root layout, so it must render <html>/<body>
// itself and re-establish the font. It only fires for errors thrown in the
// root layout — page-level errors are handled by app/error.tsx.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en" className={`h-full antialiased ${manrope.variable}`}>
      <body className="min-h-full">
        <main className="flex min-h-screen flex-col items-center justify-center bg-canvas px-6 py-16 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-cloud text-brand">
            <HugeiconsIcon icon={AlertDiamondIcon} size={30} />
          </div>

          <p className="mt-8 text-[13px] font-semibold uppercase tracking-wide text-ink-soft">
            Something went wrong
          </p>
          <h1 className="mt-3 max-w-xl text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Duevy ran into a problem
          </h1>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-ink-soft">
            We hit an unexpected error while loading the app. Please try again in
            a moment.
          </p>

          {error.digest && (
            <p className="mt-4 rounded-full bg-paper px-4 py-1.5 font-mono text-[12px] text-ink-soft">
              Ref: {error.digest}
            </p>
          )}

          <button
            onClick={reset}
            className="group mt-8 inline-flex h-[52px] items-center justify-center gap-2 rounded-full bg-brand px-7 text-base font-semibold text-white transition-colors duration-300 hover:bg-brand-bright cursor-pointer"
          >
            <HugeiconsIcon
              icon={RefreshIcon}
              size={16}
              className="transition-transform duration-500 group-hover:rotate-180"
            />
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
