"use client";

import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CheckmarkCircle02Icon,
  Tick02Icon,
  MinusSignIcon,
  PlusSignIcon,
  Medal01Icon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { nairaFromKobo } from "@/app/(dashboards)/dashboard/_components/format";
import type { PollCategory } from "@/lib/api/types";

function initials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  );
}

export function CategoryVoter({
  category,
  closed,
  locked,
  selectedNomineeId,
  quantity,
  allowQuantity,
  amountPerVote,
  onSelect,
  onQuantityChange,
}: {
  category: PollCategory;
  /** Poll is closed — show final tallies instead of a picker. */
  closed: boolean;
  /** Caller already voted in this category (membersOnly, remaining === 0). */
  locked: boolean;
  selectedNomineeId?: string;
  quantity: number;
  /** Paid + not members-only — votes are uncapped, so quantity is adjustable. */
  allowQuantity: boolean;
  amountPerVote: number;
  onSelect: (nomineeId: string) => void;
  onQuantityChange: (quantity: number) => void;
}) {
  const totalVotes = category.nominees.reduce((sum, n) => sum + (n.votes ?? 0), 0);
  const topVotes = closed ? Math.max(0, ...category.nominees.map((n) => n.votes ?? 0)) : 0;

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-2 px-0.5">
        <h2 className="text-lg font-semibold tracking-tight text-ink">{category.title}</h2>
        {locked && !closed && (
          <span className="inline-flex items-center gap-1 rounded-full bg-cloud px-2.5 py-1 text-[11px] font-semibold text-brand">
            <HugeiconsIcon icon={CheckmarkCircle02Icon} size={12} />
            You voted here
          </span>
        )}
        {closed && (
          <span className="text-xs text-ink-soft">
            {totalVotes.toLocaleString("en-NG")} vote{totalVotes === 1 ? "" : "s"}
          </span>
        )}
      </div>

      <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {category.nominees.map((nominee) => {
          const selected = selectedNomineeId === nominee.id;
          const share =
            closed && totalVotes > 0 ? Math.round(((nominee.votes ?? 0) / totalVotes) * 100) : 0;
          const isLeader = closed && totalVotes > 0 && (nominee.votes ?? 0) === topVotes;

          return (
            <li key={nominee.id}>
              <button
                type="button"
                disabled={closed || locked}
                aria-pressed={selected}
                onClick={() => onSelect(nominee.id)}
                className={cn(
                  "group relative block aspect-4/5 w-full overflow-hidden rounded-2xl border bg-paper text-left transition-all duration-300 cursor-pointer disabled:cursor-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40",
                  selected
                    ? "border-brand ring-2 ring-brand/30"
                    : "border-cloud hover:border-brand/40",
                )}
              >
                {nominee.imageUrl ? (
                  <Image
                    src={nominee.imageUrl}
                    alt=""
                    fill
                    unoptimized
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-cloud to-paper text-2xl font-bold text-brand/70">
                    {initials(nominee.name)}
                  </div>
                )}

                {/* Scrim so text stays legible over any photo. */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

                {nominee.code && (
                  <span className="absolute left-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
                    #{nominee.code}
                  </span>
                )}

                {isLeader && (
                  <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold text-amber-950">
                    <HugeiconsIcon icon={Medal01Icon} size={11} />
                    Leading
                  </span>
                )}
                {!closed && selected && (
                  <span className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-brand text-white shadow-sm">
                    <HugeiconsIcon icon={Tick02Icon} size={13} />
                  </span>
                )}

                <div className="absolute inset-x-0 bottom-0 p-2.5">
                  <p className="truncate text-[13px] font-semibold text-white">{nominee.name}</p>
                  {nominee.bio && !closed && (
                    <p className="mt-0.5 truncate text-[10.5px] text-white/70">{nominee.bio}</p>
                  )}
                  {closed && (
                    <>
                      <p className="mt-0.5 text-[11px] font-medium text-white/80">
                        {nominee.votes ?? 0} vote{(nominee.votes ?? 0) === 1 ? "" : "s"} · {share}%
                      </p>
                      <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/20">
                        <div
                          className={cn("h-full rounded-full", isLeader ? "bg-amber-400" : "bg-white/70")}
                          style={{ width: `${share}%` }}
                        />
                      </div>
                    </>
                  )}
                </div>
              </button>
            </li>
          );
        })}
      </ul>

      {!closed && allowQuantity && selectedNomineeId && (
        <div className="mt-3 flex items-center justify-between rounded-2xl border border-cloud bg-paper/50 px-4 py-2.5">
          <div>
            <p className="text-xs font-medium text-ink">Votes for this award</p>
            <p className="text-[11px] text-ink-soft">
              {nairaFromKobo(amountPerVote)} each · {nairaFromKobo(amountPerVote * quantity)} total
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
              aria-label="Fewer votes"
              className="grid h-8 w-8 place-items-center rounded-full border border-cloud bg-canvas text-ink transition-colors hover:bg-cloud cursor-pointer"
            >
              <HugeiconsIcon icon={MinusSignIcon} size={14} />
            </button>
            <span className="w-6 text-center text-sm font-semibold tabular-nums text-ink">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => onQuantityChange(Math.min(999, quantity + 1))}
              aria-label="More votes"
              className="grid h-8 w-8 place-items-center rounded-full border border-cloud bg-canvas text-ink transition-colors hover:bg-cloud cursor-pointer"
            >
              <HugeiconsIcon icon={PlusSignIcon} size={14} />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
