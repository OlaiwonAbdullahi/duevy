import type { ReactNode } from "react";
import { QueryProvider } from "@/app/components/QueryProvider";

export default function DashboardsLayout({ children }: { children: ReactNode }) {
  return <QueryProvider>{children}</QueryProvider>;
}
