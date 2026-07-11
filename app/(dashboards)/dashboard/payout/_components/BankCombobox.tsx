"use client";

import { useMemo, useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowDown01Icon,
  Search01Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Bank } from "@/lib/api/payouts";
import { BankLogo } from "./BankLogo";

/**
 * Searchable single-select for the (long) live bank list. Built on the shared
 * Popover. Keyboard: type to filter, ↑/↓ to move, Enter to pick, Esc to close.
 */
export function BankCombobox({
  banks,
  value,
  onChange,
  loading = false,
}: {
  banks: Bank[];
  /** Selected bank code. */
  value: string;
  onChange: (code: string) => void;
  loading?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  const selectedName = banks.find((b) => b.code === value)?.name;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return banks;
    return banks.filter((b) => b.name.toLowerCase().includes(q));
  }, [banks, query]);

  function select(code: string) {
    onChange(code);
    setOpen(false);
    setQuery("");
  }

  function moveActive(next: number) {
    if (filtered.length === 0) return;
    const clamped = (next + filtered.length) % filtered.length;
    setActive(clamped);
    listRef.current?.querySelectorAll("li")[clamped]?.scrollIntoView({ block: "nearest" });
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setQuery("");
          setActive(0);
        }
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-label="Bank"
          disabled={loading && banks.length === 0}
          className="mt-1.5 flex h-11 w-full items-center gap-2 rounded-2xl border border-cloud bg-canvas px-4 text-left text-sm text-ink transition-colors outline-none cursor-pointer focus-visible:border-brand focus-visible:ring-[3px] focus-visible:ring-brand/15 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {selectedName && <BankLogo name={selectedName} className="h-6 w-6" />}
          <span className={`min-w-0 flex-1 truncate ${selectedName ? "text-ink" : "text-ink-soft"}`}>
            {selectedName ?? (loading && banks.length === 0 ? "Loading banks…" : "Select your bank")}
          </span>
          <HugeiconsIcon
            icon={ArrowDown01Icon}
            size={16}
            strokeWidth={2.5}
            className="shrink-0 text-ink-soft"
          />
        </button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-0">
        <div className="flex items-center gap-2 border-b border-cloud px-3">
          <HugeiconsIcon icon={Search01Icon} size={16} className="shrink-0 text-ink-soft" />
          <input
            autoFocus
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActive(0);
            }}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                moveActive(active + 1);
              } else if (event.key === "ArrowUp") {
                event.preventDefault();
                moveActive(active - 1);
              } else if (event.key === "Enter") {
                event.preventDefault();
                if (filtered[active]) select(filtered[active].code);
              }
            }}
            placeholder="Search banks…"
            className="h-11 w-full bg-transparent text-sm text-ink placeholder:text-ink-soft outline-none"
          />
        </div>

        {filtered.length === 0 ? (
          <p className="px-3 py-6 text-center text-[13px] text-ink-soft">No banks found.</p>
        ) : (
          <ul ref={listRef} role="listbox" className="max-h-64 overflow-y-auto p-1.5">
            {filtered.map((bank, index) => {
              const selected = bank.code === value;
              const isActive = index === active;
              return (
                <li key={bank.code} role="option" aria-selected={selected}>
                  <button
                    type="button"
                    onMouseEnter={() => setActive(index)}
                    onClick={() => select(bank.code)}
                    className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 pr-8 text-left text-[13px] font-medium text-ink transition-colors ${
                      isActive ? "bg-paper" : ""
                    }`}
                  >
                    <BankLogo name={bank.name} className="h-7 w-7 text-[11px]" />
                    <span className="min-w-0 flex-1 truncate">{bank.name}</span>
                    {selected && (
                      <HugeiconsIcon
                        icon={Tick02Icon}
                        size={14}
                        strokeWidth={2.5}
                        className="shrink-0 text-brand"
                      />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
