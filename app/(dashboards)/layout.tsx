import type { Metadata } from "next";
import type { ReactNode } from "react";
import { PRIVATE_ROBOTS } from "@/lib/seo";
import { QueryProvider } from "@/app/components/QueryProvider";

export const metadata: Metadata = { robots: PRIVATE_ROBOTS };

export default function DashboardsLayout({ children }: { children: ReactNode }) {
  return <QueryProvider>{children}</QueryProvider>;
}
