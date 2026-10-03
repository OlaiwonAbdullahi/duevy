import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { FEATURES } from "@/lib/features";

/** Hidden with the nav link while referrals are out of MVP scope. */
export default function AdminReferralsLayout({ children }: { children: ReactNode }) {
  if (!FEATURES.referrals) notFound();
  return children;
}
