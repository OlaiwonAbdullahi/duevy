"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, Shield01Icon, SignatureIcon, UserAdd01Icon } from "@hugeicons/core-free-icons";
import { EmptyState } from "../../_components/EmptyState";
import { UserAvatar } from "../../_components/UserAvatar";
import { Skeleton } from "../../_components/Skeleton";
import { SettingsCard } from "../../settings/_components/SettingsCard";
import { useRepSpace } from "../../_components/use-rep-space";
import { removeRep } from "@/lib/api/rep";
import { queryKeys, useSpaceReps } from "@/lib/api/queries";
import type { SpaceRep as Rep } from "@/lib/api/types";
import { ConfirmDialog } from "../../_components/ConfirmDialog";
import { RepActivityPanel } from "./RepActivityPanel";
import { AddRepModal } from "./AddRepModal";

/** Co-reps who help run collections. The lead rep adds them from the
 *  department's members and can remove them. */
export function RepsCard() {
  const repSpace = useRepSpace();
  const spaceId = repSpace?.id;
  // Inviting/removing reps is lead-only on the backend.
  const isLead = repSpace?.membership !== "co";
  const queryClient = useQueryClient();
  const { data: reps = [], isPending: loading } = useSpaceReps(spaceId);
  // Edits go straight into the shared cache so the rest of the dashboard sees them.
  const setReps = (update: Rep[] | ((list: Rep[]) => Rep[])) => {
    if (!spaceId) return;
    queryClient.setQueryData<Rep[]>(queryKeys.spaceReps(spaceId), (list = []) =>
      typeof update === "function" ? update(list) : update,
    );
  };
  const [activityRep, setActivityRep] = useState<Rep | null>(null);
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<Rep | null>(null);

  const remove = async (rep: Rep) => {
    setRemoving(null);
    if (!spaceId) return;
    const prev = reps;
    setReps((list) => list.filter((r) => r.id !== rep.id));
    try {
      await removeRep(spaceId, rep.id);
      toast.success("Co-rep removed", { description: rep.name });
      // Signatories and due assignments changed with them.
      void queryClient.invalidateQueries({ queryKey: ["space", spaceId] });
    } catch {
      setReps(prev);
      toast.error("Couldn't remove the co-rep.");
    }
  };

  return (
    <SettingsCard
      icon={Shield01Icon}
      title="Reps & roles"
      description="People who can manage dues and collections for this department."
      action={
        isLead && spaceId ? (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-cloud px-3.5 text-xs font-semibold text-brand transition-colors hover:bg-brand hover:text-white cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
          >
            <HugeiconsIcon icon={UserAdd01Icon} size={14} />
            <span className="max-sm:hidden">Add co-rep</span>
            <span className="sm:hidden">Add</span>
          </button>
        ) : undefined
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
          description="Only the lead rep manages this department for now."
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
                  <p className="truncate text-xs text-ink-soft">
                    {rep.email}
                    {rep.role === "co" && !!rep.assignedDues && (
                      <span> · {rep.assignedDues} due{rep.assignedDues === 1 ? "" : "s"} assigned</span>
                    )}
                  </p>
                </div>
              </button>
              {rep.isSignatory && (
                <span
                  title="Signs withdrawals"
                  className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-700 max-sm:hidden"
                >
                  <HugeiconsIcon icon={SignatureIcon} size={12} />
                  Signatory
                </span>
              )}
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
                      onClick={() => setRemoving(rep)}
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

      {adding && spaceId && (
        <AddRepModal
          spaceId={spaceId}
          existingRepIds={reps.map((r) => r.id)}
          onClose={() => setAdding(false)}
          onAdded={() => {
            setAdding(false);
            void queryClient.invalidateQueries({ queryKey: queryKeys.spaceReps(spaceId) });
          }}
        />
      )}

      <ConfirmDialog
        open={!!removing}
        title={`Remove ${removing?.name ?? "this co-rep"}?`}
        description={
          removing?.isSignatory
            ? "They're a withdrawal signatory. If approvals are on, withdrawals stop until you nominate a replacement. Dues assigned to them are unassigned."
            : "They lose access to this department's rep tools, and dues assigned to them are unassigned."
        }
        confirmLabel="Remove"
        onConfirm={() => removing && remove(removing)}
        onClose={() => setRemoving(null)}
      />

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
