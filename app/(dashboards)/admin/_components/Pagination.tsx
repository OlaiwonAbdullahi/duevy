"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import type { ApiMeta } from "@/lib/api/admin";

/** Prev / next for a server-paginated list, driven by the envelope's `meta`. */
export function Pagination({
  meta,
  page,
  onPageChange,
  disabled = false,
}: {
  meta: ApiMeta | undefined;
  page: number;
  onPageChange: (next: number) => void;
  disabled?: boolean;
}) {
  const totalPages = Math.max(1, meta?.totalPages ?? 1);
  const total = meta?.total;
  if (totalPages <= 1) {
    return total ? (
      <p className="mt-3 text-xs text-ink-soft">
        {total} result{total === 1 ? "" : "s"}
      </p>
    ) : null;
  }
  return (
    <nav aria-label="Pagination" className="mt-3 flex items-center justify-between gap-3">
      <p className="text-xs text-ink-soft">
        Page {page} of {totalPages}
        {total !== undefined && ` · ${total} result${total === 1 ? "" : "s"}`}
      </p>
      <div className="flex gap-2">
        <Button
          variant="brand-outline"
          size="pill"
          disabled={disabled || page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={14} />
          Previous
        </Button>
        <Button
          variant="brand-outline"
          size="pill"
          disabled={disabled || page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
          <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
        </Button>
      </div>
    </nav>
  );
}
