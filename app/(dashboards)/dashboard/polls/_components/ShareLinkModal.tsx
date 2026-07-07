"use client";

import { useState } from "react";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowUpRight01Icon,
  Copy01Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
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
        <Button variant="brand" size="pill" onClick={copy} className="shrink-0">
          <HugeiconsIcon icon={copied ? Tick02Icon : Copy01Icon} size={14} />
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>

      <Button
        variant="brand-outline"
        size="pill-lg"
        asChild
        className="mt-3 w-full"
      >
        <a href={link} target="_blank" rel="noopener noreferrer">
          <HugeiconsIcon icon={ArrowUpRight01Icon} size={16} />
          Open ballot preview
        </a>
      </Button>

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
