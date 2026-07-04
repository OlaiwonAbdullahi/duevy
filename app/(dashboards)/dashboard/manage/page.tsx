"use client";

import { DepartmentProfileCard } from "./_components/DepartmentProfileCard";
import { MembershipCard } from "./_components/MembershipCard";
import { RepsCard } from "./_components/RepsCard";
import { AuditTrailCard } from "./_components/AuditTrailCard";
import { DangerZone } from "./_components/DangerZone";

export default function ManageDeptPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <header>
        <span className="mb-2 inline-block rounded-full bg-cloud px-3 py-1 text-[11px] font-semibold text-brand">
          Rep tools
        </span>
        <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">
          Manage department
        </h1>
        <p className="mt-1 text-[13px] text-ink-soft">
          Edit your department&apos;s details, membership rules, and reps.
        </p>
      </header>

      <div className="mt-6 flex flex-col gap-5">
        <DepartmentProfileCard />
        <MembershipCard />
        <RepsCard />
        <AuditTrailCard />
        <DangerZone />
      </div>
    </div>
  );
}
