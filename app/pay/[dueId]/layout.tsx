import type { Metadata } from "next";
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { SITE_NAME } from "@/lib/seo";

/** Pay links are shared privately (WhatsApp, class groups) — never in search. */
export const metadata: Metadata = {
  title: "Pay",
  description: `Pay your dues securely with ${SITE_NAME}. No account needed.`,
  robots: { index: false, follow: false },
};

export default async function GuestPayLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ dueId: string }>;
}) {
  // Signing in comes back here, so someone with an account pays as themselves.
  const { dueId } = await params;
  return (
    <div className="relative min-h-screen bg-canvas">
      {/* A soft brand wash behind the card. */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-gradient-to-b from-cloud to-transparent" />
      <header className="relative mx-auto flex h-16 max-w-lg items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logos/duevy-mark.svg" alt="Duevy" width={24} height={24} style={{ width: "auto" }} className="h-6" />
          <span className="text-lg tracking-tight text-ink">Duevy.</span>
        </Link>
        <Link
          href={`/login?next=${encodeURIComponent(`/pay/${dueId}`)}`}
          className="rounded-full border border-cloud bg-canvas/80 px-3.5 py-1.5 text-sm font-medium text-ink-soft transition-colors hover:border-brand/30 hover:text-brand"
        >
          Sign in
        </Link>
      </header>
      <main className="relative mx-auto max-w-lg px-4 pb-10 pt-2 sm:px-5">{children}</main>
      <footer className="relative pb-8 text-center text-[11px] text-ink-soft">
        Payments are processed securely · {SITE_NAME}
      </footer>
    </div>
  );
}
