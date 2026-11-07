"use client";

import { useEffect, useId, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { FileAttachmentIcon, RefreshIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Shared pieces for the rep-verification reviews (application review and the
 * student ID / face capture / NIN queues): the spinner, the required-note form
 * and a viewer for private uploads behind short-lived signed links.
 */

/** Inline spinner for a button whose request is in flight. */
export function Spinner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-current/30 border-t-current",
        className,
      )}
    />
  );
}

/** Inline "write a reason, then confirm" form — replaces window.prompt. */
export function ReasonForm({
  label,
  placeholder,
  confirmLabel,
  busyLabel,
  busy,
  loading = false,
  onCancel,
  onConfirm,
}: {
  label: string;
  placeholder: string;
  confirmLabel: string;
  /** Shown on the confirm button while this form's request runs, e.g. "Rejecting…". */
  busyLabel: string;
  /** Any request on the modal is running — locks the form. */
  busy: boolean;
  /** This form's own request is running — spinner on its confirm button. */
  loading?: boolean;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");
  const id = useId();
  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-3 dark:border-rose-500/30 dark:bg-rose-500/10">
      <label htmlFor={id} className="text-xs font-medium text-ink">
        {label}
      </label>
      <textarea
        id={id}
        autoFocus
        value={reason}
        onChange={(e) => setReason(e.target.value.slice(0, 500))}
        rows={3}
        disabled={busy}
        placeholder={placeholder}
        className="mt-1.5 w-full rounded-xl border border-cloud bg-canvas px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-ink-soft/60 focus:border-brand focus:ring-2 focus:ring-brand/15"
      />
      <div className="mt-2 flex justify-end gap-2">
        <Button variant="brand-outline" size="pill" disabled={busy} onClick={onCancel}>
          Cancel
        </Button>
        <Button
          variant="danger-outline"
          size="pill"
          disabled={busy || !reason.trim()}
          aria-busy={loading || undefined}
          onClick={() => onConfirm(reason.trim())}
        >
          {loading && <Spinner />}
          {loading ? busyLabel : confirmLabel}
        </Button>
      </div>
    </div>
  );
}

/** Ticks every `intervalMs` so expiry checks re-render without calling Date.now() in render. */
function useNow(intervalMs: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

/**
 * Whether signed links fetched at `fetchedAt` (ms) with a TTL of `ttlSeconds`
 * have expired. Treated as expired a little early, so a link isn't opened
 * seconds before it stops working.
 */
export function useLinksExpired(fetchedAt: number, ttlSeconds: number | undefined) {
  const now = useNow(15_000);
  if (!fetchedAt || !ttlSeconds) return false;
  return now >= fetchedAt + Math.max(0, ttlSeconds - 30) * 1000;
}

/** Banner offering fresh links once the signed ones have expired. */
export function ExpiredLinksNotice({
  onRefresh,
  refreshing,
}: {
  onRefresh: () => void;
  refreshing: boolean;
}) {
  return (
    <div
      role="status"
      className="flex flex-col gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-xs text-amber-800 dark:text-amber-300">
        These private links have expired. Load fresh ones to view the files.
      </p>
      <Button variant="brand-outline" size="pill" disabled={refreshing} onClick={onRefresh}>
        <HugeiconsIcon icon={RefreshIcon} size={14} className={cn(refreshing && "animate-spin")} />
        Load fresh links
      </Button>
    </div>
  );
}

/**
 * A private KYC upload behind a signed, short-lived link: a photo, a short
 * video (face capture) or a PDF (student ID; shown as a link). If the link
 * has expired, or fails to load, it offers `onRefresh` instead.
 */
export function KycMedia({
  url,
  mimeType,
  kind,
  label,
  expired = false,
  onRefresh,
  refreshing = false,
  className,
}: {
  url: string | null;
  mimeType: string | null;
  /** `video` plays in a <video>; anything else renders as an image (or PDF link). */
  kind?: "photo" | "video" | null;
  /** Accessible name, e.g. "Face capture for Ada Obi". */
  label: string;
  expired?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
  className?: string;
}) {
  // Keyed by URL so a fresh link clears the failure.
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const failed = !!url && failedUrl === url;
  const box = cn(
    "flex min-h-48 flex-col overflow-hidden rounded-xl border border-cloud bg-white dark:bg-paper",
    className,
  );

  if (!url) {
    return (
      <div className={cn(box, "items-center justify-center p-6 text-center text-sm text-ink-soft")}>
        No file on record.
      </div>
    );
  }

  if (expired || failed) {
    return (
      <div className={cn(box, "items-center justify-center gap-3 p-6 text-center")}>
        <p className="text-sm text-ink-soft">
          {expired ? "This link has expired." : "This file couldn't be loaded — the link may have expired."}
        </p>
        {onRefresh && (
          <Button variant="brand-outline" size="pill" disabled={refreshing} onClick={onRefresh}>
            <HugeiconsIcon icon={RefreshIcon} size={14} className={cn(refreshing && "animate-spin")} />
            Load a fresh link
          </Button>
        )}
      </div>
    );
  }

  const isPdf = mimeType === "application/pdf";
  return (
    <div className={box}>
      <div className="grid flex-1 place-items-center bg-black/2">
        {isPdf ? (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="flex flex-col items-center gap-2 p-6 text-sm font-semibold text-brand hover:underline"
          >
            <HugeiconsIcon icon={FileAttachmentIcon} size={28} />
            Open PDF
          </a>
        ) : kind === "video" ? (
          <video
            src={url}
            controls
            playsInline
            preload="metadata"
            aria-label={label}
            onError={() => setFailedUrl(url)}
            className="max-h-80 w-full bg-black object-contain"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- signed, short-lived private URL
          <img
            src={url}
            alt={label}
            onError={() => setFailedUrl(url)}
            className="max-h-80 w-full object-contain"
          />
        )}
      </div>
      {!isPdf && (
        <div className="border-t border-cloud px-3 py-2">
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-semibold text-brand hover:underline"
          >
            Open full size
          </a>
        </div>
      )}
    </div>
  );
}

/** Formats a 0..1 (or 0..100) match score as a whole percent. */
export function formatMatchScore(score: number | null | undefined) {
  if (score === null || score === undefined || !Number.isFinite(score)) return "—";
  return `${Math.round(score <= 1 ? score * 100 : score)}%`;
}

export function formatDateTime(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
