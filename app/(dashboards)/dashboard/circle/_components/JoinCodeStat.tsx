"use client";

import { useState } from "react";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  SquareLock01Icon,
  Copy01Icon,
  CopyCheckIcon,
  Link04Icon,
  Tick02Icon,
  Share08Icon,
  ArrowReloadHorizontalIcon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { joinLink } from "./data";

/** Copy / copy-link / share / regenerate for a join code, shared by both layouts. */
function useJoinCodeActions(
  code: string,
  spaceName: string,
  onRegenerate: () => Promise<void>,
) {
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const link = joinLink(code);

  const regenerate = async () => {
    setRegenerating(true);
    try {
      await onRegenerate();
    } finally {
      setRegenerating(false);
    }
  };

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

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setLinkCopied(true);
      toast.success("Link copied", { description: link });
      setTimeout(() => setLinkCopied(false), 1600);
    } catch {
      toast.error("Couldn't copy — long-press to copy the link");
    }
  };

  const share = async () => {
    const message = `Join ${spaceName} on Duevy — tap the link to get added automatically: ${link}`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "Join on Duevy", text: message, url: link });
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

  return { copied, linkCopied, regenerating, copy, copyLink, share, regenerate };
}

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
  onRegenerate: () => Promise<void>;
}) {
  const { copied, linkCopied, regenerating, copy, copyLink, share, regenerate } =
    useJoinCodeActions(code, spaceName, onRegenerate);

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
          onClick={copyLink}
          title="Copy join link"
          aria-label="Copy join link"
          className="text-ink-soft hover:text-ink"
        >
          <HugeiconsIcon icon={linkCopied ? Tick02Icon : Link04Icon} size={14} />
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
          onClick={regenerate}
          disabled={regenerating}
          title="Regenerate code"
          aria-label="Regenerate code"
          className="text-ink-soft hover:text-ink"
        >
          {regenerating ? (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-ink-soft/30 border-t-ink-soft" />
          ) : (
            <HugeiconsIcon icon={ArrowReloadHorizontalIcon} size={14} />
          )}
        </Button>
      </div>
    </div>
  );
}

/**
 * Phone layout: the code beside the member count — tap the code to copy it,
 * with share / link / regenerate as small round buttons underneath.
 */
export function JoinCodeInline({
  code,
  spaceName,
  onRegenerate,
}: {
  code: string;
  spaceName: string;
  onRegenerate: () => Promise<void>;
}) {
  const { copied, linkCopied, regenerating, copy, copyLink, share, regenerate } =
    useJoinCodeActions(code, spaceName, onRegenerate);

  const iconBtn =
    "grid h-8 w-8 place-items-center rounded-full border border-cloud bg-canvas text-ink-soft transition-colors active:bg-paper disabled:opacity-60 cursor-pointer";

  return (
    <div className="flex shrink-0 flex-col items-end">
      <p className="text-xs font-medium text-ink-soft">Join code</p>
      <button
        type="button"
        onClick={copy}
        aria-label={`Copy join code ${code}`}
        className="mt-1 inline-flex items-center gap-1.5 rounded-xl border border-dashed border-brand/30 bg-cloud/50 px-2.5 py-1.5 transition-colors active:bg-cloud cursor-pointer"
      >
        <span className="font-mono text-sm font-semibold tracking-[0.15em] text-ink">{code}</span>
        <HugeiconsIcon
          icon={copied ? CopyCheckIcon : Copy01Icon}
          size={14}
          className="shrink-0 text-brand"
        />
      </button>
      <div className="mt-2 flex gap-1.5">
        <button type="button" onClick={share} aria-label="Share invite" className={iconBtn}>
          <HugeiconsIcon icon={Share08Icon} size={14} />
        </button>
        <button type="button" onClick={copyLink} aria-label="Copy join link" className={iconBtn}>
          <HugeiconsIcon icon={linkCopied ? Tick02Icon : Link04Icon} size={14} />
        </button>
        <button
          type="button"
          onClick={regenerate}
          disabled={regenerating}
          aria-label="Regenerate code"
          className={iconBtn}
        >
          {regenerating ? (
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-ink-soft/30 border-t-ink-soft" />
          ) : (
            <HugeiconsIcon icon={ArrowReloadHorizontalIcon} size={14} />
          )}
        </button>
      </div>
    </div>
  );
}
