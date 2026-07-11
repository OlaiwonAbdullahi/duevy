"use client";

import { useState } from "react";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  SquareLock01Icon,
  Copy01Icon,
  CopyCheckIcon,
  Share08Icon,
  ArrowReloadHorizontalIcon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";

/**
 * The join code as a stat card — carries its own copy / share / regenerate
 * actions so access lives in one place instead of a separate full-width panel.
 */
export function JoinCodeStat({
  code,
  spaceName,
  onRegenerate,
}: {
  code: string;
  spaceName: string;
  onRegenerate: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("Code copied", { description: code });
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error("Couldn't copy — long-press to copy the code");
    }
  };

  const share = async () => {
    const message = `Join ${spaceName} on Duevy. Open the app, tap "Join a department" and enter code ${code}.`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "Join on Duevy", text: message });
        return;
      } catch {
        // Share sheet dismissed — fall through to clipboard.
      }
    }
    try {
      await navigator.clipboard.writeText(message);
      toast.success("Invite copied", {
        description: "Paste it into your class group chat.",
      });
    } catch {
      toast.error("Couldn't share right now");
    }
  };

  return (
    <div className="rounded-3xl border border-cloud bg-canvas p-5">
      <div className="mb-3 grid h-9 w-9 place-items-center rounded-full bg-cloud text-brand">
        <HugeiconsIcon icon={SquareLock01Icon} size={18} />
      </div>
      <p className="text-xs font-medium text-ink-soft">Join code</p>
      <p className="mt-1 text-xl font-semibold tracking-[0.2em] text-ink tabular-nums">
        {code}
      </p>

      <div className="mt-3 flex items-center gap-1.5">
        <Button
          variant="brand"
          size="xs"
          onClick={copy}
          className="h-8 px-3 text-[11px] font-semibold"
        >
          <HugeiconsIcon icon={copied ? CopyCheckIcon : Copy01Icon} size={13} />
          {copied ? "Copied" : "Copy"}
        </Button>
        <Button
          variant="brand-outline"
          size="icon-sm"
          onClick={share}
          title="Share invite"
          aria-label="Share invite"
          className="text-ink-soft hover:text-ink"
        >
          <HugeiconsIcon icon={Share08Icon} size={14} />
        </Button>
        <Button
          variant="brand-outline"
          size="icon-sm"
          onClick={onRegenerate}
          title="Regenerate code"
          aria-label="Regenerate code"
          className="text-ink-soft hover:text-ink"
        >
          <HugeiconsIcon icon={ArrowReloadHorizontalIcon} size={14} />
        </Button>
      </div>
    </div>
  );
}
