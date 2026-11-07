import type { TransactionsQuery } from "@/lib/api/transactions";
import { STATUS_META, TXN_META } from "./data";
import type { DatePreset, TxnDirection, TxnFilters, TxnStatus, TxnType } from "./types";

export const PER_PAGE = 20;
export const SEARCH_MAX_LENGTH = 100;

export const DIRECTIONS: { value: TxnDirection; label: string }[] = [
  { value: "all", label: "All" },
  { value: "in", label: "Money in" },
  { value: "out", label: "Money out" },
];

export const DATE_PRESETS: { value: DatePreset; label: string }[] = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "month", label: "This month" },
];

const PRESET_DAYS: Record<Exclude<DatePreset, "month">, number> = { "7d": 7, "30d": 30, "90d": 90 };

export const DEFAULT_FILTERS: TxnFilters = { q: "", direction: "all", page: 1 };

const YMD = /^\d{4}-\d{2}-\d{2}$/;

/** Local yyyy-mm-dd → a Date at local midnight, or undefined if it isn't a real day. */
export function parseYmd(value: string | null | undefined): Date | undefined {
  if (!value || !YMD.test(value)) return undefined;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d ? date : undefined;
}

/** A Date's local calendar day as yyyy-mm-dd, so a pick never shifts across a timezone. */
export function toYmd(date: Date) {
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${m}-${d}`;
}

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

function pick<T extends string>(value: string | null, allowed: readonly T[]): T | undefined {
  return value && (allowed as readonly string[]).includes(value) ? (value as T) : undefined;
}

/** Read the filters from the URL, dropping anything malformed rather than sending it to the API. */
export function parseFilters(params: URLSearchParams): TxnFilters {
  const page = Number(params.get("page"));
  const range = pick(params.get("range"), DATE_PRESETS.map((p) => p.value));
  let from = parseYmd(params.get("from")) ? params.get("from")! : undefined;
  let to = parseYmd(params.get("to")) ? params.get("to")! : undefined;
  if (from && to && from > to) [from, to] = [to, from];

  return {
    q: (params.get("q") ?? "").trim().slice(0, SEARCH_MAX_LENGTH),
    direction: pick(params.get("direction"), ["in", "out"] as const) ?? "all",
    status: pick(params.get("status"), Object.keys(STATUS_META) as TxnStatus[]),
    type: pick(params.get("type"), Object.keys(TXN_META) as TxnType[]),
    // A preset wins over a stale custom range.
    range,
    from: range ? undefined : from,
    to: range ? undefined : to,
    page: Number.isInteger(page) && page > 1 ? page : 1,
  };
}

/** The URL form of the filters — defaults are left out so a clean page has a clean URL. */
export function serializeFilters(f: TxnFilters) {
  const params = new URLSearchParams();
  if (f.q) params.set("q", f.q);
  if (f.direction !== "all") params.set("direction", f.direction);
  if (f.status) params.set("status", f.status);
  if (f.type) params.set("type", f.type);
  if (f.range) params.set("range", f.range);
  else {
    if (f.from) params.set("from", f.from);
    if (f.to) params.set("to", f.to);
  }
  if (f.page > 1) params.set("page", String(f.page));
  return params;
}

/**
 * The date window as inclusive ISO bounds: local start of the first day to
 * local end of the last. Presets end today; "Last 7 days" includes today.
 */
export function resolveDateWindow(f: TxnFilters, now = new Date()): { from?: string; to?: string } {
  if (f.range) {
    const start =
      f.range === "month"
        ? new Date(now.getFullYear(), now.getMonth(), 1)
        : new Date(now.getFullYear(), now.getMonth(), now.getDate() - (PRESET_DAYS[f.range] - 1));
    return { from: startOfDay(start).toISOString(), to: endOfDay(now).toISOString() };
  }
  const from = parseYmd(f.from);
  const to = parseYmd(f.to);
  return {
    from: from ? startOfDay(from).toISOString() : undefined,
    to: to ? endOfDay(to).toISOString() : undefined,
  };
}

/** The server query for these filters. Undefined keys drop out of the query key and URL. */
export function toApiQuery(f: TxnFilters, now = new Date()): TransactionsQuery {
  const { from, to } = resolveDateWindow(f, now);
  const query: TransactionsQuery = { page: f.page, perPage: PER_PAGE };
  if (f.direction !== "all") query.direction = f.direction;
  if (f.status) query.status = f.status;
  if (f.type) query.type = f.type;
  if (f.q) query.q = f.q;
  if (from) query.from = from;
  if (to) query.to = to;
  return query;
}

export function hasActiveFilters(f: TxnFilters) {
  return !!(f.q || f.direction !== "all" || f.status || f.type || f.range || f.from || f.to);
}

/** Human label for the date filter, or undefined for all time. */
export function dateLabel(f: TxnFilters): string | undefined {
  if (f.range) return DATE_PRESETS.find((p) => p.value === f.range)?.label;
  const from = parseYmd(f.from);
  const to = parseYmd(f.to);
  const fmt = (d: Date) => d.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
  if (from && to) return f.from === f.to ? fmt(from) : `${fmt(from)} – ${fmt(to)}`;
  if (from) return `From ${fmt(from)}`;
  if (to) return `Until ${fmt(to)}`;
  return undefined;
}

/** The active filters as short phrases, for the summary line. */
export function describeFilters(f: TxnFilters): string[] {
  const parts: string[] = [];
  if (f.direction !== "all") parts.push(f.direction === "in" ? "Money in" : "Money out");
  if (f.type) parts.push(TXN_META[f.type].label);
  if (f.status) parts.push(STATUS_META[f.status].label);
  const date = dateLabel(f);
  if (date) parts.push(date);
  if (f.q) parts.push(`“${f.q}”`);
  return parts;
}
