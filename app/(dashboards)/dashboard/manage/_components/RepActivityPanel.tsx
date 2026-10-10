"use client";

import { useEffect, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Clock01Icon } from "@hugeicons/core-free-icons";
import { Modal } from "../../_components/Modal";
import { EmptyState } from "../../_components/EmptyState";
import { Skeleton } from "../../_components/Skeleton";
import { timeAgo } from "../../_components/notifications-data";
import { getAuditLog } from "@/lib/api/rep";
import type { AuditEntry } from "@/lib/api/types";
import { ACTION_ICON } from "./AuditTrailCard";

const ROLE_LABEL: Record<string, string> = { lead: "Lead rep", co: "Co-rep" };

/** What a single teammate has been up to, filtered from the space's audit log. */
export function RepActivityPanel({
  spaceId,
  repId,
  repName,
  repRole,
  onClose,
}: {
  spaceId: string;
  repId: string;
  repName: string;
  repRole: string;
  onClose: () => void;
}) {
  const [entries, setEntries] = useState<AuditEntry[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    getAuditLog(spaceId, { perPage: 100 })
      .then(({ data }) => {
        if (!cancelled) setEntries(data.filter((e) => e.actor.id === repId));
      })
      .catch(() => {
        if (!cancelled) setEntries([]);
      });
    return () => {
      cancelled = true;
    };
  }, [spaceId, repId]);

  return (
    <Modal title={repName} icon={Clock01Icon} onClose={onClose}>
      <span className="mb-4 inline-flex w-fit items-center rounded-full bg-cloud px-2.5 py-1 text-[11px] font-semibold text-brand">
        {ROLE_LABEL[repRole] ?? repRole}
      </span>

      {entries === null ? (
        <ol className="flex flex-col">
          {Array.from({ length: 3 }).map((_, i) => (
            <li key={i} className="flex items-start gap-3 border-t border-cloud py-3.5 first:border-t-0 first:pt-0">
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
          description={`${repName.split(" ")[0]}'s actions in this department will show up here.`}
        />
      ) : (
        <ol className="flex flex-col">
          {entries.map((entry) => (
            <li key={entry.id} className="flex items-start gap-3 border-t border-cloud py-3.5 first:border-t-0 first:pt-0">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-cloud text-brand">
                <HugeiconsIcon icon={ACTION_ICON[entry.action] ?? Clock01Icon} size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-ink">{entry.description}</p>
                <p className="mt-0.5 text-xs text-ink-soft">{timeAgo(entry.createdAt)}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </Modal>
  );
}
