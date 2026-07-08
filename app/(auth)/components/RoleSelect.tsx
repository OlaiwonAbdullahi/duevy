"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserIcon,
  Building03Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";

export type SignupRole = "student" | "rep";

type RoleOption = {
  value: SignupRole;
  label: string;
  description: string;
  icon: typeof UserIcon;
};

const OPTIONS: RoleOption[] = [
  {
    value: "student",
    label: "Student",
    description: "Join a department, pay dues, and vote.",
    icon: UserIcon,
  },
  {
    value: "rep",
    label: "Department rep",
    description: "Run a department — raise dues and request payouts.",
    icon: Building03Icon,
  },
];

/**
 * Controlled role picker for the signup flow. Native radios styled as cards so
 * the choice stays keyboard-accessible; the parent owns the selected value.
 */
export default function RoleSelect({
  value,
  onChange,
}: {
  value: SignupRole;
  onChange: (role: SignupRole) => void;
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-[#1b2520] text-[13px] font-medium leading-none mb-2">
        I&apos;m signing up as a
      </legend>

      <div className="grid grid-cols-2 gap-3">
        {OPTIONS.map(({ value: optionValue, label, description, icon }) => (
          <label
            key={optionValue}
            className="group relative flex cursor-pointer flex-col gap-2 rounded-2xl border border-[#e6f2ec] bg-[#fbfaf7] p-4 transition-colors duration-300 hover:border-[#0b6e4f]/40 has-checked:border-[#0b6e4f] has-checked:bg-[#0b6e4f]/4 has-focus-visible:ring-2 has-focus-visible:ring-[#0b6e4f]/20"
          >
            <input
              type="radio"
              name="role"
              value={optionValue}
              checked={value === optionValue}
              onChange={() => onChange(optionValue)}
              className="sr-only"
            />

            <span
              aria-hidden
              className="absolute right-3 top-3 grid h-5 w-5 place-items-center rounded-full border border-[#e6f2ec] bg-white text-white opacity-0 transition-all duration-300 group-has-checked:border-[#0b6e4f] group-has-checked:bg-[#0b6e4f] group-has-checked:opacity-100"
            >
              <HugeiconsIcon icon={Tick02Icon} size={12} strokeWidth={2.5} />
            </span>

            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#e6f2ec] text-[#0b6e4f] transition-colors duration-300 group-has-checked:bg-[#0b6e4f] group-has-checked:text-white">
              <HugeiconsIcon icon={icon} size={18} />
            </span>
            <span className="text-[#1b2520] text-[14px] font-semibold leading-none">
              {label}
            </span>
            <span className="text-[#7a847f] text-[12px] leading-snug">
              {description}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
