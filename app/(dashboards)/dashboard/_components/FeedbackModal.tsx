"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Bug01Icon,
  BubbleChatEditIcon,
  CheckmarkCircle02Icon,
  Idea01Icon,
  Message01Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ApiError } from "@/lib/api/errors";
import {
  FEEDBACK_MAX,
  FEEDBACK_MIN,
  submitFeedback,
  type FeedbackCategory,
} from "@/lib/api/feedback";
import { Modal } from "./Modal";

const CATEGORIES: { value: FeedbackCategory; label: string; icon: typeof Bug01Icon; prompt: string }[] = [
  {
    value: "bug",
    label: "Something's broken",
    icon: Bug01Icon,
    prompt: "What happened, and what did you expect to happen?",
  },
  {
    value: "idea",
    label: "Idea",
    icon: Idea01Icon,
    prompt: "What would make Duevy better for you?",
  },
  {
    value: "other",
    label: "Other",
    icon: Message01Icon,
    prompt: "Tell us anything — we read every message.",
  },
];

/**
 * "Send feedback" form (POST /feedback). Mounted only while open. The page it
 * was opened from is attached, so a bug report says where it happened.
 */
export function FeedbackModal({ onClose }: { onClose: () => void }) {
  const pathname = usePathname();
  const [category, setCategory] = useState<FeedbackCategory>("bug");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const length = message.trim().length;
  const tooShort = length < FEEDBACK_MIN;
  const active = CATEGORIES.find((c) => c.value === category)!;

  const send = async () => {
    if (tooShort || sending) return;
    setSending(true);
    try {
      await submitFeedback({ category, message: message.trim(), page: pathname ?? undefined });
      setSent(true);
    } catch (err) {
      toast.error(
        err instanceof ApiError
          ? err.message
          : "Couldn't send your feedback. Check your connection and try again.",
      );
    } finally {
      setSending(false);
    }
  };

  // Not while it's sending — closing would hide whether it went through.
  const close = () => !sending && onClose();

  if (sent) {
    return (
      <Modal title="Feedback sent" icon={BubbleChatEditIcon} onClose={onClose}>
        <div className="flex flex-col items-center text-center">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-brand/10 text-brand">
            <HugeiconsIcon icon={CheckmarkCircle02Icon} size={22} />
          </span>
          <p className="mt-4 text-sm font-semibold text-ink">Thanks for telling us</p>
          <p className="mt-1 text-xs leading-relaxed text-ink-soft">
            The Duevy team reads every message. If we need more detail, we&apos;ll reach you by email.
          </p>
          <Button variant="brand" size="pill" className="mt-6 w-full" onClick={onClose}>
            Done
          </Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title="Send feedback" icon={BubbleChatEditIcon} onClose={close}>
      <fieldset disabled={sending} className="flex min-w-0 flex-col gap-4">
        <div>
          <p id="feedback-category" className="text-xs font-medium text-ink">
            What&apos;s it about?
          </p>
          <div role="radiogroup" aria-labelledby="feedback-category" className="mt-2 grid grid-cols-3 gap-2">
            {CATEGORIES.map(({ value, label, icon }) => {
              const selected = value === category;
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setCategory(value)}
                  className={cn(
                    "flex cursor-pointer flex-col items-center gap-1.5 rounded-2xl border px-2 py-3 text-center text-[11px] font-semibold leading-tight transition-colors disabled:cursor-not-allowed",
                    selected
                      ? "border-brand bg-brand/5 text-brand"
                      : "border-cloud bg-paper/50 text-ink-soft hover:border-brand/40 hover:text-ink",
                  )}
                >
                  <HugeiconsIcon icon={icon} size={18} />
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label htmlFor="feedback-message" className="text-xs font-medium text-ink">
            {active.prompt}
          </label>
          <textarea
            id="feedback-message"
            autoFocus
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, FEEDBACK_MAX))}
            onKeyDown={(e) => {
              // ⌘/Ctrl + Enter sends.
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) void send();
            }}
            placeholder={
              category === "bug"
                ? "e.g. The pay button keeps spinning after I transfer."
                : category === "idea"
                  ? "e.g. Let me download all my receipts at once."
                  : "Your message"
            }
            className="mt-1.5 w-full resize-none rounded-2xl border border-cloud bg-canvas px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-ink-soft/70 focus:border-brand focus:ring-[3px] focus:ring-brand/15 disabled:opacity-60"
          />
          <div className="mt-1 flex justify-between text-[11px] text-ink-soft">
            <span>{length > 0 && tooShort ? `At least ${FEEDBACK_MIN} characters` : " "}</span>
            <span className="tabular-nums">
              {message.length}/{FEEDBACK_MAX}
            </span>
          </div>
        </div>

        <Button
          variant="brand"
          size="pill"
          className="w-full"
          disabled={tooShort || sending}
          aria-busy={sending || undefined}
          onClick={() => void send()}
        >
          {sending && (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          )}
          {sending ? "Sending…" : "Send feedback"}
        </Button>
      </fieldset>
    </Modal>
  );
}
