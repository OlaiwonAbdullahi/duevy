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

/** Local-safe yyyy-mm-dd, so picking a day never shifts across a timezone. */
function toISODate(date: Date) {
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${m}-${d}`;
}

/**
 * A shadcn calendar in a popover, standing in for a native date input so the
 * deadline picker matches the rest of the app. Value is a yyyy-mm-dd string.
 */
export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  min,
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  /** yyyy-mm-dd floor for selectable dates. Defaults to today (no past dates). */
  min?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = value ? new Date(`${value}T00:00:00`) : undefined;

  // Deadlines can't be in the past — or, for an active poll being extended,
  // can't be earlier than its current deadline.
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const floor = min ? new Date(`${min}T00:00:00`) : today;
  const earliest = floor > today ? floor : today;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex h-11 w-full items-center gap-2 rounded-2xl border border-cloud bg-canvas px-4 text-left text-sm outline-none transition-colors duration-300 hover:border-brand/50 focus-visible:border-brand data-[state=open]:border-brand cursor-pointer"
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
              : placeholder}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-3">
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected}
          disabled={{ before: earliest }}
          onSelect={(date) => {
            onChange(date ? toISODate(date) : "");
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
