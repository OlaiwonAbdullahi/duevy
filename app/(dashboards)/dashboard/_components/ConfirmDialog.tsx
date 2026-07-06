"use client";

import { Alert01Icon } from "@hugeicons/core-free-icons";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { HugeIcon } from "./nav-config";
import { IconChip } from "./IconChip";

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
          <IconChip icon={icon} size="md" tone={danger ? "danger" : "brand"} />
          <DialogTitle className="text-base font-semibold tracking-tight text-ink">
            {title}
          </DialogTitle>
          <DialogDescription className="text-[13px] leading-5 text-ink-soft">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 flex gap-3">
          <Button
            variant="brand-outline"
            size="pill-lg"
            onClick={onClose}
            className="flex-1 bg-canvas"
          >
            {cancelLabel}
          </Button>
          <Button
            variant={danger ? "danger" : "brand"}
            size="pill-lg"
            onClick={onConfirm}
            className="flex-1"
          >
            {confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
