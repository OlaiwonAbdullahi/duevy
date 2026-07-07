"use client";

import type { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { HugeIcon } from "../../dashboard/_components/nav-config";
import { IconChip } from "../../dashboard/_components/IconChip";

/**
 * Admin flavour of the dashboard Modal: same shadcn <Dialog> + icon-chip
 * header, plus an optional description line, footer row and a `wide` variant
 * for detail views. Mounted only while open so state resets on each open.
 */
export function AdminModal({
  title,
  description,
  icon,
  onClose,
  children,
  footer,
  wide = false,
}: {
  title: string;
  description?: string;
  icon: HugeIcon;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        {...(description ? {} : { "aria-describedby": undefined })}
        className={cn(
          "flex max-h-[85dvh] flex-col gap-0 overflow-hidden rounded-3xl border border-cloud bg-canvas p-0",
          wide ? "sm:max-w-2xl" : "sm:max-w-md",
        )}
      >
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-6">
          <DialogHeader className="mb-6 flex-row items-center gap-3 space-y-0">
            <IconChip icon={icon} />
            <div className="min-w-0">
              <DialogTitle className="truncate text-base font-semibold tracking-tight text-ink">
                {title}
              </DialogTitle>
              {description && (
                <DialogDescription className="mt-0.5 text-xs text-ink-soft">
                  {description}
                </DialogDescription>
              )}
            </div>
          </DialogHeader>

          {children}

          {footer && (
            <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-cloud pt-4">
              {footer}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Label + value box used inside detail modals — one fact per tile. */
export function ModalField({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-2xl border border-cloud bg-paper/30 p-3.5", className)}>
      <p className="text-[11px] font-semibold text-ink-soft">{label}</p>
      <div className="mt-1 text-sm font-semibold text-ink">{children}</div>
    </div>
  );
}
