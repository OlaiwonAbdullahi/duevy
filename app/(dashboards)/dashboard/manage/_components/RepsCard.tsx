"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, Cancel01Icon, Shield01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { EmptyState } from "../../_components/EmptyState";
import { UserAvatar } from "../../_components/UserAvatar";
import { Skeleton } from "../../_components/Skeleton";
import { SettingsCard } from "../../settings/_components/SettingsCard";
import { useRepSpace } from "../../_components/use-rep-space";
import { listReps, inviteRep, removeRep } from "@/lib/api/rep";
import type { SpaceRep as Rep } from "@/lib/api/types";
import { InviteRepModal } from "./InviteRepModal";
import { RepActivityPanel } from "./RepActivityPanel";

/** Co-reps who help run collections. The lead rep can invite or remove them. */
export function RepsCard() {
  const repSpace = useRepSpace();
  const spaceId = repSpace?.id;
  // Inviting/removing reps is lead-only on the backend.
  const isLead = repSpace?.membership !== "co";
  const [reps, setReps] = useState<Rep[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [activityRep, setActivityRep] = useState<Rep | null>(null);

  useEffect(() => {
    if (!spaceId) return;
    let cancelled = false;
    listReps(spaceId)
      .then((list) => {
        if (!cancelled) setReps(list);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [spaceId]);

  const remove = async (rep: Rep) => {
    if (!spaceId) return;
    const prev = reps;
    setReps((list) => list.filter((r) => r.id !== rep.id));
    try {
      await removeRep(spaceId, rep.id);
      toast.success("Co-rep removed", { description: rep.name });
    } catch {
      setReps(prev);
      toast.error("Couldn't remove the co-rep.");
    }
  };

  const invite = async (email: string) => {
    if (!spaceId) return;
    try {
      const newRep = await inviteRep(spaceId, email);
      setReps((list) => [...list, newRep]);
      toast.success("Invite sent", { description: email });
    } catch {
      toast.error("Couldn't send the invite.");
    }
  };

  return (
    <SettingsCard
      icon={Shield01Icon}
      title="Reps & roles"
      description="People who can manage dues and approvals for this department."
      action={
        isLead && (
          <Button variant="brand" size="pill" onClick={() => setInviteOpen(true)}>
            <HugeiconsIcon icon={Add01Icon} size={14} className="size-3.5" />
            Invite
          </Button>
        )
      }
    >
      {loading ? (
        <ul className="flex flex-col">
          {Array.from({ length: 2 }).map((_, i) => (
            <li
              key={i}
              className="flex items-center gap-3 border-t border-cloud py-3.5 first:border-t-0 first:pt-0"
            >
              <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="mt-2 h-3 w-40" />
              </div>
              <Skeleton className="h-6 w-16 shrink-0 rounded-full" />
            </li>
          ))}
        </ul>
      ) : reps.length === 0 ? (
        <EmptyState
          icon={Shield01Icon}
          title="No reps yet"
          description="Invite a co-rep to help you manage dues, approvals, and payouts."
        />
      ) : (
        <ul className="flex flex-col">
          {reps.map((rep) => (
            <li
              key={rep.id}
              className="flex items-center gap-3 border-t border-cloud py-3.5 first:border-t-0 first:pt-0"
            >
              <button
                type="button"
                onClick={() => setActivityRep(rep)}
                className="flex min-w-0 flex-1 items-center gap-3 rounded-xl text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                title={`View ${rep.name}'s activity`}
              >
                <UserAvatar name={rep.name} size={40} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">
                    {rep.name}
                  </p>
                  <p className="truncate text-xs text-ink-soft">{rep.email}</p>
                </div>
              </button>
              {rep.role === "lead" ? (
                <span className="rounded-full bg-brand px-2.5 py-1 text-[11px] font-semibold text-white">
                  Lead rep
                </span>
              ) : (
                <>
                  <span className="rounded-full bg-cloud px-2.5 py-1 text-[11px] font-semibold text-brand">
                    Co-rep
                  </span>
                  {isLead && (
                    <button
                      type="button"
                      onClick={() => remove(rep)}
                      aria-label={`Remove ${rep.name}`}
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink-soft transition-colors hover:bg-rose-50 hover:text-rose-600 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                    >
                      <HugeiconsIcon icon={Cancel01Icon} size={16} />
                    </button>
                  )}
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      {inviteOpen && (
        <InviteRepModal onClose={() => setInviteOpen(false)} onInvite={invite} />
      )}

      {activityRep && spaceId && (
        <RepActivityPanel
          spaceId={spaceId}
          repId={activityRep.id}
          repName={activityRep.name}
          repRole={activityRep.role}
          onClose={() => setActivityRep(null)}
        />
      )}
    </SettingsCard>
  );
}
