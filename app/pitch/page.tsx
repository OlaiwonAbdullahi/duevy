import type { Metadata } from "next";
import { getPublicMetrics } from "@/lib/api/metrics";
import PitchDeck from "./_components/PitchDeck";

// Must be a literal — Next reads segment config statically. Keep in sync with METRICS_REVALIDATE.
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Pitch",
  description:
    "Duevy — the payment infrastructure for organised communities, starting with campus dues.",
  alternates: { canonical: "https://duevy.app/pitch" },
  robots: { index: false, follow: false },
};

export default async function PitchPage() {
  // The traction slide shows these live, always from production; it falls back gracefully when null.
  const metrics = await getPublicMetrics("https://api.duevy.app/v1");
  return <PitchDeck metrics={metrics} />;
}
