"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ShieldIcon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  Upload01Icon,
  IdIcon,
} from "@hugeicons/core-free-icons";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BRAND_INPUT } from "../../_components/form-styles";
import { cn } from "@/lib/utils";
import { ApiError } from "@/lib/api/errors";
import {
  getOnboardingStatus,
  getIdentityMethods,
  uploadOnboardingDocument,
  submitNin,
  submitOnboarding,
} from "@/lib/api/payouts";
import type { OnboardingStatus, IdentityMethods } from "@/lib/api/types";

const SETUP_LABEL: Record<OnboardingStatus["setupStatus"], string> = {
  incomplete: "Setup needed",
  awaiting_review: "Under review",
  complete: "Complete",
};

const SETUP_TONE: Record<OnboardingStatus["setupStatus"], string> = {
  incomplete: "bg-amber-100 text-amber-700",
  awaiting_review: "bg-cloud text-ink-soft",
  complete: "bg-brand/10 text-brand",
};

/**
 * Bachs connected-account onboarding — lightweight MVP. Not a dynamic
 * checklist renderer (the backend's own field shapes there aren't fully
 * confirmed yet); just a document upload, NIN identity verification, and a
 * "submit for review" action, gated behind the space's live status.
 */
export function OnboardingCard({ spaceId }: { spaceId: string }) {
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [identity, setIdentity] = useState<IdentityMethods | null>(null);
  const [loading, setLoading] = useState(true);

  const [scope, setScope] = useState("identity_document");
  const [uploading, setUploading] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [nin, setNin] = useState("");
  const [consent, setConsent] = useState(false);
  const [verifyingNin, setVerifyingNin] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  async function refresh() {
    try {
      const [s, i] = await Promise.all([
        getOnboardingStatus(spaceId),
        getIdentityMethods(spaceId).catch(() => null),
      ]);
      setStatus(s);
      setIdentity(i);
    } catch {
      // No connected account yet — treat as "not started", first upload/submit creates one.
      setStatus({ setupStatus: "incomplete", transfersActive: false, payoutsActive: false });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spaceId]);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      await uploadOnboardingDocument(spaceId, file, scope);
      setUploadedCount((n) => n + 1);
      toast.success("Document uploaded");
      refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't upload this document.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleVerifyNin = async () => {
    if (!consent || nin.trim().length < 10) return;
    setVerifyingNin(true);
    try {
      const result = await submitNin(spaceId, nin.trim(), true);
      if (result.status === "verified") {
        toast.success("Identity verified");
      } else if (result.status === "pending") {
        toast.info("Identity check submitted", { description: "We'll update this once it's confirmed." });
      } else {
        toast.error(result.reason ?? "Couldn't verify that NIN.");
      }
      refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't verify your NIN.");
    } finally {
      setVerifyingNin(false);
    }
  };

  const handleSubmitForReview = async () => {
    setSubmitting(true);
    try {
      const result = await submitOnboarding(spaceId, {}, false);
      if (result.errors?.length) {
        toast.error(result.errors[0]?.issue ?? "Some information is still missing.");
      } else {
        toast.success("Submitted for review");
      }
      refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't submit for review.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="h-56 animate-pulse rounded-3xl border border-cloud bg-canvas" />;
  }
  if (!status || status.setupStatus === "complete") return null;

  return (
    <section className="rounded-3xl border border-cloud bg-canvas p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-cloud text-brand">
            <HugeiconsIcon icon={ShieldIcon} size={16} />
          </span>
          <div>
            <h2 className="text-base font-semibold tracking-tight text-ink">
              Connect payouts
            </h2>
            <p className="mt-0.5 text-xs text-ink-soft">
              A few details Bachs needs before withdrawals can go out.
            </p>
          </div>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold",
            SETUP_TONE[status.setupStatus],
          )}
        >
          {SETUP_LABEL[status.setupStatus]}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <StatusChip label="Transfers" active={status.transfersActive} />
        <StatusChip label="Payouts" active={status.payoutsActive} />
      </div>

      {/* Document upload */}
      <div className="mt-5 rounded-2xl border border-cloud bg-paper/50 p-4">
        <p className="text-xs font-semibold text-ink">Verification document</p>
        <p className="mt-0.5 text-[11px] text-ink-soft">
          A government ID or proof of address for the department&apos;s rep.
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <select
            value={scope}
            onChange={(e) => setScope(e.target.value)}
            className={cn(BRAND_INPUT, "sm:w-48")}
          >
            <option value="identity_document">Government ID</option>
            <option value="proof_of_address">Proof of address</option>
          </select>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
            }}
            className="flex-1 rounded-2xl border border-dashed border-cloud bg-canvas px-3 py-2.5 text-xs text-ink-soft file:mr-3 file:rounded-full file:border-0 file:bg-cloud file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-ink"
          />
        </div>
        {uploadedCount > 0 && (
          <p className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-brand">
            <HugeiconsIcon icon={Upload01Icon} size={13} />
            {uploadedCount} document{uploadedCount === 1 ? "" : "s"} uploaded this session
          </p>
        )}
      </div>

      {/* NIN identity verification */}
      {identity?.ninAvailable && (
        <div className="mt-4 rounded-2xl border border-cloud bg-paper/50 p-4">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-ink">
            <HugeiconsIcon icon={IdIcon} size={14} />
            Identity verification (NIN)
          </p>
          <Input
            value={nin}
            onChange={(e) => setNin(e.target.value.replace(/[^0-9]/g, "").slice(0, 11))}
            placeholder="11-digit NIN"
            inputMode="numeric"
            className={cn(BRAND_INPUT, "mt-2 tabular-nums")}
          />
          <label className="mt-3 flex items-start gap-2 text-[11px] leading-relaxed text-ink-soft">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-cloud accent-brand"
            />
            I confirm this is my own NIN and consent to Bachs checking it against the
            national identity database to verify my department&apos;s payout account.
          </label>
          <Button
            variant="brand-outline"
            size="pill"
            className="mt-3"
            disabled={!consent || nin.length < 10 || verifyingNin}
            onClick={handleVerifyNin}
          >
            {verifyingNin ? "Verifying…" : "Verify identity"}
          </Button>
        </div>
      )}

      <Button
        variant="brand"
        size="pill"
        className="mt-5 w-full"
        disabled={submitting}
        onClick={handleSubmitForReview}
      >
        {submitting ? "Submitting…" : "Submit for review"}
      </Button>
    </section>
  );
}

function StatusChip({ label, active }: { label: string; active: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold",
        active ? "bg-brand/10 text-brand" : "bg-cloud text-ink-soft",
      )}
    >
      <HugeiconsIcon icon={active ? CheckmarkCircle02Icon : Clock01Icon} size={12} />
      {label} {active ? "active" : "pending"}
    </span>
  );
}
