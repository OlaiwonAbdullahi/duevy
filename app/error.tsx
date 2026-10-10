"use client";

import { useEffect } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { AlertCircleIcon, RefreshIcon } from "@hugeicons/core-free-icons";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface the error to the console (swap for your logging service later).
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-canvas px-6 py-16 text-center">
      <Link
        href="/"
        className="absolute left-6 top-6 text-xl tracking-tight text-ink cursor-pointer sm:left-10 sm:top-8"
      >
        Duevy.
      </Link>

      <div className="grid h-16 w-16 place-items-center rounded-full bg-cloud text-brand">
        <HugeiconsIcon icon={AlertCircleIcon} size={30} />
      </div>

      <p className="mt-8 text-[13px] font-semibold uppercase tracking-wide text-ink-soft">
        Something went wrong
      </p>
      <h1 className="mt-3 max-w-xl text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
        This page hit a snag
      </h1>
      <p className="mt-4 max-w-md text-[15px] leading-relaxed text-ink-soft">
        No money moved and your data is safe. Try again — if it keeps happening,
        give it a moment and come back.
      </p>

      {error.digest && (
        <p className="mt-4 rounded-full bg-paper px-4 py-1.5 font-mono text-[12px] text-ink-soft">
          Ref: {error.digest}
        </p>
      )}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button
          onClick={reset}
          className="group inline-flex h-[52px] items-center justify-center gap-2 rounded-full bg-brand px-7 text-base font-semibold text-white transition-colors duration-300 hover:bg-brand-bright cursor-pointer"
        >
          <HugeiconsIcon
            icon={RefreshIcon}
            size={16}
            className="transition-transform duration-500 group-hover:rotate-180"
          />
          Try again
        </button>
        <Link
          href="/"
          className="inline-flex h-[52px] items-center justify-center rounded-full bg-paper px-7 text-base font-semibold text-ink transition-colors duration-300 hover:bg-cloud cursor-pointer"
        >
          Back to home
        </Link>
      </div>
    </main>
  );
}
