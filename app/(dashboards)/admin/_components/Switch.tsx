"use client";

import { cn } from "@/lib/utils";

/** Small brand-coloured toggle for the settings switches. */
export function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-300",
        checked ? "bg-brand" : "bg-cloud",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-300",
          checked && "translate-x-5",
        )}
      />
    </button>
  );
}
