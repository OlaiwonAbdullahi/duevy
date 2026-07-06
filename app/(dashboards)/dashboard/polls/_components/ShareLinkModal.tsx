"use client";

import { useState } from "react";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowUpRight01Icon,
  Copy01Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { Modal } from "../../_components/Modal";
import { naira, voteLink } from "./data";
import type { Poll } from "./types";

export function ShareLinkModal({
  poll,
  onClose,
}: {
  poll: Poll;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const link = voteLink(poll.slug);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success("Voting link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy — copy it manually");
    }
  };

  return (
    <Modal title="Share voting link" icon={Copy01Icon} onClose={onClose}>
      <p className="text-[13px] text-ink-soft">
        Send this link to students so they can vote in{" "}
        <span className="font-semibold text-ink">{poll.title}</span>. It opens
        the ballot for every award you added.
      </p>

      <div className="mt-4 flex items-center gap-2 rounded-2xl border border-cloud bg-paper px-4 py-3">
        <span className="min-w-0 flex-1 truncate text-sm text-ink">{link}</span>
        <button
          type="button"
          onClick={copy}
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-brand px-4 text-xs font-semibold text-white transition-colors duration-300 hover:bg-brand-bright cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        >
          <HugeiconsIcon icon={copied ? Tick02Icon : Copy01Icon} size={14} />
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-cloud bg-canvas text-sm font-semibold text-ink transition-colors duration-300 hover:bg-paper cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
      >
        <HugeiconsIcon icon={ArrowUpRight01Icon} size={16} />
        Open ballot preview
      </a>

      <p className="mt-3 text-[11px] text-ink-soft">
        {poll.membersOnly
          ? "Only verified department members can vote — one vote per award."
          : "Anyone with this link can vote."}
        {poll.paid
          ? ` Each vote costs ${naira(poll.amountPerVote)}.`
          : " Voting is free."}
      </p>
    </Modal>
  );
}
