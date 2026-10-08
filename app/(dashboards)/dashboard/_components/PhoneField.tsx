"use client";

import { useMemo, useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowDown01Icon,
  Search01Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import {
  getCountries,
  getCountryCallingCode,
  isValidPhoneNumber,
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js";
import metadata from "libphonenumber-js/min/metadata";
import * as Flags from "country-flag-icons/react/3x2";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { BARE_INPUT } from "./form-styles";

export type PhoneValue = { country: CountryCode; national: string };

export const EMPTY_PHONE: PhoneValue = { country: "NG", national: "" };

/** The number in E.164 (`+2348012345678`), or `null` while it isn't a valid number for its country. */
export function toE164({ country, national }: PhoneValue): string | null {
  if (!national || !isValidPhoneNumber(national, country)) return null;
  return parsePhoneNumberFromString(national, country)?.number ?? null;
}

type Country = { code: CountryCode; name: string; dial: string };

/** Every country libphonenumber knows, A–Z by English name, with Nigeria first. */
function buildCountries(): Country[] {
  const names = new Intl.DisplayNames(["en"], { type: "region" });
  const all = getCountries().map((code) => ({
    code,
    name: names.of(code) ?? code,
    dial: getCountryCallingCode(code),
  }));
  all.sort((a, b) => a.name.localeCompare(b.name));
  const ng = all.findIndex((c) => c.code === "NG");
  if (ng > 0) all.unshift(...all.splice(ng, 1));
  return all;
}

function Flag({ code }: { code: CountryCode }) {
  const Svg = (Flags as Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>>)[code];
  return (
    <span className="grid h-3.5 w-5 shrink-0 place-items-center overflow-hidden rounded-[3px] bg-cloud ring-1 ring-black/10">
      {Svg ? <Svg className="h-full w-full" aria-hidden /> : null}
    </span>
  );
}

/**
 * Phone number with a searchable country-code picker (flag + dial code).
 * Pasting a full `+44…` number switches the country to match.
 */
export function PhoneField({
  id,
  value,
  onChange,
  disabled = false,
  invalid = false,
}: {
  id?: string;
  value: PhoneValue;
  onChange: (value: PhoneValue) => void;
  disabled?: boolean;
  invalid?: boolean;
}) {
  const countries = useMemo(() => buildCountries(), []);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const dial = getCountryCallingCode(value.country);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/^\+/, "");
    if (!q) return countries;
    return countries.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase() === q ||
        c.dial.startsWith(q),
    );
  }, [countries, query]);

  function select(code: CountryCode) {
    onChange({ ...value, country: code });
    setOpen(false);
    setQuery("");
    // Straight back to the number once a country is picked.
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function moveActive(next: number) {
    if (filtered.length === 0) return;
    const clamped = (next + filtered.length) % filtered.length;
    setActive(clamped);
    listRef.current?.querySelectorAll("li")[clamped]?.scrollIntoView({ block: "nearest" });
  }

  function handleNumber(raw: string) {
    // A pasted international number carries its own country.
    if (raw.trim().startsWith("+")) {
      const parsed = parsePhoneNumberFromString(raw);
      if (parsed) {
        // Codes like +44 or +1 are shared; keep the picked country if it fits,
        // otherwise use the code's main one (GB, US) rather than a territory.
        const country =
          getCountryCallingCode(value.country) === parsed.countryCallingCode
            ? value.country
            : ((metadata.country_calling_codes[parsed.countryCallingCode]?.[0] as CountryCode | undefined) ??
              parsed.country);
        if (country) {
          onChange({ country, national: parsed.nationalNumber });
          return;
        }
      }
    }
    onChange({ ...value, national: raw.replace(/[^0-9]/g, "").slice(0, 15) });
  }

  return (
    <div
      className={cn(
        "flex h-11 items-center rounded-2xl border bg-canvas transition-colors focus-within:border-brand focus-within:ring-[3px] focus-within:ring-brand/15",
        invalid ? "border-rose-300" : "border-cloud",
        disabled && "opacity-60",
      )}
    >
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
            aria-controls={id ? `${id}-countries` : undefined}
            aria-label={`Country code, +${dial}`}
            disabled={disabled}
            className="flex h-full shrink-0 cursor-pointer items-center gap-1.5 rounded-l-2xl border-r border-cloud pl-3 pr-2.5 text-sm font-medium text-ink outline-none transition-colors hover:bg-paper focus-visible:bg-paper disabled:cursor-not-allowed"
          >
            <Flag code={value.country} />
            <span className="tabular-nums">+{dial}</span>
            <HugeiconsIcon
              icon={ArrowDown01Icon}
              size={14}
              strokeWidth={2.5}
              className={cn("text-ink-soft transition-transform", open && "rotate-180")}
            />
          </button>
        </PopoverTrigger>

        <PopoverContent align="start" className="w-72 p-0">
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
              placeholder="Search country or code…"
              className="h-11 w-full bg-transparent text-sm text-ink placeholder:text-ink-soft outline-none"
            />
          </div>

          {filtered.length === 0 ? (
            <p className="px-3 py-6 text-center text-[13px] text-ink-soft">No countries found.</p>
          ) : (
            <ul
              ref={listRef}
              id={id ? `${id}-countries` : undefined}
              role="listbox"
              className="max-h-64 overflow-y-auto p-1.5"
            >
              {filtered.map((country, index) => {
                const selected = country.code === value.country;
                return (
                  <li key={country.code} role="option" aria-selected={selected}>
                    <button
                      type="button"
                      onMouseEnter={() => setActive(index)}
                      onClick={() => select(country.code)}
                      className={cn(
                        "flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[13px] font-medium text-ink transition-colors",
                        index === active && "bg-paper",
                      )}
                    >
                      <Flag code={country.code} />
                      <span className="min-w-0 flex-1 truncate">{country.name}</span>
                      <span className="shrink-0 tabular-nums text-ink-soft">+{country.dial}</span>
                      <span className="grid w-3.5 shrink-0 place-items-center">
                        {selected && (
                          <HugeiconsIcon
                            icon={Tick02Icon}
                            size={14}
                            strokeWidth={2.5}
                            className="text-brand"
                          />
                        )}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </PopoverContent>
      </Popover>

      <Input
        ref={inputRef}
        id={id}
        value={value.national}
        onChange={(e) => handleNumber(e.target.value)}
        placeholder={value.country === "NG" ? "801 234 5678" : "Phone number"}
        inputMode="tel"
        autoComplete="tel-national"
        disabled={disabled}
        aria-invalid={invalid || undefined}
        className={cn(BARE_INPUT, "px-3 tabular-nums")}
      />
    </div>
  );
}
