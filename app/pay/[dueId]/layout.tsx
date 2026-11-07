import type { Metadata } from "next";
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { SITE_NAME } from "@/lib/seo";
import { QueryProvider } from "@/app/components/QueryProvider";
import { loadShareDue, shareDate, shareNaira } from "./share";

/**
 * Pay links are shared privately (WhatsApp, class groups) — never in search —
 * but their preview names the due, so the group knows what it's paying for.
 * The card itself is ./opengraph-image.tsx.
 */
export async function generateMetadata({ params }: { params: Promise<{ dueId: string }> }): Promise<Metadata> {
  const { dueId } = await params;
  const due = await loadShareDue(dueId);
  const title = due ? `Pay ${shareNaira(due.amount)} · ${due.title}` : "Pay";
  const description = due
    ? `${due.spaceName}. Due ${shareDate(due.dueDate)}. Pay securely with ${SITE_NAME} — no account needed, receipt straight away.`
    : `Pay your dues securely with ${SITE_NAME}. No account needed.`;
  return {
    title,
    description,
    robots: { index: false, follow: false },
    openGraph: { type: "website", url: `/pay/${dueId}`, siteName: SITE_NAME, locale: "en_NG", title, description },
    twitter: { card: "summary_large_image", title, description },
  };
}

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
      {/* The brand doodle, faded right back so the card stays the focus. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 bg-[url('/doodle-card.jpg')] bg-cover bg-center opacity-[0.14]"
      />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-gradient-to-b from-cloud/70 to-transparent" />
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
      <main className="relative mx-auto max-w-lg px-4 pb-10 pt-2 sm:px-5">
        {/* The pay step polls the checkout's status through TanStack Query. */}
        <QueryProvider>{children}</QueryProvider>
      </main>
      <footer className="relative pb-8 text-center text-[11px] text-ink-soft">
        Bank transfers processed securely by 9jaPay · {SITE_NAME}
      </footer>
    </div>
  );
}
