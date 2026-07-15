"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Alert01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Modal } from "../../_components/Modal";
import { BRAND_INPUT } from "../../_components/form-styles";
import { archiveSpace } from "@/lib/api/rep";
import { ApiError } from "@/lib/api/errors";

export function ArchiveSpaceModal({
  spaceId,
  onClose,
  onDone,
}: {
  spaceId: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const [password, setPassword] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = password.length > 0;

  const submit = async () => {
    if (!valid) return;
    setSubmitting(true);
    setError(null);
    try {
      await archiveSpace(spaceId, { password, reason: reason || undefined });
      toast.success("Department archived", {
        description: "It's hidden from student search and join now.",
      });
      onDone();
    } catch (err) {
      if (err instanceof ApiError && err.code === "PENDING_PAYOUT") {
        setError("A payout is still processing — wait for it to settle first.");
      } else if (err instanceof ApiError && err.code === "HELD_BALANCE") {
        setError("There's an uncollected payout balance — pay it out first.");
      } else {
        setError(
          err instanceof ApiError ? err.message : "Couldn't archive the department.",
        );
      }
      setSubmitting(false);
    }
  };

  return (
    <Modal title="Archive department" icon={Alert01Icon} onClose={onClose}>
      <p className="text-[13px] leading-5 text-ink-soft">
        This permanently retires the department — it disappears from student
        search and join, and no new dues, join requests or votes are allowed.
        Existing records stay available to view.
      </p>

      <div className="mt-5 flex flex-col gap-4">
        <div>
          <Label className="block text-xs font-medium text-ink-soft">
            Confirm your password
          </Label>
          <Input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(null);
            }}
            className={cn(BRAND_INPUT, "mt-1.5")}
          />
        </div>
        <div>
          <Label className="block text-xs font-medium text-ink-soft">
            Reason <span className="font-normal text-ink-soft/70">(optional)</span>
          </Label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Semester ended"
            rows={2}
            className="mt-1.5 w-full resize-none rounded-2xl border border-cloud bg-canvas px-4 py-3 text-sm text-ink outline-none placeholder:text-ink-soft focus-visible:border-brand focus-visible:ring-[3px] focus-visible:ring-brand/15"
          />
        </div>

        {error && (
          <p className="rounded-2xl bg-rose-50 px-4 py-2.5 text-xs text-rose-600">{error}</p>
        )}
      </div>

      <Button
        variant="danger"
        size="pill-xl"
        disabled={!valid || submitting}
        onClick={submit}
        className="mt-6 w-full"
      >
        {submitting && (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
        )}
        {submitting ? "Archiving…" : "Archive department"}
      </Button>
    </Modal>
  );
}
