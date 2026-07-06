"use client";

import { useState } from "react";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, Cancel01Icon, Shield01Icon } from "@hugeicons/core-free-icons";
import { EmptyState } from "../../_components/EmptyState";
import { UserAvatar } from "../../_components/UserAvatar";
import { SettingsCard } from "../../settings/_components/SettingsCard";

type Rep = {
  id: string;
  name: string;
  email: string;
  role: "lead" | "co";
};

const INITIAL_REPS: Rep[] = [
  { id: "r1", name: "Amara Okafor", email: "amara.okafor@student.edu", role: "lead" },
  { id: "r2", name: "Tunde Balogun", email: "tunde.balogun@student.edu", role: "co" },
  { id: "r3", name: "Ngozi Eze", email: "ngozi.eze@student.edu", role: "co" },
];

/** Co-reps who help run collections. The lead rep can invite or remove them. */
export function RepsCard() {
  const [reps, setReps] = useState<Rep[]>(INITIAL_REPS);

  const remove = (rep: Rep) => {
    setReps((list) => list.filter((r) => r.id !== rep.id));
    toast.success("Co-rep removed", { description: rep.name });
  };

  return (
    <SettingsCard
      icon={Shield01Icon}
      title="Reps & roles"
      description="People who can manage dues and approvals for this department."
      action={
        <button
          type="button"
          onClick={() =>
            toast("Invite a co-rep", {
              description: "This would send an invite by email in production.",
            })
          }
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-xs font-semibold text-white transition-colors duration-300 hover:bg-brand-bright cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        >
          <HugeiconsIcon icon={Add01Icon} size={14} />
          Invite
        </button>
      }
    >
      {reps.length === 0 ? (
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
              <UserAvatar name={rep.name} size={40} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">
                  {rep.name}
                </p>
                <p className="truncate text-xs text-ink-soft">{rep.email}</p>
              </div>
              {rep.role === "lead" ? (
                <span className="rounded-full bg-brand px-2.5 py-1 text-[11px] font-semibold text-white">
                  Lead rep
                </span>
              ) : (
                <>
                  <span className="rounded-full bg-cloud px-2.5 py-1 text-[11px] font-semibold text-brand">
                    Co-rep
                  </span>
                  <button
                    type="button"
                    onClick={() => remove(rep)}
                    aria-label={`Remove ${rep.name}`}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink-soft transition-colors hover:bg-rose-50 hover:text-rose-600 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                  >
                    <HugeiconsIcon icon={Cancel01Icon} size={16} />
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </SettingsCard>
  );
}
