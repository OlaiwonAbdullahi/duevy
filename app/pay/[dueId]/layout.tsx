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
    <div className="min-h-screen bg-canvas">
      <header className="mx-auto flex h-16 max-w-lg items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logos/duevy-mark.svg" alt="Duevy" width={24} height={24} style={{ width: "auto" }} className="h-6" />
          <span className="text-lg tracking-tight text-ink">Duevy.</span>
        </Link>
        <Link href={`/login?next=${encodeURIComponent(`/pay/${dueId}`)}`} className="text-sm font-medium text-ink-soft transition-colors hover:text-brand">
          Sign in
        </Link>
      </header>
      <main className="mx-auto max-w-lg px-5 pb-16 pt-2">{children}</main>
    </div>
  );
}
