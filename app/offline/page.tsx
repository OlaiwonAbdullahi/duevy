import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "You're offline",
};

/** Shown by the service worker when a navigation fails with no cached copy. */
export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-5 bg-canvas px-6 text-center">
      <span className="grid h-16 w-16 place-items-center rounded-3xl bg-brand text-2xl font-semibold text-white">
        D
      </span>
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-ink">
          You&apos;re offline
        </h1>
        <p className="mt-2 max-w-sm text-sm text-ink-soft">
          Duevy can&apos;t reach the network right now. Check your connection —
          your cached pages still work, and we&apos;ll sync once you&apos;re back
          online.
        </p>
      </div>
      <Link
        href="/dashboard"
        className="inline-flex h-11 items-center justify-center rounded-full bg-brand px-6 text-sm font-semibold text-white transition-colors duration-300 hover:bg-brand-bright"
      >
        Try again
      </Link>
    </main>
  );
}
