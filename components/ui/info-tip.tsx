"use client";

import * as React from "react";
import { Tooltip as TooltipPrimitive } from "radix-ui";
import { HugeiconsIcon } from "@hugeicons/react";
import { InformationCircleIcon } from "@hugeicons/core-free-icons";

import { cn } from "@/lib/utils";

/**
 * A small ⓘ button that reveals an explanation, so secondary copy doesn't
 * crowd the page. Opens on hover and keyboard focus (Radix Tooltip), and also
 * on tap — Radix tooltips ignore touch, so a click toggles it explicitly.
 */
export function InfoTip({
  children,
  label = "More info",
  side = "top",
  tone = "default",
  className,
}: {
  children: React.ReactNode;
  /** Accessible name of the trigger. */
  label?: string;
  side?: "top" | "bottom" | "left" | "right";
  /** `onDark` for triggers on the brand-coloured hero card. */
  tone?: "default" | "onDark";
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <TooltipPrimitive.Provider delayDuration={150}>
      <TooltipPrimitive.Root open={open} onOpenChange={setOpen}>
        <TooltipPrimitive.Trigger asChild>
          <button
            type="button"
            aria-label={label}
            // A tap focuses the trigger (which already opens it) and then clicks, so
            // a click only ever opens; tapping elsewhere or Escape closes it.
            onClick={(e) => {
              e.preventDefault();
              setOpen(true);
            }}
            className={cn(
              "inline-grid h-5 w-5 shrink-0 place-items-center rounded-full transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2",
              tone === "onDark"
                ? "text-white/70 hover:text-white focus-visible:ring-white/60"
                : "text-ink-soft hover:text-brand focus-visible:ring-brand/40",
              className,
            )}
          >
            <HugeiconsIcon icon={InformationCircleIcon} size={14} />
          </button>
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={side}
            sideOffset={6}
            collisionPadding={12}
            className={cn(
              "z-50 max-w-[260px] rounded-xl bg-ink px-3 py-2 text-[12px] leading-relaxed text-canvas shadow-lg",
              "data-[state=delayed-open]:animate-in data-[state=instant-open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=delayed-open]:fade-in-0 data-[state=instant-open]:fade-in-0",
            )}
          >
            {children}
            <TooltipPrimitive.Arrow className="fill-ink" />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}
