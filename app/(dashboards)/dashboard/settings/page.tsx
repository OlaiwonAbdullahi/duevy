"use client";

import { ProfileCard } from "./_components/ProfileCard";
import { VerificationCard } from "./_components/VerificationCard";
import { NotificationsCard } from "./_components/NotificationsCard";
import { AppearanceCard } from "./_components/AppearanceCard";
import { TourCard } from "./_components/TourCard";
import { SecurityCard } from "./_components/SecurityCard";
import { DangerZone } from "./_components/DangerZone";

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <header>
        <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">
          Settings
        </h1>
        <p className="mt-1 text-[13px] text-ink-soft max-sm:hidden">
          Manage your profile, notifications and how Duevy looks.
        </p>
      </header>

      <div className="mt-4 flex flex-col gap-4 sm:mt-6 sm:gap-5">
        <ProfileCard />
        <VerificationCard />
        <NotificationsCard />
        <AppearanceCard />
        <TourCard />
        <SecurityCard />
        <DangerZone />
      </div>
    </div>
  );
}
