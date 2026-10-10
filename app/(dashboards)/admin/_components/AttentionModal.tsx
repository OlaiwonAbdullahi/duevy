"use client";

import type { ReactNode } from "react";

import StatusBadge from "./StatusBadge";

type ToastTone = "ok" | "warn" | "bad";

export default function AttentionModal({
  open,
  title,
  subtitle,
  badgeTone,
  badgeText,
  children,
  onClose,
  actions,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  badgeTone: ToastTone;
  badgeText: string;
  children: ReactNode;
  onClose: () => void;
  actions?: ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-ink/50"
        onClick={onClose}
        role="button"
        aria-label="Close modal"
        tabIndex={0}
      />

      <div className="relative mx-auto mt-12 max-w-2xl rounded-2xl border border-cloud bg-paper/90 shadow-xl">
        <div className="flex items-start justify-between gap-4 p-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <StatusBadge tone={badgeTone}>{badgeText}</StatusBadge>
              <h2 className="truncate text-sm font-semibold text-ink">
                {title}
              </h2>
            </div>
            {subtitle ? (
              <p className="mt-1 text-[12px] text-ink-soft">{subtitle}</p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-cloud bg-paper/50 px-3 py-2 text-sm font-semibold text-ink-soft hover:bg-paper/70"
          >
            Close
          </button>
        </div>

        <div className="border-t border-cloud/70 p-4">{children}</div>

        {actions ? (
          <div className="flex items-center justify-end gap-2 border-t border-cloud/70 p-4">
            {actions}
          </div>
        ) : null}
      </div>
    </div>
  );
}
