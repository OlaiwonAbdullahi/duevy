import type { Metadata } from "next";
import { PRIVATE_ROBOTS } from "@/lib/seo";
import { DemoEntry } from "./DemoEntry";

export const metadata: Metadata = {
  title: "Demo",
  description: "Explore the Duevy rep dashboard with sample data — no account needed.",
  robots: PRIVATE_ROBOTS,
};

export default function DemoPage() {
  return <DemoEntry />;
}
