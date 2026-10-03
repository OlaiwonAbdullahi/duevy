"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ShieldIcon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  Alert01Icon,
  IdIcon,
  Upload01Icon,
} from "@hugeicons/core-free-icons";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BRAND_INPUT } from "../../_components/form-styles";
import { cn } from "@/lib/utils";
import { ApiError } from "@/lib/api/errors";
import {
  getKycStatus,
  submitKyc,
  resubmitStudentId,
  submitGovernmentId,
  MAX_KYC_DOCUMENT_BYTES,
} from "@/lib/api/payouts";
import type { KycState, SpaceKycStatus } from "@/lib/api/types";

const ACCEPTED_DOCUMENTS = "image/jpeg,image/png,image/webp,application/pdf";

type StepState = "todo" | "pending" | "done" | "failed";

const STEP_TONE: Record<StepState, string> = {
  todo: "bg-cloud text-ink-soft",
  pending: "bg-amber-100 text-amber-700",
  done: "bg-brand/10 text-brand",
  failed: "bg-rose-100 text-rose-600",
};

const STEP_ICON = {
  todo: Clock01Icon,
  pending: Clock01Icon,
  done: CheckmarkCircle02Icon,
  failed: Alert01Icon,
} as const;

/** Client-side mirror of the API's file rules, so the rep isn't sent back after uploading. */
function checkDocument(file: File | null): string | null {
  if (!file) return null;
  if (!ACCEPTED_DOCUMENTS.split(",").includes(file.type)) return "Use a JPEG, PNG, WebP or PDF file.";
  if (file.size > MAX_KYC_DOCUMENT_BYTES) return "Each file must be 5 MB or smaller.";
  return null;
}

function errorMessage(err: unknown, fallback: string) {
  if (!(err instanceof ApiError)) return fallback;
  switch (err.code) {
    case "FILE_TOO_LARGE":
      return "Each file must be 5 MB or smaller.";
    case "KYC_REJECTED":
      return "Those details weren't accepted. Check your NIN and date of birth and try again.";
    case "KYC_RETRY_LOCKED":
      return "Too many failed attempts. You can try again in 24 hours.";
    case "REP_NOT_APPROVED":
      return "Your rep application needs to be approved first.";
    default:
      return err.details?.[0]?.issue ?? err.message ?? fallback;
  }
}

/** "persons.per_x.bvn" → "your BVN"; anything document-like → "a government ID document". */
function describeRequirement(key: string) {
  const field = key.split(".").pop() ?? key;
  if (field === "bvn") return "your BVN";
  if (/document|verification|id_number|identity/i.test(field)) return "a government ID document";
  return field.replace(/_/g, " ");
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Rep verification. A space can only collect once its lead rep passes both
 * checks: Bachs verifies identity (NIN + date of birth), and a Duevy admin
 * reviews the rep's student ID card. Hidden once both have passed.
 */
export function OnboardingCard({
  spaceId,
  isLead,
  onChanged,
}: {
  spaceId: string;
  isLead: boolean;
  /** Called after a submission, so the page can refresh what depends on KYC. */
  onChanged?: () => void;
}) {
  const [status, setStatus] = useState<SpaceKycStatus | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    try {
      setStatus(await getKycStatus(spaceId));
    } catch {
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spaceId]);

  const apply = (next: KycState) => {
    // Only the lead's state is the space's state; a co-rep's submission is theirs alone.
    setStatus((s) => (s ? (isLead ? { ...s, ...next, mine: next } : { ...s, mine: next }) : s));
    onChanged?.();
  };

  if (loading) {
    return <div className="h-56 animate-pulse rounded-3xl border border-cloud bg-canvas" />;
  }
  // Stay visible until withdrawals open: Bachs can still ask for documents
  // (`requirementsDue`) after collection is enabled.
  if (!status || status.canWithdraw) return null;

  // Collections settle to the lead rep, so it's their verification that counts.
  const kyc = isLead ? status.mine : status;
  const identity: StepState =
    kyc.kycStatus === "verified"
      ? "done"
      : kyc.kycStatus === "rejected"
        ? "failed"
        : kyc.kycStatus === "pending" && kyc.providerReference
          ? "pending"
          : "todo";
  const studentId: StepState =
    kyc.studentId.status === "approved"
      ? "done"
      : kyc.studentId.status === "rejected"
        ? "failed"
        : kyc.studentId.status === "pending"
          ? "pending"
          : "todo";

  // The API takes a fresh submission only when nothing is with Bachs yet, or it refused the last one.
  const canSubmit = identity === "todo" || identity === "failed";
  const lockedUntil =
    kyc.retryLockedUntil && new Date(kyc.retryLockedUntil) > new Date() ? kyc.retryLockedUntil : null;

  return (
    <section className="rounded-3xl border border-cloud bg-canvas p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-cloud text-brand">
          <HugeiconsIcon icon={ShieldIcon} size={16} />
        </span>
        <div>
          <h2 className="text-base font-semibold tracking-tight text-ink">
            Verify to start collecting
          </h2>
          <p className="mt-0.5 text-xs text-ink-soft">
            {isLead
              ? "Students can pay your dues once your identity and student ID are both verified."
              : "Students can pay this space's dues once the lead rep finishes verification."}
          </p>
        </div>
      </div>

      <ul className="mt-4 flex flex-col gap-2">
        <Step
          label="Identity (NIN)"
          state={identity}
          detail={
            identity === "pending"
              ? "Our payment partner is checking your details."
              : identity === "failed"
                ? kyc.rejectionReason ?? "Verification failed. Check your details and try again."
                : identity === "done"
                  ? "Verified."
                  : "Not submitted yet."
          }
        />
        <Step
          label="Student ID card"
          state={studentId}
          detail={
            studentId === "pending"
              ? `A Duevy admin is reviewing it${kyc.studentId.uploadedAt ? ` (sent ${formatTime(kyc.studentId.uploadedAt)})` : ""}.`
              : studentId === "failed"
                ? kyc.studentId.reviewNote ?? "It wasn't accepted. Upload a clearer photo."
                : studentId === "done"
                  ? "Approved."
                  : "Not submitted yet."
          }
        />
      </ul>

      {isLead && lockedUntil && (
        <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-xs text-rose-600">
          Too many failed attempts. You can try again after {formatTime(lockedUntil)}.
        </p>
      )}

      {isLead && canSubmit && !lockedUntil && <KycForm spaceId={spaceId} onSubmitted={apply} />}

      {isLead && !canSubmit && studentId !== "pending" && studentId !== "done" && (
        <DocumentUpload
          title="Upload a new student ID card"
          hint="A clear photo or scan showing your name, photo and matric number."
          action="Send for review"
          onUpload={async (file) => {
            const next = await resubmitStudentId(spaceId, file);
            toast.success("Student ID sent for review");
            apply(next);
          }}
        />
      )}

      {isLead && !canSubmit && kyc.requirementsDue.length > 0 && (
        <DocumentUpload
          title="More details needed"
          hint={`Our payment partner has asked for ${[...new Set(kyc.requirementsDue.map(describeRequirement))].join(", ")}.${
            kyc.governmentIdSubmittedAt ? ` You sent an ID on ${formatTime(kyc.governmentIdSubmittedAt)}.` : ""
          } Upload a government ID (NIN slip, passport, driver's licence or voter's card). If it asks for your BVN, contact support.`}
          action="Send ID document"
          onUpload={async (file) => {
            const next = await submitGovernmentId(spaceId, file);
            toast.success("ID document sent");
            apply(next);
          }}
        />
      )}
    </section>
  );
}

function Step({ label, state, detail }: { label: string; state: StepState; detail: string }) {
  return (
    <li className="flex items-start gap-3 rounded-2xl border border-cloud bg-paper/50 px-4 py-3">
      <span className={cn("mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full", STEP_TONE[state])}>
        <HugeiconsIcon icon={STEP_ICON[state]} size={13} />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-ink">{label}</p>
        <p className="mt-0.5 text-[11px] leading-relaxed text-ink-soft">{detail}</p>
      </div>
    </li>
  );
}

function FileField({
  label,
  hint,
  onChange,
  error,
  disabled,
  inputRef,
}: {
  label: string;
  hint: string;
  onChange: (file: File | null) => void;
  error: string | null;
  disabled?: boolean;
  inputRef?: React.Ref<HTMLInputElement>;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-ink">{label}</p>
      <p className="mt-0.5 text-[11px] text-ink-soft">{hint}</p>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_DOCUMENTS}
        disabled={disabled}
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        className="mt-2 w-full rounded-2xl border border-dashed border-cloud bg-canvas px-3 py-2.5 text-xs text-ink-soft file:mr-3 file:rounded-full file:border-0 file:bg-cloud file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-ink"
      />
      {error && <p className="mt-1 text-[11px] font-medium text-rose-600">{error}</p>}
    </div>
  );
}

/** Local number (080…) or +234…, as the API's `+234` + 10 digits; "" when blank. */
function normalisePhone(raw: string) {
  const digits = raw.replace(/[^0-9]/g, "");
  if (!digits) return "";
  if (digits.startsWith("234")) return `+${digits}`;
  if (digits.startsWith("0")) return `+234${digits.slice(1)}`;
  return `+234${digits}`;
}

function KycForm({ spaceId, onSubmitted }: { spaceId: string; onSubmitted: (state: KycState) => void }) {
  const [nin, setNin] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState<"" | "male" | "female">("");
  const [phone, setPhone] = useState("");
  const [studentIdCard, setStudentIdCard] = useState<File | null>(null);
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const normalisedPhone = normalisePhone(phone);
  const phoneValid = !normalisedPhone || /^\+234\d{10}$/.test(normalisedPhone);
  const fileError = checkDocument(studentIdCard);

  const valid =
    /^\d{11}$/.test(nin) && !!dob && !!gender && !!studentIdCard && !fileError && phoneValid && consent;

  const submit = async () => {
    if (!valid || !studentIdCard || !gender) return;
    setSubmitting(true);
    try {
      const next = await submitKyc(spaceId, {
        nin,
        dob,
        gender,
        studentIdCard,
        phone: normalisedPhone || undefined,
      });
      toast.success("Verification submitted", {
        description: "We'll notify you as each check completes.",
      });
      onSubmitted(next);
    } catch (err) {
      toast.error(errorMessage(err, "Couldn't submit your verification."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-5 flex flex-col gap-4 rounded-2xl border border-cloud bg-paper/50 p-4">
      <div>
        <label className="flex items-center gap-1.5 text-xs font-medium text-ink">
          <HugeiconsIcon icon={IdIcon} size={14} />
          NIN
        </label>
        <Input
          value={nin}
          onChange={(e) => setNin(e.target.value.replace(/[^0-9]/g, "").slice(0, 11))}
          placeholder="11-digit National Identification Number"
          inputMode="numeric"
          autoComplete="off"
          disabled={submitting}
          className={cn(BRAND_INPUT, "mt-1.5 tabular-nums")}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs font-medium text-ink">Date of birth</label>
          <Input
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            max={new Date().toISOString().slice(0, 10)}
            disabled={submitting}
            className={cn(BRAND_INPUT, "mt-1.5")}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-ink">Gender</label>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value as "male" | "female")}
            disabled={submitting}
            className={cn(BRAND_INPUT, "mt-1.5 w-full")}
          >
            <option value="" disabled>
              Select
            </option>
            <option value="female">Female</option>
            <option value="male">Male</option>
          </select>
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-ink">Phone (optional)</label>
        <Input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="0801 234 5678"
          inputMode="tel"
          disabled={submitting}
          className={cn(BRAND_INPUT, "mt-1.5 tabular-nums")}
        />
        {!phoneValid && (
          <p className="mt-1 text-[11px] font-medium text-rose-600">Enter an 11-digit Nigerian number.</p>
        )}
      </div>

      <FileField
        label="Student ID card"
        hint="A clear photo or scan showing your name, photo and matric number. JPEG, PNG, WebP or PDF, up to 5 MB."
        onChange={setStudentIdCard}
        error={fileError}
        disabled={submitting}
      />

      <label className="flex items-start gap-2 text-[11px] leading-relaxed text-ink-soft">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          disabled={submitting}
          className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-cloud accent-brand"
        />
        I confirm this is my own NIN and consent to Bachs checking it against the national
        identity database. Duevy doesn&apos;t store my NIN or date of birth; my student ID is
        kept privately for review.
      </label>

      <Button variant="brand" size="pill" className="w-full" disabled={!valid || submitting} onClick={submit}>
        {submitting ? "Submitting…" : "Submit for verification"}
      </Button>
    </div>
  );
}

function DocumentUpload({
  title,
  hint,
  action,
  onUpload,
}: {
  title: string;
  hint: string;
  action: string;
  onUpload: (file: File) => Promise<void>;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const error = checkDocument(file);

  const upload = async () => {
    if (!file || error) return;
    setUploading(true);
    try {
      await onUpload(file);
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
    } catch (err) {
      toast.error(errorMessage(err, "Couldn't upload this document."));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-cloud bg-paper/50 p-4">
      <FileField
        label={title}
        hint={hint}
        onChange={setFile}
        error={error}
        disabled={uploading}
        inputRef={inputRef}
      />
      <Button variant="brand-outline" size="pill" disabled={!file || !!error || uploading} onClick={upload}>
        <HugeiconsIcon icon={Upload01Icon} size={14} />
        {uploading ? "Uploading…" : action}
      </Button>
    </div>
  );
}
