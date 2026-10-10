"use client";

import { useMemo, useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Building03Icon,
  ArrowDown01Icon,
  Search01Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

/**
 * Searchable single-select for a long list of options (Nigerian universities).
 * Built on the shared Popover so it matches the design system without pulling
 * in cmdk. Keyboard: type to filter, ↑/↓ to move, Enter to pick, Esc to close.
 */
export default function SchoolCombobox({
  id,
  value,
  onChange,
  options,
  placeholder = "Select your school",
  invalid = false,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  invalid?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((name) => name.toLowerCase().includes(q));
  }, [options, query]);

  function select(name: string) {
    onChange(name);
    setOpen(false);
    setQuery("");
  }

  function moveActive(next: number) {
    if (filtered.length === 0) return;
    const clamped = (next + filtered.length) % filtered.length;
    setActive(clamped);
    // Keep the highlighted row in view.
    listRef.current
      ?.querySelectorAll("li")
      [clamped]?.scrollIntoView({ block: "nearest" });
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
          id={id}
          type="button"
          role="combobox"
          aria-expanded={open}
          className={`flex h-[52px] w-full items-center gap-3 rounded-2xl border bg-[#fbfaf7] px-4 text-left text-[15px] transition-colors duration-300 outline-none cursor-pointer focus-visible:ring-2 focus-visible:ring-[#0b6e4f]/20 ${
            invalid
              ? "border-[#e11d48] focus-visible:border-[#e11d48]"
              : "border-[#e6f2ec] focus-visible:border-[#0b6e4f]"
          }`}
        >
          <HugeiconsIcon
            icon={Building03Icon}
            size={18}
            className="shrink-0 text-[#7a847f]"
          />
          <span
            className={`min-w-0 flex-1 truncate ${
              value ? "text-[#1b2520]" : "text-[#7a847f]/60"
            }`}
          >
            {value || placeholder}
          </span>
          <HugeiconsIcon
            icon={ArrowDown01Icon}
            size={16}
            strokeWidth={2.5}
            className="shrink-0 text-[#7a847f]"
          />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-[var(--radix-popover-trigger-width)] p-0"
      >
        {/* Search */}
        <div className="flex items-center gap-2 border-b border-[#e6f2ec] px-3">
          <HugeiconsIcon
            icon={Search01Icon}
            size={16}
            className="shrink-0 text-[#7a847f]"
          />
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
                if (filtered[active]) select(filtered[active]);
              }
            }}
            placeholder="Search universities…"
            className="h-11 w-full bg-transparent text-[14px] text-[#1b2520] placeholder:text-[#7a847f]/60 outline-none"
          />
        </div>

        {/* Options */}
        {filtered.length === 0 ? (
          <p className="px-3 py-6 text-center text-[13px] text-[#7a847f]">
            No schools found.
          </p>
        ) : (
          <ul
            ref={listRef}
            role="listbox"
            className="max-h-64 overflow-y-auto p-1.5"
          >
            {filtered.map((name, index) => {
              const selected = name === value;
              const isActive = index === active;
              return (
                <li key={name} role="option" aria-selected={selected}>
                  <button
                    type="button"
                    onMouseEnter={() => setActive(index)}
                    onClick={() => select(name)}
                    className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 pr-8 text-left text-[13px] font-medium text-[#1b2520] transition-colors ${
                      isActive ? "bg-[#f4f2ec]" : ""
                    }`}
                  >
                    <span className="min-w-0 flex-1 truncate">{name}</span>
                    {selected && (
                      <HugeiconsIcon
                        icon={Tick02Icon}
                        size={14}
                        strokeWidth={2.5}
                        className="shrink-0 text-[#0b6e4f]"
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
