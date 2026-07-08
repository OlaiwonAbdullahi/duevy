"use client";

import { useMemo, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
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

const KINDS: { value: SpaceKind; label: string }[] = [
  { value: "department", label: "Department" },
  { value: "association", label: "Association" },
  { value: "faculty", label: "Faculty" },
  { value: "club", label: "Club" },
];

/**
 * Signup step 3 (rep only): the department the rep will collect dues for.
 * Fields map to the `POST /admin/spaces` creation body (§14.4).
 */
export default function SpaceDetailsStep({
  defaultValues,
  submitLabel,
  onBack,
  onSubmit,
}: {
  defaultValues: SpaceDetails;
  submitLabel: string;
  onBack: () => void;
  onSubmit: (data: SpaceDetails) => void;
}) {
  const [kind, setKind] = useState<SpaceKind>(defaultValues.kind);
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
    <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
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

      <div className="flex flex-col gap-2">
        <span className="text-[#1b2520] text-[13px] font-medium leading-none">
          Type
        </span>
        <div className="grid grid-cols-2 gap-2">
          {KINDS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setKind(option.value)}
              aria-pressed={kind === option.value}
              className={`h-11 rounded-xl border text-[14px] font-medium transition-colors duration-300 cursor-pointer ${
                kind === option.value
                  ? "border-[#0b6e4f] bg-[#0b6e4f]/4 text-[#0b6e4f]"
                  : "border-[#e6f2ec] bg-[#fbfaf7] text-[#7a847f] hover:border-[#0b6e4f]/40"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

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
          {submitLabel}
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
