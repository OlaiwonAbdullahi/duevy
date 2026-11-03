"use client";

import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CheckmarkCircle02Icon,
  Copy01Icon,
  Link01Icon,
  Share08Icon,
  Tick02Icon,
  UserMultipleIcon,
  WhatsappIcon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { guestPayPath } from "@/lib/api/guest";
import { siteOrigin } from "@/lib/site-url";
import { Modal } from "../../_components/Modal";
import { CATEGORY_LABEL, checkoutFee } from "../../dues/_components/data";
import { editableGuestFields } from "./GuestFormBuilder";
import { naira } from "./data";
import type { RepDue } from "./types";

/** "Fri, 14 Nov 2026" from the due's yyyy-mm-dd deadline. */
function longDate(ymd: string) {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y!, m! - 1, d!).toLocaleDateString("en-NG", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

/**
 * A due's details and its pay link: shown straight after it's published, and
 * again from its Share action. With a pay link the rep can copy it or send it
 * straight to WhatsApp (where class groups live) with a ready-written message;
 * a members-only due explains where members pay instead.
 */
export function DueShareModal({
  due,
  spaceName,
  justPublished = false,
  onClose,
  onViewCollections,
}: {
  due: RepDue;
  spaceName: string;
  /** Opened by publishing (vs. reopened later): leads with the confirmation. */
  justPublished?: boolean;
  onClose: () => void;
  onViewCollections?: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const link = `${siteOrigin()}${guestPayPath(due.id)}`;
  const fee = checkoutFee(due.amount);
  const deadline = longDate(due.dueDate);
  const questions = editableGuestFields(due.guestFields);
  const asks = ["Full name", "Email", "Matric number", ...questions.map((f) => (f.required ? f.label : `${f.label} (optional)`))];

  // What lands in the chat: the essentials, then the link.
  const message = `Pay for ${due.title} (${naira(due.amount)}) — ${spaceName}. Due ${deadline}. No Duevy account needed:\n${link}`;
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(message)}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success("Pay link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy — select it and copy manually.");
    }
  };

  return (
    <Modal title={justPublished ? "Due published" : "Share due"} icon={justPublished ? CheckmarkCircle02Icon : Share08Icon} onClose={onClose}>
      {justPublished && (
        <p className="-mt-3 mb-4 text-[13px] leading-relaxed text-ink-soft">
          <span className="font-semibold text-ink">{due.title}</span> is live.
          {due.memberCount > 0
            ? ` ${due.memberCount.toLocaleString("en-NG")} member${due.memberCount === 1 ? " was" : "s were"} notified and can pay from their dues.`
            : " Members can pay it from their dues."}
          {due.allowGuests && " Share the link below so anyone else can pay too."}
        </p>
      )}

      {/* The details. */}
      <dl className="flex flex-col gap-2 rounded-2xl border border-cloud bg-paper/50 p-4 text-xs">
        <Detail label="Due">{due.title}</Detail>
        <Detail label="Type">{CATEGORY_LABEL[due.category]}</Detail>
        <Detail label="Amount">{naira(due.amount)}</Detail>
        <Detail label="Each payer pays">
          {naira(due.amount + fee)} <span className="font-normal text-ink-soft">incl. {naira(fee)} fee</span>
        </Detail>
        <Detail label="Deadline">{deadline}</Detail>
        <Detail label="Who can pay">{due.allowGuests ? "Anyone with the link" : `Members of ${spaceName}`}</Detail>
        {due.allowGuests && <Detail label="Form asks">{asks.join(", ")}</Detail>}
      </dl>

      {due.allowGuests ? (
        <>
          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-cloud bg-canvas p-1.5 pl-4">
            <HugeiconsIcon icon={Link01Icon} size={14} className="shrink-0 text-ink-soft" />
            <p className="min-w-0 flex-1 truncate font-mono text-xs text-ink">{link}</p>
            <Button variant="brand" size="pill" onClick={() => void copy()} className="shrink-0">
              <HugeiconsIcon icon={copied ? Tick02Icon : Copy01Icon} size={14} />
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>

          <Button variant="brand-outline" size="pill-lg" asChild className="mt-3 w-full">
            <a href={whatsapp} target="_blank" rel="noopener noreferrer">
              <HugeiconsIcon icon={WhatsappIcon} size={18} className="text-[#25D366]" />
              Share on WhatsApp
            </a>
          </Button>
        </>
      ) : (
        <p className="mt-4 rounded-2xl bg-cloud/60 p-3 text-xs leading-relaxed text-ink-soft">
          This due has no pay link, so only members can pay it — from their Dues page in Duevy. To share it
          with anyone, edit the due and turn on <span className="font-medium text-ink">Pay link &amp; form</span>.
        </p>
      )}

      <div className={cn("mt-6 grid gap-2", onViewCollections && "sm:grid-cols-2")}>
        {onViewCollections && (
          <Button variant="brand-outline" size="pill-lg" onClick={onViewCollections}>
            <HugeiconsIcon icon={UserMultipleIcon} size={16} />
            View collections
          </Button>
        )}
        <Button variant="brand" size="pill-lg" onClick={onClose}>
          Done
        </Button>
      </div>
    </Modal>
  );
}

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="shrink-0 text-ink-soft">{label}</dt>
      <dd className="min-w-0 text-right font-medium text-ink">{children}</dd>
    </div>
  );
}
