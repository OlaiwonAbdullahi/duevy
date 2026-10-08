"use client";

import { useMemo, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowRight01Icon,
  Building03Icon,
  Mortarboard01Icon,
  PartyIcon,
  Tick02Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";
import universities from "nigerian-universities";
import AuthField from "./AuthField";
import SchoolCombobox from "./SchoolCombobox";

export type SpaceKind = "department" | "association" | "faculty" | "club";

export type SpaceDetails = {
  spaceName: string;
  short: string;
  kind: SpaceKind;
  school: string;
  faculty: string;
};

const KINDS: {
  value: SpaceKind;
  label: string;
  description: string;
  icon: typeof Building03Icon;
  /** False while the type is still being built — shown as "Coming soon". */
  available: boolean;
}[] = [
  {
    value: "department",
    label: "Department",
    description: "One course of study",
    icon: Building03Icon,
    available: true,
  },
  {
    value: "association",
    label: "Association",
    description: "Students' body or union",
    icon: UserGroupIcon,
    available: false,
  },
  {
    value: "faculty",
    label: "Faculty",
    description: "Several departments",
    icon: Mortarboard01Icon,
    available: false,
  },
  {
    value: "club",
    label: "Club",
    description: "Society or interest group",
    icon: PartyIcon,
    available: false,
  },
];

/**
 * Signup step 3 (rep only): the department the rep will collect dues for.
 * Fields map to the `POST /admin/spaces` creation body (§14.4).
 */
export default function SpaceDetailsStep({
  defaultValues,
  submitLabel,
  submitting = false,
  onBack,
  onSubmit,
}: {
  defaultValues: SpaceDetails;
  submitLabel: string;
  /** While true the fields and buttons are locked and the submit shows a spinner. */
  submitting?: boolean;
  onBack: () => void;
  onSubmit: (data: SpaceDetails) => void;
}) {
  // Only departments are open for now, so anything else falls back to it.
  const [kind, setKind] = useState<SpaceKind>(
    KINDS.find((k) => k.value === defaultValues.kind)?.available
      ? defaultValues.kind
      : "department",
  );
  const [school, setSchool] = useState(defaultValues.school);
  const [schoolError, setSchoolError] = useState(false);

  // Alphabetical, de-duplicated list of Nigerian universities.
  const schools = useMemo(
    () =>
      [...new Set(universities.map((uni) => uni.name))].sort((a, b) =>
        a.localeCompare(b),
      ),
    [],
  );

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    if (!school) {
      setSchoolError(true);
      return;
    }
    const data = new FormData(event.currentTarget);
    onSubmit({
      spaceName: String(data.get("spaceName") ?? "").trim(),
      short: String(data.get("short") ?? "").trim(),
      kind,
      school,
      faculty: String(data.get("faculty") ?? "").trim(),
    });
  }

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={handleSubmit}
      aria-busy={submitting}
    >
      {/* A disabled fieldset locks every control inside it, school picker included. */}
      <fieldset
        disabled={submitting}
        className="flex min-w-0 flex-col gap-5 transition-opacity duration-300 disabled:opacity-60"
      >
        <AuthField
          id="spaceName"
          name="spaceName"
          label="Department name"
          icon="building"
          type="text"
          placeholder="e.g. Computer Science Students' Association"
          defaultValue={defaultValues.spaceName}
          required
        />

        <AuthField
          id="short"
          name="short"
          label="Short code"
          icon="building"
          type="text"
          placeholder="e.g. CSSA"
          defaultValue={defaultValues.short}
          minLength={2}
          maxLength={6}
          required
          hint="2–6 letters — drives your department emblem."
        />

        {/* Native radios styled as cards, same pattern as RoleSelect. */}
        <fieldset className="flex flex-col gap-2">
          <legend className="text-[#1b2520] text-[13px] font-medium leading-none mb-2">
            Type
          </legend>
          <div className="grid grid-cols-2 gap-2">
            {KINDS.map(({ value, label, description, icon, available }) => (
              <label
                key={value}
                className="group relative flex cursor-pointer items-center gap-3 rounded-2xl border border-[#e6f2ec] bg-[#fbfaf7] p-3 transition-colors duration-300 hover:border-[#0b6e4f]/40 has-disabled:cursor-not-allowed has-disabled:hover:border-[#e6f2ec] has-checked:border-[#0b6e4f] has-checked:bg-[#0b6e4f]/4 has-focus-visible:ring-2 has-focus-visible:ring-[#0b6e4f]/20"
              >
                <input
                  type="radio"
                  name="kind"
                  value={value}
                  checked={kind === value}
                  onChange={() => setKind(value)}
                  disabled={!available}
                  className="sr-only"
                />

                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#e6f2ec] text-[#0b6e4f] transition-colors duration-300 group-has-checked:bg-[#0b6e4f] group-has-checked:text-white group-has-disabled:opacity-50">
                  <HugeiconsIcon icon={icon} size={18} />
                </span>

                <span className="flex min-w-0 flex-col items-start gap-1">
                  <span className="text-[#1b2520] text-[14px] font-semibold leading-none group-has-disabled:opacity-50">
                    {label}
                  </span>
                  <span className="text-[#7a847f] text-[11px] leading-snug group-has-disabled:opacity-50">
                    {description}
                  </span>
                  {!available && (
                    <span className="mt-0.5 rounded-full bg-[#0b6e4f]/8 px-2 py-1 text-[#0b6e4f] text-[9px] font-semibold uppercase leading-none tracking-wide">
                      Coming soon
                    </span>
                  )}
                </span>

                <span
                  aria-hidden
                  className="absolute right-2 top-2 grid h-4 w-4 place-items-center rounded-full bg-[#0b6e4f] text-white opacity-0 scale-75 transition-all duration-300 group-has-checked:opacity-100 group-has-checked:scale-100"
                >
                  <HugeiconsIcon icon={Tick02Icon} size={10} strokeWidth={3} />
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="school"
            className="text-[#1b2520] text-[13px] font-medium leading-none"
          >
            School / Institution
          </label>

          <SchoolCombobox
            id="school"
            value={school}
            options={schools}
            invalid={schoolError}
            onChange={(value) => {
              setSchool(value);
              setSchoolError(false);
            }}
          />

          {schoolError && (
            <p className="text-[#e11d48] text-[12px] leading-snug">
              Please select your school.
            </p>
          )}
        </div>

        <AuthField
          id="faculty"
          name="faculty"
          label="Faculty (optional)"
          icon="building"
          type="text"
          placeholder="e.g. Faculty of Science"
          defaultValue={defaultValues.faculty}
        />
      </fieldset>

      <div className="mt-1 flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={submitting}
          className="h-[52px] shrink-0 rounded-full border border-[#e6f2ec] px-6 text-[#1b2520] text-[15px] font-semibold transition-colors duration-300 hover:bg-[#f4f2ec] cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="group inline-flex h-[52px] flex-1 items-center justify-center gap-2 rounded-full bg-[#0b6e4f] text-white text-[15px] font-semibold transition-colors duration-300 hover:bg-[#0f996d] cursor-pointer disabled:cursor-not-allowed disabled:bg-[#0b6e4f]/60 disabled:hover:bg-[#0b6e4f]/60"
        >
          {submitting && (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          )}
          {submitLabel}
          {!submitting && (
            <HugeiconsIcon
              icon={ArrowRight01Icon}
              size={16}
              className="transition-transform duration-500 group-hover:translate-x-1"
            />
          )}
        </button>
      </div>
    </form>
  );
}
