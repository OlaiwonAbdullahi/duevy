"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { UserGroup03Icon, Clock01Icon } from "@hugeicons/core-free-icons";
import { SettingsCard } from "../../settings/_components/SettingsCard";
import { Toggle } from "../../settings/_components/Toggle";

const ROWS = [
  {
    title: "Allow joining with code",
    description:
      "Students who enter your join code become members instantly. Manage the code from Circle.",
    checked: true,
  },
  {
    title: "Require matric to join",
    description: "Ask for a matric number when joining, and only accept ones on your class list.",
    checked: false,
  },
  {
    title: "Allow guest payments",
    description: "Non-members can pay dues you mark as open to guests.",
    checked: false,
  },
  {
    title: "List in student directory",
    description: "Show this department when students search for spaces to join.",
    checked: true,
  },
];

/**
 * Preview of upcoming membership controls — there's no backend endpoint for
 * these yet (only name/short/about/hue/theme are settable via `PATCH
 * /spaces/{id}`), so every row is shown locked rather than silently no-op
 * "saving" a preference that never reaches the server.
 */
export function MembershipCard() {
  return (
    <SettingsCard
      icon={UserGroup03Icon}
      title="Membership & access"
      description="Control how students join and who can pay your dues."
    >
      <div className="mb-4 flex items-center gap-2 rounded-2xl bg-paper px-4 py-2.5 text-xs text-ink-soft">
        <HugeiconsIcon icon={Clock01Icon} size={14} className="shrink-0" />
        Coming soon — these controls aren&apos;t live yet.
      </div>
      <div className="flex flex-col opacity-60">
        {ROWS.map((row) => (
          <div
            key={row.title}
            className="flex items-center justify-between gap-4 border-t border-cloud py-4 first:border-t-0 first:pt-0"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-ink">{row.title}</p>
              <p className="mt-0.5 text-xs text-ink-soft">{row.description}</p>
            </div>
            <Toggle checked={row.checked} onChange={() => {}} label={row.title} disabled />
          </div>
        ))}
      </div>
    </SettingsCard>
  );
}
