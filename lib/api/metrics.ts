import { API_BASE_URL } from "./config";
import type { ApiResponse } from "./types";

/** One calendar month of activity. `month` is `YYYY-MM`; `volume` is kobo. */
export type MetricsMonth = { month: string; volume: number; payments: number };

/** Platform-wide, aggregate-only traction figures (`GET /public/metrics`). Amounts in kobo. */
export type PublicMetrics = {
  students: number;
  reps: number;
  spaces: number;
  campuses: number;
  /** Lifetime money students paid through Duevy. */
  volume: number;
  /** Paid checkouts, lifetime. */
  payments: number;
  /** Withdrawals paid out to reps' banks, lifetime. */
  payouts: number;
  /** Oldest first, up to the last 12 months. */
  monthly: MetricsMonth[];
  /** When these figures were computed (ISO 8601). */
  updatedAt: string;
};

/** How long a fetched snapshot is reused before Next refetches it (seconds). */
export const METRICS_REVALIDATE = 3600;

/**
 * Server-side fetch for the public metrics page. Returns `null` when the API is
 * unreachable or the endpoint isn't live yet, so the page can render its
 * empty state instead of failing the build.
 */
export async function getPublicMetrics(): Promise<PublicMetrics | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/public/metrics`, {
      next: { revalidate: METRICS_REVALIDATE },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as ApiResponse<PublicMetrics>;
    return json.success ? json.data : null;
  } catch {
    return null;
  }
}
