"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { MoreHorizontalIcon } from "@hugeicons/core-free-icons";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type RowAction = {
  label: string;
  onSelect: () => void;
  tone?: "default" | "danger";
};

/** The "⋯" menu at the end of a table row. Closes itself after a pick and
 * stops clicks from bubbling into the row's own onClick. */
export function RowActions({
  actions,
  label = "Row actions",
}: {
  actions: RowAction[];
  label?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="brand-ghost"
          size="icon-sm"
          aria-label={label}
          onClick={(e) => e.stopPropagation()}
        >
          <HugeiconsIcon icon={MoreHorizontalIcon} size={16} />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-52 p-1.5"
        onClick={(e) => e.stopPropagation()}
      >
        {actions.map((action) => (
          <button
            key={action.label}
            type="button"
            onClick={() => {
              setOpen(false);
              action.onSelect();
            }}
            className={cn(
              "block w-full cursor-pointer rounded-xl px-3 py-2 text-left text-[13px] font-medium transition-colors",
              action.tone === "danger"
                ? "text-rose-600 hover:bg-rose-500/10"
                : "text-ink hover:bg-paper",
            )}
          >
            {action.label}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
