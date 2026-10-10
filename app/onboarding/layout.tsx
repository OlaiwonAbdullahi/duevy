import type { ReactNode } from "react";
import { QueryProvider } from "@/app/components/QueryProvider";

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return <QueryProvider>{children}</QueryProvider>;
}
