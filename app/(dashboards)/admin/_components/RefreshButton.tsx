"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { RefreshIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Header button that reloads a page's data; the icon spins while it loads. */
export default function RefreshButton({
  onClick,
  loading = false,
}: {
  onClick: () => void;
  loading?: boolean;
}) {
  return (
    <Button variant="brand-outline" size="pill" onClick={onClick} disabled={loading}>
      <HugeiconsIcon icon={RefreshIcon} size={14} className={cn(loading && "animate-spin")} />
      Refresh
    </Button>
  );
}
