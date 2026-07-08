"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowRight01Icon,
  Add01Icon,
  Cancel01Icon,
  Mail01Icon,
  UserGroup03Icon,
} from "@hugeicons/core-free-icons";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/**
 * Onboarding step (rep only): invite co-reps. Co-reps are granted the `co`
 * role once the account is approved (§5.6). Optional — repeatable later from
 * the dashboard.
 */
export default function CoRepsStep({
  spaceName,
  defaultValues,
  submitLabel,
  onBack,
  onSubmit,
}: {
  spaceName: string;
  defaultValues: string[];
  submitLabel: string;
  onBack: () => void;
  onSubmit: (emails: string[]) => void;
}) {
  const [emails, setEmails] = useState<string[]>(defaultValues);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  function addEmail() {
    const value = draft.trim().toLowerCase();
    if (!value) return;
    if (!EMAIL_RE.test(value)) {
      setError("Enter a valid email address.");
      return;
    }
    if (emails.includes(value)) {
      setDraft("");
      return;
    }
    setEmails((prev) => [...prev, value]);
    setDraft("");
    setError(null);
  }

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(emails);
      }}
    >
      <div className="flex items-start gap-3 rounded-2xl border border-[#e6f2ec] bg-[#fbfaf7] p-4">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#e6f2ec] text-[#0b6e4f]">
          <HugeiconsIcon icon={UserGroup03Icon} size={18} />
        </span>
        <p className="text-[#7a847f] text-[13px] leading-relaxed">
          Invite anyone who helps you run{" "}
          <span className="text-[#1b2520] font-medium">{spaceName}</span>. They
          join as co-reps once your account is approved.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="coRepEmail"
          className="text-[#1b2520] text-[13px] font-medium leading-none"
        >
          Co-rep email
        </label>

        <div className="flex items-center gap-2">
          <div className="group relative flex-1">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#7a847f] transition-colors duration-300 group-focus-within:text-[#0b6e4f]">
              <HugeiconsIcon icon={Mail01Icon} size={18} />
            </span>
            <input
              id="coRepEmail"
              type="email"
              value={draft}
              onChange={(event) => {
                setDraft(event.target.value);
                if (error) setError(null);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addEmail();
                }
              }}
              placeholder="corep@school.edu.ng"
              className="w-full rounded-2xl border border-[#e6f2ec] bg-[#fbfaf7] text-[#1b2520] text-[15px] placeholder:text-[#7a847f]/60 pl-11 pr-4 h-[52px] outline-none transition-colors duration-300 focus:border-[#0b6e4f] focus:ring-2 focus:ring-[#0b6e4f]/20 cursor-text"
            />
          </div>
          <button
            type="button"
            onClick={addEmail}
            aria-label="Add co-rep"
            className="grid h-[52px] w-[52px] shrink-0 place-items-center rounded-2xl border border-[#e6f2ec] bg-[#f4f2ec] text-[#0b6e4f] transition-colors duration-300 hover:bg-[#e6f2ec] cursor-pointer"
          >
            <HugeiconsIcon icon={Add01Icon} size={20} />
          </button>
        </div>

        {error ? (
          <p className="text-[#e11d48] text-[12px] leading-snug">{error}</p>
        ) : (
          <p className="text-[#7a847f] text-[12px] leading-snug">
            Optional — you can invite co-reps later from your dashboard.
          </p>
        )}
      </div>

      {emails.length > 0 && (
        <ul className="flex flex-col gap-2">
          {emails.map((email) => (
            <li
              key={email}
              className="flex items-center justify-between rounded-xl border border-[#e6f2ec] bg-white px-4 py-2.5"
            >
              <span className="text-[#1b2520] text-[14px] truncate">
                {email}
              </span>
              <button
                type="button"
                onClick={() =>
                  setEmails((prev) => prev.filter((item) => item !== email))
                }
                aria-label={`Remove ${email}`}
                className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-[#7a847f] transition-colors duration-300 hover:bg-[#e6f2ec] hover:text-[#1b2520] cursor-pointer"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-1 flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="h-[52px] shrink-0 rounded-full border border-[#e6f2ec] px-6 text-[#1b2520] text-[15px] font-semibold transition-colors duration-300 hover:bg-[#f4f2ec] cursor-pointer"
        >
          Back
        </button>
        <button
          type="submit"
          className="group inline-flex h-[52px] flex-1 items-center justify-center gap-2 rounded-full bg-[#0b6e4f] text-white text-[15px] font-semibold transition-colors duration-300 hover:bg-[#0f996d] cursor-pointer"
        >
          {emails.length > 0 ? submitLabel : "Skip for now"}
          <HugeiconsIcon
            icon={ArrowRight01Icon}
            size={16}
            className="transition-transform duration-500 group-hover:translate-x-1"
          />
        </button>
      </div>
    </form>
  );
}
