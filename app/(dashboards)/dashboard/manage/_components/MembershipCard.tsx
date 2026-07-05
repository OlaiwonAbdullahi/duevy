"use client";

import { useState } from "react";
import { toast } from "sonner";
import { UserGroup03Icon } from "@hugeicons/core-free-icons";
import { SettingsCard } from "../../settings/_components/SettingsCard";
import { ToggleRow } from "../../settings/_components/Toggle";

type Prefs = {
  codeOpen: boolean;
  requireMatric: boolean;
  allowGuests: boolean;
  listInDirectory: boolean;
};

/** How students get into the department space and pay. Applies instantly. */
export function MembershipCard() {
  const [prefs, setPrefs] = useState<Prefs>({
    codeOpen: true,
    requireMatric: false,
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
          title="Allow joining with code"
          description="Students who enter your join code become members instantly. Manage the code from Circle."
          checked={prefs.codeOpen}
          onChange={set("codeOpen", "Code joining")}
        />
        <ToggleRow
          title="Require matric to join"
          description="Ask for a matric number when joining, and only accept ones on your class list."
          checked={prefs.requireMatric}
          onChange={set("requireMatric", "Matric check")}
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
