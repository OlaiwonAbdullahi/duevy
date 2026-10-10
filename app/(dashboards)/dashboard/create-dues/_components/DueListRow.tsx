"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  PencilEdit01Icon,
  Delete02Icon,
  Clock01Icon,
  UserMultipleIcon,
  SquareLock02Icon,
  SentIcon,
  MoreVerticalIcon,
} from "@hugeicons/core-free-icons";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { HugeIcon } from "../../_components/nav-config";
import {
  relativeDue,
  CATEGORY_ICON,
  CATEGORY_LABEL,
} from "../../dues/_components/data";
import { naira, STATUS_META } from "./data";
import type { RepDue } from "./types";

export function DueListRow({
  due,
  onEdit,
  onDelete,
  onClose,
  onPublish,
  onViewCollections,
}: {
  due: RepDue;
  onEdit: (due: RepDue) => void;
  onDelete: (due: RepDue) => void;
  onClose: (due: RepDue) => void;
  onPublish: (due: RepDue) => void;
  onViewCollections: (due: RepDue) => void;
}) {
  const rel = relativeDue(due.dueDate);
  const status = STATUS_META[due.status];
  const pct = due.memberCount
    ? Math.round((due.paidCount / due.memberCount) * 100)
    : 0;
  const collected = due.paidCount * due.amount;

  return (
    <li className="border-t border-cloud first:border-t-0">
      <MobileDueRow
        due={due}
        pct={pct}
        collected={collected}
        onEdit={onEdit}
        onDelete={onDelete}
        onClose={onClose}
        onPublish={onPublish}
        onViewCollections={onViewCollections}
      />
      <div className="hidden items-center gap-4 py-4 sm:flex">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-cloud text-brand">
        <HugeiconsIcon icon={CATEGORY_ICON[due.category]} size={20} />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-ink">{due.title}</p>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${status.className}`}
          >
            {status.label}
          </span>
        </div>
        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-soft">
          <span>{CATEGORY_LABEL[due.category]}</span>
          <span className="text-cloud">•</span>
          <span
            className={`inline-flex items-center gap-1 ${
              rel.past && due.status === "active" ? "text-rose-600" : ""
            }`}
          >
            <HugeiconsIcon icon={Clock01Icon} size={12} />
            {rel.text}
          </span>
        </div>

        {/* Collection progress. */}
        <button
          type="button"
          onClick={() => onViewCollections(due)}
          aria-label={`View who paid ${due.title}`}
          className="group mt-2 flex items-center gap-2 cursor-pointer"
        >
          <div className="h-1.5 w-28 overflow-hidden rounded-full bg-paper">
            <div
              className="h-full rounded-full bg-brand"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-[11px] text-ink-soft group-hover:text-brand group-hover:underline">
            {due.paidCount}/{due.memberCount} paid · {naira(collected)}
          </span>
        </button>
      </div>

      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <p className="text-base font-semibold tracking-tight text-ink">
          {naira(due.amount)}
        </p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onViewCollections(due)}
            aria-label={`View who paid ${due.title}`}
            title="Collections"
            className="grid h-9 w-9 place-items-center rounded-full text-ink-soft transition-colors duration-300 hover:bg-paper hover:text-brand cursor-pointer"
          >
            <HugeiconsIcon icon={UserMultipleIcon} size={16} />
          </button>
          {due.status === "draft" && (
            <button
              type="button"
              onClick={() => onPublish(due)}
              aria-label={`Publish ${due.title}`}
              title="Publish due"
              className="grid h-9 w-9 place-items-center rounded-full text-ink-soft transition-colors duration-300 hover:bg-paper hover:text-brand cursor-pointer"
            >
              <HugeiconsIcon icon={SentIcon} size={16} />
            </button>
          )}
          {/* Closed dues can't be edited (409 DUE_CLOSED). */}
          {due.status !== "closed" && (
            <button
              type="button"
              onClick={() => onEdit(due)}
              aria-label={`Edit ${due.title}`}
              className="grid h-9 w-9 place-items-center rounded-full text-ink-soft transition-colors duration-300 hover:bg-paper hover:text-ink cursor-pointer"
            >
              <HugeiconsIcon icon={PencilEdit01Icon} size={16} />
            </button>
          )}
          {due.status === "active" && (
            <button
              type="button"
              onClick={() => onClose(due)}
              aria-label={`Close ${due.title}`}
              title="Close due"
              className="grid h-9 w-9 place-items-center rounded-full text-ink-soft transition-colors duration-300 hover:bg-paper hover:text-ink cursor-pointer"
            >
              <HugeiconsIcon icon={SquareLock02Icon} size={16} />
            </button>
          )}
          {/* Only drafts can be deleted (409 ONLY_DRAFTS_DELETABLE). */}
          {due.status === "draft" && (
            <button
              type="button"
              onClick={() => onDelete(due)}
              aria-label={`Delete ${due.title}`}
              className="grid h-9 w-9 place-items-center rounded-full text-ink-soft transition-colors duration-300 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
            >
              <HugeiconsIcon icon={Delete02Icon} size={16} />
            </button>
          )}
        </div>
      </div>
      </div>
    </li>
  );
}

/**
 * Phone layout: tap the row for collections; the title, status and amount on
 * top, a full-width progress bar below, and the actions folded into a ⋯ menu.
 */
function MobileDueRow({
  due,
  pct,
  collected,
  onEdit,
  onDelete,
  onClose,
  onPublish,
  onViewCollections,
}: {
  due: RepDue;
  pct: number;
  collected: number;
  onEdit: (due: RepDue) => void;
  onDelete: (due: RepDue) => void;
  onClose: (due: RepDue) => void;
  onPublish: (due: RepDue) => void;
  onViewCollections: (due: RepDue) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const rel = relativeDue(due.dueDate);
  const status = STATUS_META[due.status];
  const late = rel.past && due.status === "active";

  const actions: { label: string; icon: HugeIcon; run: () => void; danger?: boolean }[] = [
    { label: "View collections", icon: UserMultipleIcon, run: () => onViewCollections(due) },
    ...(due.status === "draft"
      ? [{ label: "Publish due", icon: SentIcon, run: () => onPublish(due) }]
      : []),
    ...(due.status !== "closed"
      ? [{ label: "Edit due", icon: PencilEdit01Icon, run: () => onEdit(due) }]
      : []),
    ...(due.status === "active"
      ? [{ label: "Close due", icon: SquareLock02Icon, run: () => onClose(due) }]
      : []),
    ...(due.status === "draft"
      ? [{ label: "Delete draft", icon: Delete02Icon, run: () => onDelete(due), danger: true }]
      : []),
  ];

  return (
    <div className="flex items-start gap-3 py-3.5 sm:hidden">
      <button
        type="button"
        onClick={() => onViewCollections(due)}
        aria-label={`View who paid ${due.title}`}
        className="flex min-w-0 flex-1 items-start gap-3 text-left cursor-pointer focus-visible:outline-none"
      >
        <span
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl ${
            due.status === "active" ? "bg-cloud text-brand" : "bg-paper text-ink-soft"
          }`}
        >
          <HugeiconsIcon icon={CATEGORY_ICON[due.category]} size={19} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-start justify-between gap-2">
            <span className="truncate text-sm font-semibold text-ink">{due.title}</span>
            <span className="shrink-0 text-sm font-semibold tabular-nums text-ink">
              {naira(due.amount)}
            </span>
          </span>
          <span className="mt-1 flex items-center gap-1.5 text-[11px] text-ink-soft">
            <span className={`rounded-full px-1.5 py-px text-[10px] font-semibold ${status.className}`}>
              {status.label}
            </span>
            <span className={`inline-flex min-w-0 items-center gap-1 truncate ${late ? "font-medium text-rose-600" : ""}`}>
              <HugeiconsIcon icon={Clock01Icon} size={11} className="shrink-0" />
              {rel.text}
            </span>
          </span>
          {due.status !== "draft" && (
            <span className="mt-2.5 block">
              <span className="block h-1.5 overflow-hidden rounded-full bg-paper">
                <span
                  className="block h-full rounded-full bg-brand transition-[width] duration-500"
                  style={{ width: `${pct}%` }}
                />
              </span>
              <span className="mt-1.5 flex items-center justify-between text-[11px] text-ink-soft tabular-nums">
                <span>
                  {due.paidCount}/{due.memberCount} paid · {naira(collected)}
                </span>
                <span className="font-semibold text-ink">{pct}%</span>
              </span>
            </span>
          )}
        </span>
      </button>

      <Popover open={menuOpen} onOpenChange={setMenuOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label={`Actions for ${due.title}`}
            className="-mr-1.5 grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink-soft transition-colors active:bg-paper cursor-pointer"
          >
            <HugeiconsIcon icon={MoreVerticalIcon} size={18} />
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-48 p-1.5">
          {actions.map((a) => (
            <button
              key={a.label}
              type="button"
              onClick={() => {
                setMenuOpen(false);
                a.run();
              }}
              className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-left text-sm transition-colors active:bg-paper cursor-pointer ${
                a.danger ? "text-rose-600" : "text-ink"
              }`}
            >
              <HugeiconsIcon icon={a.icon} size={16} />
              {a.label}
            </button>
          ))}
        </PopoverContent>
      </Popover>
    </div>
  );
}
