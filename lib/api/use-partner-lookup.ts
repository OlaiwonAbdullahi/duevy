"use client";

import { useEffect, useState } from "react";
import { ApiError } from "./errors";
import { PARTNER_ERRORS, lookupPartnerCode } from "./partners";
import type { PartnerPreview } from "./types";

type LookupResult =
  | { code: string; preview: PartnerPreview; error: null }
  | { code: string; preview: null; error: string };

export type PartnerLookup =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "found"; preview: PartnerPreview }
  | { status: "error"; error: string };

/** Codes are 3–20 chars; don't hit the (rate-limited) lookup before that. */
const MIN_LENGTH = 3;

/**
 * Debounced live preview of a partner code as it's typed. Only a result for
 * the code currently in the field is ever returned, so a slow response for an
 * older keystroke can't flash the wrong partner.
 */
export function usePartnerLookup(code: string, { delay = 400 }: { delay?: number } = {}): PartnerLookup {
  const [latest, setLatest] = useState<LookupResult | null>(null);
  const ready = code.length >= MIN_LENGTH;

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      lookupPartnerCode(code)
        .then((preview) => {
          if (!cancelled) setLatest({ code, preview, error: null });
        })
        .catch((err) => {
          if (cancelled) return;
          const message =
            err instanceof ApiError
              ? (PARTNER_ERRORS[err.code] ?? err.message)
              : "Couldn't check that code right now.";
          setLatest({ code, preview: null, error: message });
        });
    }, delay);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [code, ready, delay]);

  // Still typing a too-short code — say nothing yet rather than nag.
  if (!ready) return { status: "idle" };
  if (latest?.code !== code) return { status: "loading" };
  return latest.preview
    ? { status: "found", preview: latest.preview }
    : { status: "error", error: latest.error };
}
