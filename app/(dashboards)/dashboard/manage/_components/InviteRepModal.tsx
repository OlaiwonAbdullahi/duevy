"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Mail01Icon, Shield01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Modal } from "../../_components/Modal";
import { BRAND_INPUT } from "../../_components/form-styles";

const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function InviteRepModal({
  onClose,
  onInvite,
}: {
  onClose: () => void;
  onInvite: (email: string) => Promise<void>;
}) {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const valid = EMAIL_PATTERN.test(email.trim());

  const submit = async () => {
    if (!valid || submitting) return;
    setSubmitting(true);
    try {
      await onInvite(email.trim());
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title="Invite a co-rep" icon={Shield01Icon} onClose={onClose}>
      <p className="text-xs leading-relaxed text-ink-soft">
        They&apos;ll need an existing Duevy account with this email. Once invited,
        they can help manage dues, collections, and payouts for this department.
      </p>

      <div className="mt-4">
        <Label className="block text-xs font-medium text-ink-soft">Email address</Label>
        <div className="relative mt-1.5">
          <HugeiconsIcon
            icon={Mail01Icon}
            size={16}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft"
          />
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="rep@school.edu.ng"
            autoFocus
            className={cn(BRAND_INPUT, "pl-10")}
          />
        </div>
      </div>

      <Button
        variant="brand"
        size="pill-xl"
        disabled={!valid || submitting}
        onClick={submit}
        className="mt-6 w-full"
      >
        {submitting ? "Sending invite…" : "Send invite"}
      </Button>
    </Modal>
  );
}
