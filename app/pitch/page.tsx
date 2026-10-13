import type { Metadata } from "next";
import PitchDeck from "./_components/PitchDeck";

export const metadata: Metadata = {
  title: "Pitch",
  description:
    "Duevy — the transparent way Nigerian campuses collect dues, levies and event money.",
  alternates: { canonical: "https://duevy.app/pitch" },
  robots: { index: false, follow: false },
};

export default function PitchPage() {
  return <PitchDeck />;
}
