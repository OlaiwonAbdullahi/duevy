"use client";

import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import { Award01Icon, CheckmarkCircle02Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
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

/**
 * The category-grid landing card — a banner, a peek at the nominees, and a
 * click-through into the full nominee picker. Visitors see this first and
 * only reach individual contestant details after tapping in.
 */
export function CategoryCard({
  category,
  index,
  paid,
  amountPerVote,
  closed,
  voted,
  selected,
  onOpen,
}: {
  category: PollCategory;
  index: number;
  paid: boolean;
  amountPerVote: number;
  closed: boolean;
  /** Caller already voted in this category (membersOnly, remaining === 0). */
  voted: boolean;
  /** A nominee here is currently picked (not yet submitted). */
  selected: boolean;
  onOpen: () => void;
}) {
  const preview = category.nominees.slice(0, 4);
  const extra = category.nominees.length - preview.length;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative block w-full overflow-hidden rounded-3xl border border-cloud bg-canvas text-left transition-all duration-300 cursor-pointer hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
    >
      {/* Banner. */}
      <div className="relative h-36 w-full">
        {category.imageUrl ? (
          <Image src={category.imageUrl} alt="" fill unoptimized className="object-cover" />
        ) : (
          <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-cloud to-paper">
            <HugeiconsIcon icon={Award01Icon} size={30} className="text-brand/50" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0" />

        <span className="absolute left-3 top-3 grid h-7 w-7 place-items-center rounded-full bg-white/90 text-[11px] font-bold text-brand backdrop-blur-sm">
          {String(index + 1).padStart(2, "0")}
        </span>

        {closed ? (
          <span className="absolute right-3 top-3 rounded-full bg-amber-400 px-2.5 py-1 text-[10px] font-bold text-amber-950">
            Closed
          </span>
        ) : voted ? (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold text-brand backdrop-blur-sm">
            <HugeiconsIcon icon={CheckmarkCircle02Icon} size={11} />
            Voted
          </span>
        ) : selected ? (
          <span className="absolute right-3 top-3 rounded-full bg-brand px-2.5 py-1 text-[10px] font-bold text-white">
            Selected
          </span>
        ) : null}

        <p className="absolute inset-x-3 bottom-2.5 truncate text-[15px] font-semibold text-white">
          {category.title}
        </p>
      </div>

      {/* Footer: nominee peek + price + go arrow. */}
      <div className="flex items-center justify-between gap-3 p-3.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex -space-x-2.5">
            {preview.map((nominee) => (
              <span
                key={nominee.id}
                className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full border-2 border-canvas bg-cloud"
              >
                {nominee.imageUrl ? (
                  <Image src={nominee.imageUrl} alt="" fill unoptimized className="object-cover" />
                ) : (
                  <span className="grid h-full w-full place-items-center text-[9px] font-bold text-brand">
                    {initials(nominee.name)}
                  </span>
                )}
              </span>
            ))}
            {extra > 0 && (
              <span className="relative grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 border-canvas bg-paper text-[9px] font-bold text-ink-soft">
                +{extra}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-ink-soft">
              {category.nominees.length} nominee{category.nominees.length === 1 ? "" : "s"}
            </p>
            {paid && (
              <p className="text-[11px] font-semibold text-brand">
                {nairaFromKobo(amountPerVote)}/vote
              </p>
            )}
          </div>
        </div>
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-paper text-ink-soft transition-colors duration-300 group-hover:bg-cloud group-hover:text-brand">
          <HugeiconsIcon icon={ArrowRight01Icon} size={15} />
        </span>
      </div>
    </button>
  );
}
