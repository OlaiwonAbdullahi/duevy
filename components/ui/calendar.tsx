"use client";

import * as React from "react";
import { DayPicker, type ChevronProps } from "react-day-picker";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";

import { cn } from "@/lib/utils";

/**
 * shadcn-style calendar built on react-day-picker, restyled to the Guild
 * palette (forest-green selection) and wired to Hugeicons for the nav chevrons.
 */
function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-1", className)}
      classNames={{
        months: "flex flex-col gap-4",
        month: "relative flex flex-col gap-3",
        month_caption: "flex h-9 items-center justify-center",
        caption_label: "text-sm font-semibold text-ink",
        nav: "absolute inset-x-0 top-0 flex h-9 items-center justify-between",
        button_previous:
          "grid h-8 w-8 place-items-center rounded-full text-ink-soft transition-colors duration-300 hover:bg-paper hover:text-ink disabled:opacity-40 cursor-pointer",
        button_next:
          "grid h-8 w-8 place-items-center rounded-full text-ink-soft transition-colors duration-300 hover:bg-paper hover:text-ink disabled:opacity-40 cursor-pointer",
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday:
          "grid h-8 w-9 place-items-center text-[11px] font-medium text-ink-soft",
        week: "mt-1 flex w-full",
        day: "relative p-0 text-center text-sm",
        day_button:
          "grid h-9 w-9 place-items-center rounded-full text-sm text-ink transition-colors duration-200 hover:bg-cloud cursor-pointer",
        selected:
          "[&>button]:bg-brand [&>button]:text-white [&>button]:hover:bg-brand [&>button]:hover:text-white",
        today: "[&>button]:font-semibold [&>button]:text-brand",
        outside: "[&>button]:text-ink-soft/40",
        disabled: "[&>button]:opacity-40 [&>button]:pointer-events-none",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className: chevronClass }: ChevronProps) => (
          <HugeiconsIcon
            icon={orientation === "left" ? ArrowLeft01Icon : ArrowRight01Icon}
            size={16}
            className={chevronClass}
          />
        ),
      }}
      {...props}
    />
  );
}

export { Calendar };
