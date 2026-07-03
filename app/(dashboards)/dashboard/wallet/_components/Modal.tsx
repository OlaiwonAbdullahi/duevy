"use client";

import type { ReactNode } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { HugeIcon } from "../../_components/nav-config";

/**
 * Thin wrapper over shadcn's <Dialog> that keeps the wallet's icon-chip header.
 * Mounted only while open, so form state resets on each open; closing via the
 * overlay, the built-in close button or Escape all route through `onClose`.
 */
export function Modal({
  title,
  icon,
  onClose,
  children,
}: {
  title: string;
  icon: HugeIcon;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        aria-describedby={undefined}
        className="flex max-h-[85dvh] flex-col gap-0 overflow-hidden rounded-3xl border border-cloud bg-canvas p-0 sm:max-w-md"
      >
        <div className=" overflow-y-auto p-6">
          <DialogHeader className="mb-6 flex-row items-center gap-3 space-y-0">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-cloud text-brand">
              <HugeiconsIcon icon={icon} size={18} />
            </span>
            <DialogTitle className="text-base font-semibold tracking-tight text-ink">
              {title}
            </DialogTitle>
          </DialogHeader>
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}
