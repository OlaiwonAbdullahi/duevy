"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Alert01Icon } from "@hugeicons/core-free-icons";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { HugeIcon } from "./nav-config";

/**
 * A single confirm step for actions that are hard to undo. Controlled by `open`;
 * closing (overlay, Escape, Cancel) routes through `onClose`. Danger tone paints
 * the confirm button rose; default paints it brand.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "danger",
  icon = Alert01Icon,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "brand";
  icon?: HugeIcon;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const danger = tone === "danger";

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="gap-0 rounded-3xl border border-cloud bg-canvas p-6 sm:max-w-sm"
      >
        <DialogHeader className="items-center gap-3 text-center sm:text-center">
          <span
            className={`grid h-11 w-11 place-items-center rounded-full ${
              danger ? "bg-rose-100 text-rose-600" : "bg-cloud text-brand"
            }`}
          >
            <HugeiconsIcon icon={icon} size={20} />
          </span>
          <DialogTitle className="text-base font-semibold tracking-tight text-ink">
            {title}
          </DialogTitle>
          <DialogDescription className="text-[13px] leading-5 text-ink-soft">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-11 flex-1 rounded-full border border-cloud bg-canvas text-sm font-semibold text-ink transition-colors duration-300 hover:bg-paper cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`h-11 flex-1 rounded-full text-sm font-semibold text-white transition-colors duration-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 ${
              danger
                ? "bg-rose-600 hover:bg-rose-700 focus-visible:ring-rose-300"
                : "bg-brand hover:bg-brand-bright focus-visible:ring-brand/40"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
