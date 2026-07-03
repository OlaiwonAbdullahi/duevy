"use client";

import { ProfileCard } from "./_components/ProfileCard";
import { NotificationsCard } from "./_components/NotificationsCard";
import { AppearanceCard } from "./_components/AppearanceCard";
import { SecurityCard } from "./_components/SecurityCard";
import { DangerZone } from "./_components/DangerZone";

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <header>
        <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">
          Settings
        </h1>
        <p className="mt-1 text-[13px] text-ink-soft">
          Manage your profile, notifications and how Duevy looks.
        </p>
      </header>

      <div className="mt-6 flex flex-col gap-5">
        <ProfileCard />
        <NotificationsCard />
        <AppearanceCard />
        <SecurityCard />
        <DangerZone />
      </div>
    </div>
  );
}
