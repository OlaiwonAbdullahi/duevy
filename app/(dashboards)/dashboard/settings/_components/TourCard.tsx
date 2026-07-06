"use client";

import { Rocket01Icon } from "@hugeicons/core-free-icons";
import { useTour } from "../../_components/DashboardTour";
import { SettingsCard } from "./SettingsCard";

/** Lets anyone rerun the first-visit walkthrough of the dashboard. */
export function TourCard() {
  const { start } = useTour();

  return (
    <SettingsCard
      icon={Rocket01Icon}
      title="Product tour"
      description="New here, or just forgot where things live? Take the walkthrough again."
    >
      <button
        type="button"
        onClick={start}
        className="rounded-full bg-brand px-4 py-2 text-xs font-semibold text-white transition-colors duration-300 hover:bg-brand-bright cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
      >
        Replay the tour
      </button>
    </SettingsCard>
  );
}
