"use client";

import { memo, useEffect, useId, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, Search01Icon } from "@hugeicons/core-free-icons";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { BARE_INPUT } from "../../_components/form-styles";
import { SEARCH_MAX_LENGTH } from "./filters";

const DEBOUNCE_MS = 300;

/**
 * Search by title or reference. Keystrokes stay in local state; the committed
 * term (debounced, trimmed) goes to `onCommit`, so typing re-renders only this
 * field — not the list. Enter commits at once, Escape clears.
 */
export const SearchField = memo(function SearchField({
  value,
  onCommit,
}: {
  value: string;
  onCommit: (q: string) => void;
}) {
  const id = useId();
  const [draft, setDraft] = useState(value);
  const [synced, setSynced] = useState(value);

  // The URL changed from elsewhere (clear filters, back button): follow it,
  // unless it's just our own trimmed commit catching up.
  if (value !== synced) {
    setSynced(value);
    if (draft.trim() !== value) setDraft(value);
  }

  useEffect(() => {
    const next = draft.trim();
    if (next === value) return;
    const timer = setTimeout(() => onCommit(next), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [draft, value, onCommit]);

  return (
    <div className="flex h-10 items-center gap-2 rounded-full border border-cloud bg-canvas pr-1.5 pl-4 transition-colors focus-within:border-brand md:w-72">
      <label htmlFor={id} className="sr-only">
        Search transactions by title or reference
      </label>
      <HugeiconsIcon icon={Search01Icon} size={16} aria-hidden className="shrink-0 text-ink-soft" />
      <Input
        id={id}
        type="search"
        value={draft}
        maxLength={SEARCH_MAX_LENGTH}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onCommit(draft.trim());
          if (e.key === "Escape" && draft) {
            e.preventDefault();
            setDraft("");
            onCommit("");
          }
        }}
        placeholder="Search title or reference"
        autoComplete="off"
        spellCheck={false}
        className={cn(BARE_INPUT, "h-9 px-0 [&::-webkit-search-cancel-button]:hidden")}
      />
      {draft && (
        <button
          type="button"
          onClick={() => {
            setDraft("");
            onCommit("");
          }}
          aria-label="Clear search"
          className="grid h-7 w-7 shrink-0 cursor-pointer place-items-center rounded-full text-ink-soft transition-colors hover:bg-paper hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        >
          <HugeiconsIcon icon={Cancel01Icon} size={14} />
        </button>
      )}
    </div>
  );
});
