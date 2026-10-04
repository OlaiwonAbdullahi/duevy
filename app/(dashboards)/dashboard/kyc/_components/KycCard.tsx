"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ShieldIcon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  Alert01Icon,
  IdIcon,
  Upload01Icon,
  CloudUploadIcon,
  Pdf01Icon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BRAND_INPUT } from "../../_components/form-styles";
import { DateOfBirthPicker } from "../../_components/DateOfBirthPicker";
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
 * reviews the rep's student ID card. Shows a verified state once both pass.
 */
export function KycCard({
  spaceId,
  isLead,
  onChanged,
}: {
  /** Omit for a rep applicant whose space doesn't exist yet (uses `/me/kyc*`). */
  spaceId?: string;
  isLead: boolean;
  /** Called after a submission, so the page can refresh what depends on KYC. */
  onChanged?: () => void;
}) {
  const [status, setStatus] = useState<SpaceKycStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);

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
  if (!status) {
    return (
      <section className="rounded-3xl border border-cloud bg-canvas p-6 text-center">
        <p className="text-sm font-semibold text-ink">Couldn&apos;t load your verification status</p>
        <p className="mt-1 text-xs text-ink-soft">Refresh the page to try again.</p>
      </section>
    );
  }
  // Fully done only once withdrawals open: Bachs can still ask for documents
  // (`requirementsDue`) after collection is enabled.
  if (status.canWithdraw) {
    return (
      <section className="flex items-start gap-3 rounded-3xl border border-cloud bg-canvas p-5 sm:p-6">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand/10 text-brand">
          <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} />
        </span>
        <div>
          <h2 className="text-base font-semibold tracking-tight text-ink">You&apos;re verified</h2>
          <p className="mt-0.5 text-xs text-ink-soft">
            Your department can collect dues and withdraw to its payout account.
          </p>
        </div>
      </section>
    );
  }

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

      {/* While the form is open it's the only thing on the card — the steps come back after. */}
      {!formOpen && (
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
      )}

      {isLead && lockedUntil && (
        <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-xs text-rose-600">
          Too many failed attempts. You can try again after {formatTime(lockedUntil)}.
        </p>
      )}

      {isLead && canSubmit && !lockedUntil &&
        (formOpen ? (
          <KycForm spaceId={spaceId} onSubmitted={apply} onCancel={() => setFormOpen(false)} />
        ) : (
          <div className="mt-5 rounded-2xl border border-cloud bg-paper/50 p-4">
            <p className="text-xs font-semibold text-ink">
              {identity === "failed" ? "Try verification again" : "What you'll need"}
            </p>
            <ul className="mt-2 flex flex-col gap-1 text-[11px] leading-relaxed text-ink-soft">
              <li>• Your 11-digit NIN and date of birth</li>
              <li>• A clear photo or scan of your student ID card (JPEG, PNG, WebP or PDF, up to 5 MB)</li>
              <li>• About two minutes</li>
            </ul>
            <Button variant="brand" size="pill" className="mt-4 w-full" onClick={() => setFormOpen(true)}>
              <HugeiconsIcon icon={ShieldIcon} size={15} />
              {identity === "failed" ? "Try again" : "Start verification"}
            </Button>
          </div>
        ))}

      {!isLead && identity !== "done" && (
        <p className="mt-4 rounded-2xl bg-paper px-4 py-3 text-xs text-ink-soft">
          Only your department&apos;s lead rep can submit verification.
        </p>
      )}

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

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Drop zone for one document; once chosen, shows a preview card with the file's details. */
function FileField({
  label,
  hint,
  file,
  onChange,
  error,
  disabled,
}: {
  label: string;
  hint: string;
  file: File | null;
  onChange: (file: File | null) => void;
  error: string | null;
  disabled?: boolean;
}) {
  const inputId = useId();
  const [dragging, setDragging] = useState(false);
  const preview = useMemo(
    () => (file && file.type.startsWith("image/") ? URL.createObjectURL(file) : null),
    [file],
  );
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  return (
    <div>
      <p className="text-xs font-medium text-ink">{label}</p>
      <p className="mt-0.5 text-[11px] leading-relaxed text-ink-soft">{hint}</p>

      {file ? (
        <div
          className={cn(
            "mt-2 flex items-center gap-3 rounded-2xl border bg-canvas p-3",
            error ? "border-rose-300" : "border-cloud",
          )}
        >
          <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-cloud text-brand">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element -- local blob preview
              <img src={preview} alt="" className="h-full w-full object-cover" />
            ) : (
              <HugeiconsIcon icon={Pdf01Icon} size={20} />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-ink">{file.name}</p>
            <p className={cn("mt-0.5 text-[11px]", error ? "font-medium text-rose-600" : "text-ink-soft")}>
              {error ?? `${formatBytes(file.size)} · Ready to upload`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onChange(null)}
            disabled={disabled}
            aria-label="Remove file"
            className="grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-full text-ink-soft transition-colors hover:bg-cloud hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={14} />
          </button>
        </div>
      ) : (
        <label
          htmlFor={inputId}
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled) setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            if (!disabled) onChange(e.dataTransfer.files?.[0] ?? null);
          }}
          className={cn(
            "mt-2 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-6 text-center transition-colors",
            disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
            dragging ? "border-brand bg-brand/5" : "border-cloud bg-canvas hover:border-brand/40 hover:bg-brand/5",
          )}
        >
          <span className="grid h-11 w-11 place-items-center rounded-full bg-brand/10 text-brand">
            <HugeiconsIcon icon={CloudUploadIcon} size={20} />
          </span>
          <p className="mt-3 text-xs text-ink">
            <span className="font-semibold text-brand">Click to upload</span> or drag and drop
          </p>
          <p className="mt-1 text-[11px] text-ink-soft">JPEG, PNG, WebP or PDF · up to 5 MB</p>
        </label>
      )}

      <input
        id={inputId}
        type="file"
        accept={ACCEPTED_DOCUMENTS}
        disabled={disabled}
        onChange={(e) => {
          onChange(e.target.files?.[0] ?? null);
          // Clear so picking the same file again after removing it still fires.
          e.target.value = "";
        }}
        className="sr-only"
      />
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

function KycForm({
  spaceId,
  onSubmitted,
  onCancel,
}: {
  spaceId?: string;
  onSubmitted: (state: KycState) => void;
  onCancel: () => void;
}) {
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
          <DateOfBirthPicker
            value={dob}
            onChange={setDob}
            disabled={submitting}
            className="mt-1.5"
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
        hint="A clear photo or scan showing your name, photo and matric number."
        file={studentIdCard}
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
        I confirm this is my own NIN and consent to Duevy verifying it against the national
        identity database. Duevy doesn&apos;t store my NIN or date of birth; my student ID is
        kept privately for review.
      </label>

      <div className="flex flex-col gap-2 sm:flex-row-reverse">
        <Button variant="brand" size="pill" className="flex-1" disabled={!valid || submitting} onClick={submit}>
          {submitting ? "Submitting…" : "Submit for verification"}
        </Button>
        <Button variant="brand-outline" size="pill" disabled={submitting} onClick={onCancel}>
          Cancel
        </Button>
      </div>
      {!valid && !submitting && (
        <p className="-mt-2 text-center text-[11px] text-ink-soft">
          Fill in your NIN, date of birth, gender and student ID, and tick the consent box to continue.
        </p>
      )}
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
  const error = checkDocument(file);

  const upload = async () => {
    if (!file || error) return;
    setUploading(true);
    try {
      await onUpload(file);
      setFile(null);
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
        file={file}
        onChange={setFile}
        error={error}
        disabled={uploading}
      />
      <Button variant="brand-outline" size="pill" disabled={!file || !!error || uploading} onClick={upload}>
        <HugeiconsIcon icon={Upload01Icon} size={14} />
        {uploading ? "Uploading…" : action}
      </Button>
    </div>
  );
}
