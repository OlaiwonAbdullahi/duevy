"use client";

import { DepartmentProfileCard } from "./_components/DepartmentProfileCard";
import { SpaceThemeCard } from "./_components/SpaceThemeCard";
import { RepsCard } from "./_components/RepsCard";
import { AuditTrailCard } from "./_components/AuditTrailCard";
import { DangerZone } from "./_components/DangerZone";
import { FEATURES } from "@/lib/features";

export default function ManageDeptPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <header>
        <span className="mb-2 hidden rounded-full sm:inline-block bg-cloud px-3 py-1 text-[11px] font-semibold text-brand">
          Rep tools
        </span>
        <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">
          Manage department
        </h1>
        <p className="mt-1 text-[13px] text-ink-soft max-sm:hidden">
          Edit your department&apos;s details.
        </p>
      </header>

      <div className="mt-4 flex flex-col gap-4 sm:mt-6 sm:gap-5">
        <DepartmentProfileCard />
        {FEATURES.themes && <SpaceThemeCard />}
        {FEATURES.coReps && <RepsCard />}
        <AuditTrailCard />
        <DangerZone />
      </div>
    </div>
  );
}
