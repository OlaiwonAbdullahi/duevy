import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { FEATURES } from "@/lib/features";

/** Hidden with the nav link while polls are out of MVP scope. */
export default function AdminPollsLayout({ children }: { children: ReactNode }) {
  if (!FEATURES.polls) notFound();
  return children;
}
