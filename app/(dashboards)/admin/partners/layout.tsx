import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { FEATURES } from "@/lib/features";

/** Hidden with the nav link until partner perks are switched on. */
export default function AdminPartnersLayout({ children }: { children: ReactNode }) {
  if (!FEATURES.partners) notFound();
  return children;
}
