"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Shield01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Modal } from "../../_components/Modal";
import { BRAND_INPUT } from "../../_components/form-styles";
import { changePassword } from "@/lib/api/me";
import { ApiError } from "@/lib/api/errors";

export function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;
  const valid =
    currentPassword.length > 0 && newPassword.length >= 8 && newPassword === confirmPassword;

  const submit = async () => {
    if (!valid) return;
    setSubmitting(true);
    setError(null);
    try {
      await changePassword({ currentPassword, newPassword });
      toast.success("Password changed", {
        description: "You'll stay logged in here — other devices have been signed out.",
      });
      onClose();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Couldn't change your password. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title="Change password" icon={Shield01Icon} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <div>
          <Label className="block text-xs font-medium text-ink-soft">
            Current password
          </Label>
          <Input
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => {
              setCurrentPassword(e.target.value);
              setError(null);
            }}
            className={cn(BRAND_INPUT, "mt-1.5")}
          />
        </div>
        <div>
          <Label className="block text-xs font-medium text-ink-soft">
            New password
          </Label>
          <Input
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className={cn(BRAND_INPUT, "mt-1.5")}
          />
          <p className="mt-1.5 text-[11px] text-ink-soft">At least 8 characters.</p>
        </div>
        <div>
          <Label className="block text-xs font-medium text-ink-soft">
            Confirm new password
          </Label>
          <Input
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={cn(BRAND_INPUT, "mt-1.5")}
          />
          {mismatch && (
            <p className="mt-1.5 text-[11px] text-rose-600">Passwords don&apos;t match.</p>
          )}
        </div>

        {error && (
          <p className="rounded-2xl bg-rose-50 px-4 py-2.5 text-xs text-rose-600">{error}</p>
        )}
      </div>

      <Button
        variant="brand"
        size="pill-xl"
        disabled={!valid || submitting}
        onClick={submit}
        className="mt-6 w-full"
      >
        {submitting && (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
        )}
        {submitting ? "Changing…" : "Change password"}
      </Button>
    </Modal>
  );
}
