"use client";

import { cn } from "@/lib/utils";

/** Underline tab bar used to switch panels within an admin page. */
export function Tabs<T extends string>({
  value,
  onChange,
  items,
}: {
  value: T;
  onChange: (next: T) => void;
  items: { value: T; label: string }[];
}) {
  return (
    <div role="tablist" className="flex flex-wrap gap-1 border-b border-cloud">
      {items.map((it) => (
        <button
          key={it.value}
          type="button"
          role="tab"
          aria-selected={value === it.value}
          onClick={() => onChange(it.value)}
          className={cn(
            "-mb-px cursor-pointer border-b-2 px-4 pt-1 pb-2.5 text-sm font-semibold transition-colors",
            value === it.value
              ? "border-brand text-brand"
              : "border-transparent text-ink-soft hover:text-ink",
          )}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}
