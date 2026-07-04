import { HugeiconsIcon } from "@hugeicons/react";
import {
  Award01Icon,
  Building03Icon,
  Invoice01Icon,
  MoneySend01Icon,
  Clock01Icon,
  UserAdd01Icon,
} from "@hugeicons/core-free-icons";
import type { HugeIcon } from "../../_components/nav-config";
import { SettingsCard } from "../../settings/_components/SettingsCard";

type AuditEntry = {
  id: string;
  icon: HugeIcon;
  action: string;
  actor: string;
  time: string;
};

/** Recent changes to the department, so co-reps can see who did what. */
const AUDIT_LOG: AuditEntry[] = [
  {
    id: "au-1",
    icon: MoneySend01Icon,
    action: "Requested a ₦250,000 payout",
    actor: "Amara Okafor",
    time: "Today, 8:15 AM",
  },
  {
    id: "au-2",
    icon: Invoice01Icon,
    action: "Published “Data Structures Handout” due",
    actor: "Tunde Balogun",
    time: "Yesterday, 4:02 PM",
  },
  {
    id: "au-3",
    icon: Award01Icon,
    action: "Created the “CSSA Dinner & Awards 2026” poll",
    actor: "Amara Okafor",
    time: "Jun 28, 2026",
  },
  {
    id: "au-4",
    icon: UserAdd01Icon,
    action: "Approved 12 students from an uploaded class list",
    actor: "Ngozi Eze",
    time: "Jun 27, 2026",
  },
  {
    id: "au-5",
    icon: Building03Icon,
    action: "Updated the department profile",
    actor: "Amara Okafor",
    time: "Jun 24, 2026",
  },
];

export function AuditTrailCard() {
  return (
    <SettingsCard
      icon={Clock01Icon}
      title="Activity log"
      description="A record of recent changes and who made them."
    >
      <ol className="flex flex-col">
        {AUDIT_LOG.map((entry) => (
          <li
            key={entry.id}
            className="flex items-start gap-3 border-t border-cloud py-3.5 first:border-t-0 first:pt-0"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-cloud text-brand">
              <HugeiconsIcon icon={entry.icon} size={16} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-ink">
                <span className="font-semibold">{entry.actor}</span> {entry.action}
              </p>
              <p className="mt-0.5 text-xs text-ink-soft">{entry.time}</p>
            </div>
          </li>
        ))}
      </ol>
    </SettingsCard>
  );
}
