"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export default function AdminTabs({
  value,
  onChange,
  items,
}: {
  value: string;
  onChange: (next: string) => void;
  items: { value: string; label: string }[];
}) {
  return (
    <div className="flex flex-wrap gap-2 rounded-2xl border border-cloud bg-paper/30 p-2">
      {items.map((it) => (
        <button
          key={it.value}
          type="button"
          onClick={() => onChange(it.value)}
          className={cn(
            "rounded-xl px-3 py-2 text-sm font-semibold transition-colors",
            value === it.value
              ? "bg-cloud text-ink"
              : "text-ink-soft hover:bg-paper hover:text-ink",
          )}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}
