"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Calendar03Icon } from "@hugeicons/core-free-icons";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

/** Local-safe yyyy-mm-dd, so picking a day never shifts across a timezone. */
function toISODate(date: Date) {
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${m}-${d}`;
}

/**
 * Date of birth: a shadcn calendar in a popover with month and year
 * dropdowns, so a birthday decades back is two taps away. Only past dates can
 * be picked. Value is a yyyy-mm-dd string.
 */
export function DateOfBirthPicker({
  value,
  onChange,
  disabled,
  className,
}: {
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = value ? new Date(`${value}T00:00:00`) : undefined;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const earliest = new Date(today.getFullYear() - 100, 0, 1);
  // With nothing picked yet, open around a typical student's birth year.
  const initialMonth = selected ?? new Date(today.getFullYear() - 20, 0, 1);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "flex h-11 w-full items-center gap-2 rounded-2xl border border-cloud bg-canvas px-4 text-left text-sm outline-none transition-colors duration-300 hover:border-brand/50 focus-visible:border-brand data-[state=open]:border-brand disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer",
            className,
          )}
        >
          <HugeiconsIcon
            icon={Calendar03Icon}
            size={16}
            className="shrink-0 text-ink-soft"
          />
          <span className={selected ? "text-ink" : "text-ink-soft"}>
            {selected
              ? selected.toLocaleDateString("en-NG", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : "Select your date of birth"}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-3">
        <Calendar
          mode="single"
          captionLayout="dropdown"
          selected={selected}
          defaultMonth={initialMonth}
          startMonth={earliest}
          endMonth={today}
          disabled={{ after: today }}
          reverseYears
          classNames={{
            dropdowns: "flex h-9 items-center justify-center gap-1.5",
            dropdown_root:
              "relative rounded-full border border-cloud transition-colors hover:border-brand/50 has-focus:border-brand",
            dropdown: "absolute inset-0 cursor-pointer opacity-0",
            caption_label:
              "flex h-8 items-center gap-1 pl-3 pr-2 text-sm font-semibold text-ink [&>svg]:size-3.5 [&>svg]:text-ink-soft",
          }}
          onSelect={(date) => {
            onChange(date ? toISODate(date) : "");
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
