import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { FEATURES } from "@/lib/features";

/** Polls and voting are out of MVP scope — public vote links 404 until re-enabled. */
export default function VoteLayout({ children }: { children: ReactNode }) {
  if (!FEATURES.polls) notFound();
  return children;
}
