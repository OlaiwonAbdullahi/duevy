"use client";

import { useState } from "react";
import { toast } from "sonner";
import { UserGroup03Icon } from "@hugeicons/core-free-icons";
import { SettingsCard } from "../../settings/_components/SettingsCard";
import { ToggleRow } from "../../settings/_components/Toggle";

type Prefs = {
  acceptRequests: boolean;
  requireMatric: boolean;
  allowGuests: boolean;
  listInDirectory: boolean;
};

/** How students get into the department space and pay. Applies instantly. */
export function MembershipCard() {
  const [prefs, setPrefs] = useState<Prefs>({
    acceptRequests: true,
    requireMatric: true,
    allowGuests: false,
    listInDirectory: true,
  });

  const set = (key: keyof Prefs, label: string) => (value: boolean) => {
    setPrefs((p) => ({ ...p, [key]: value }));
    toast.success(`${label} ${value ? "on" : "off"}`);
  };

  return (
    <SettingsCard
      icon={UserGroup03Icon}
      title="Membership & access"
      description="Control how students join and who can pay your dues."
    >
      <div className="flex flex-col">
        <ToggleRow
          title="Accept join requests"
          description="Students can request to join this department space."
          checked={prefs.acceptRequests}
          onChange={set("acceptRequests", "Join requests")}
        />
        <ToggleRow
          title="Require matric verification"
          description="Only students on your uploaded class list are auto-approved."
          checked={prefs.requireMatric}
          onChange={set("requireMatric", "Matric verification")}
        />
        <ToggleRow
          title="Allow guest payments"
          description="Non-members can pay dues you mark as open to guests."
          checked={prefs.allowGuests}
          onChange={set("allowGuests", "Guest payments")}
        />
        <ToggleRow
          title="List in student directory"
          description="Show this department when students search for spaces to join."
          checked={prefs.listInDirectory}
          onChange={set("listInDirectory", "Directory listing")}
        />
      </div>
    </SettingsCard>
  );
}
