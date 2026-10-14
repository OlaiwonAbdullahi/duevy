"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon, UserAdd01Icon } from "@hugeicons/core-free-icons";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Modal } from "../../_components/Modal";
import { UserAvatar } from "../../_components/UserAvatar";
import { EmptyState } from "../../_components/EmptyState";
import { Skeleton } from "../../_components/Skeleton";
import { BARE_INPUT } from "../../_components/form-styles";
import { addRep, listMembers } from "@/lib/api/rep";
import { ApiError } from "@/lib/api/errors";
import type { SpaceMember, SpaceRep } from "@/lib/api/types";

const ADD_ERRORS: Record<string, string> = {
  ALREADY_REP: "They're already a rep of this department.",
  USER_INACTIVE: "Their account is suspended, so they can't be a rep.",
  NOT_FOUND: "They're no longer a member of this department.",
};

/** The lead picks a member of the department to make a co-rep. */
export function AddRepModal({
  spaceId,
  existingRepIds,
  onClose,
  onAdded,
}: {
  spaceId: string;
  existingRepIds: string[];
  onClose: () => void;
  onAdded: (rep: SpaceRep) => void;
}) {
  const [q, setQ] = useState("");
  const [members, setMembers] = useState<SpaceMember[] | null>(null);
  const [selected, setSelected] = useState<SpaceMember | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Search as they type, debounced.
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      listMembers(spaceId, { q: q.trim() || undefined, perPage: 20 })
        .then((page) => {
          if (!cancelled) setMembers(page.data);
        })
        .catch(() => {
          if (!cancelled) setMembers([]);
        });
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [spaceId, q]);

  const candidates = members?.filter((m) => !existingRepIds.includes(m.id)) ?? null;

  const submit = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      const rep = await addRep(spaceId, selected.id);
      toast.success("Co-rep added", { description: `${rep.name} can now help manage dues.` });
      onAdded(rep);
    } catch (err) {
      toast.error("Couldn't add the co-rep", {
        description: (err instanceof ApiError && ADD_ERRORS[err.code]) || "Something went wrong. Please try again.",
      });
      setSubmitting(false);
    }
  };

  return (
    <Modal title="Add a co-rep" icon={UserAdd01Icon} onClose={onClose}>
      <p className="text-[13px] leading-5 text-ink-soft">
        Co-reps help manage dues. They can withdraw only from dues you assign to them, and you can nominate up to two as
        withdrawal signatories.
      </p>

      <div className="mt-5 flex items-center gap-2 rounded-2xl border border-cloud bg-canvas px-4 focus-within:border-brand">
        <HugeiconsIcon icon={Search01Icon} size={16} className="shrink-0 text-ink-soft" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search members by name, matric or email"
          aria-label="Search members"
          className={cn(BARE_INPUT, "flex-1")}
        />
      </div>

      <div className="mt-3 flex max-h-72 flex-col gap-2 overflow-y-auto">
        {candidates === null ? (
          <>
            <Skeleton className="h-14 rounded-2xl" />
            <Skeleton className="h-14 rounded-2xl" />
          </>
        ) : candidates.length === 0 ? (
          <EmptyState
            size="sm"
            icon={UserAdd01Icon}
            title={q ? "No matching members" : "No members to add"}
            description="Co-reps must be members of this department. Share your join code so they can join first."
          />
        ) : (
          candidates.map((m) => {
            const active = m.id === selected?.id;
            return (
              <button
                key={m.id}
                type="button"
                aria-pressed={active}
                onClick={() => setSelected(m)}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border p-3 text-left transition-colors duration-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40",
                  active ? "border-brand bg-cloud" : "border-cloud bg-paper hover:bg-cloud/50",
                )}
              >
                <UserAvatar name={m.name} size={36} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{m.name}</p>
                  <p className="truncate text-xs text-ink-soft">
                    {m.matricNo ? `${m.matricNo} · ` : ""}
                    {m.email}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>

      <button
        type="button"
        onClick={submit}
        disabled={!selected || submitting}
        className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand text-sm font-semibold text-white transition-colors duration-300 hover:bg-brand-bright disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
      >
        {submitting && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
        {submitting ? "Adding…" : selected ? `Make ${selected.name.split(" ")[0]} a co-rep` : "Choose a member"}
      </button>
    </Modal>
  );
}
