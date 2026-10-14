import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SITE_NAME } from "@/lib/seo";
import { QueryProvider } from "@/app/components/QueryProvider";

/** Invite links are personal to a department: shareable, but never in search. */
export const metadata: Metadata = {
  title: "Join your department",
  description: `You've been invited to pay your department's dues on ${SITE_NAME}.`,
  robots: { index: false, follow: false },
};

export default function JoinLayout({ children }: { children: ReactNode }) {
  return <QueryProvider>{children}</QueryProvider>;
}
