"use client";

import { useEffect, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Award01Icon,
  Building03Icon,
  Invoice01Icon,
  MoneySend01Icon,
  Clock01Icon,
  UserAdd01Icon,
  UserMultipleIcon,
  SquareLock01Icon,
  Archive02Icon,
} from "@hugeicons/core-free-icons";
import type { HugeIcon } from "../../_components/nav-config";
import { SettingsCard } from "../../settings/_components/SettingsCard";
import { EmptyState } from "../../_components/EmptyState";
import { Skeleton } from "../../_components/Skeleton";
import { useRepSpace } from "../../_components/use-rep-space";
import { timeAgo } from "../../_components/notifications-data";
import { getAuditLog } from "@/lib/api/rep";
import type { AuditEntry } from "@/lib/api/types";

/** Icon per audit `action` (§5.8). */
const ACTION_ICON: Record<string, HugeIcon> = {
  payout_requested: MoneySend01Icon,
  due_published: Invoice01Icon,
  due_closed: Invoice01Icon,
  poll_created: Award01Icon,
  members_approved: UserAdd01Icon,
  profile_updated: Building03Icon,
  rep_invited: UserMultipleIcon,
  rep_removed: UserMultipleIcon,
  code_regenerated: SquareLock01Icon,
  lead_transferred: UserMultipleIcon,
  space_archived: Archive02Icon,
};

export function AuditTrailCard() {
  const repSpace = useRepSpace();
  const spaceId = repSpace?.id;
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!spaceId) return;
    let cancelled = false;
    getAuditLog(spaceId, { perPage: 10 })
      .then(({ data }) => {
        if (!cancelled) setEntries(data);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [spaceId]);

  return (
    <SettingsCard
      icon={Clock01Icon}
      title="Activity log"
      description="A record of recent changes and who made them."
    >
      {loading ? (
        <ol className="flex flex-col">
          {Array.from({ length: 3 }).map((_, i) => (
            <li
              key={i}
              className="flex items-start gap-3 border-t border-cloud py-3.5 first:border-t-0 first:pt-0"
            >
              <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1">
                <Skeleton className="h-3.5 w-44" />
                <Skeleton className="mt-2 h-3 w-20" />
              </div>
            </li>
          ))}
        </ol>
      ) : entries.length === 0 ? (
        <EmptyState
          size="sm"
          icon={Clock01Icon}
          title="No activity yet"
          description="Changes to your department will show up here."
        />
      ) : (
        <ol className="flex flex-col">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="flex items-start gap-3 border-t border-cloud py-3.5 first:border-t-0 first:pt-0"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-cloud text-brand">
                <HugeiconsIcon
                  icon={ACTION_ICON[entry.action] ?? Clock01Icon}
                  size={16}
                />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-ink">
                  <span className="font-semibold">{entry.actor.name}</span>{" "}
                  {entry.description}
                </p>
                <p className="mt-0.5 text-xs text-ink-soft">
                  {timeAgo(entry.createdAt)}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </SettingsCard>
  );
}
