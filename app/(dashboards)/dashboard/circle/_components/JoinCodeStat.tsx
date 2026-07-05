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
import { REP_SPACE } from "../../create-dues/_components/data";

/**
 * The join code as a stat card — carries its own copy / share / regenerate
 * actions so access lives in one place instead of a separate full-width panel.
 */
export function JoinCodeStat({
  code,
  onRegenerate,
}: {
  code: string;
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
    const message = `Join ${REP_SPACE.name} on Duevy. Open the app, tap "Join a department" and enter code ${code}.`;
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

  const regenerate = () => {
    onRegenerate();
    toast.success("New code generated", {
      description: "The old code no longer works.",
    });
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
        <button
          type="button"
          onClick={copy}
          className="inline-flex h-8 items-center justify-center gap-1.5 rounded-full bg-brand px-3 text-[11px] font-semibold text-white transition-colors duration-300 hover:bg-brand-bright cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        >
          <HugeiconsIcon icon={copied ? CopyCheckIcon : Copy01Icon} size={13} />
          {copied ? "Copied" : "Copy"}
        </button>
        <button
          type="button"
          onClick={share}
          title="Share invite"
          aria-label="Share invite"
          className="grid h-8 w-8 place-items-center rounded-full border border-cloud text-ink-soft transition-colors duration-300 hover:bg-paper hover:text-ink cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        >
          <HugeiconsIcon icon={Share08Icon} size={14} />
        </button>
        <button
          type="button"
          onClick={regenerate}
          title="Regenerate code"
          aria-label="Regenerate code"
          className="grid h-8 w-8 place-items-center rounded-full border border-cloud text-ink-soft transition-colors duration-300 hover:bg-paper hover:text-ink cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        >
          <HugeiconsIcon icon={ArrowReloadHorizontalIcon} size={14} />
        </button>
      </div>
    </div>
  );
}
