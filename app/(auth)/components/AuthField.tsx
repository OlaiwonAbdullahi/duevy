"use client";

import { useState, type InputHTMLAttributes, type ReactNode } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ViewIcon,
  ViewOffSlashIcon,
  Mail01Icon,
  SquareLock01Icon,
  UserIcon,
  Building03Icon,
  UserMultipleIcon,
  StudentCardIcon,
} from "@hugeicons/core-free-icons";

// Icons are resolved by name inside this Client Component so that
// Server Component pages don't have to pass icon data as props.
const ICONS = {
  mail: Mail01Icon,
  lock: SquareLock01Icon,
  user: UserIcon,
  building: Building03Icon,
  users: UserMultipleIcon,
  matric: StudentCardIcon,
} as const;

export type AuthFieldIcon = keyof typeof ICONS;

type AuthFieldProps = {
  id: string;
  label: string;
  icon: AuthFieldIcon;
  hint?: string;
  labelAccessory?: ReactNode;
} & InputHTMLAttributes<HTMLInputElement>;

export default function AuthField({
  id,
  label,
  icon,
  hint,
  labelAccessory,
  type = "text",
  ...rest
}: AuthFieldProps) {
  const Icon = ICONS[icon];
  const isPassword = type === "password";
  const [visible, setVisible] = useState(false);
  const inputType = isPassword ? (visible ? "text" : "password") : type;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label
          htmlFor={id}
          className="text-[#1b2520] text-[13px] font-medium leading-none"
        >
          {label}
        </label>
        {labelAccessory}
      </div>

      <div className="group relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#7a847f] transition-colors duration-300 group-focus-within:text-[#0b6e4f]">
          <HugeiconsIcon icon={Icon} size={18} />
        </span>

        <input
          id={id}
          type={inputType}
          className={`w-full rounded-2xl border border-[#e6f2ec] bg-[#fbfaf7] text-[#1b2520] text-[15px] placeholder:text-[#7a847f]/60 pl-11 ${
            isPassword ? "pr-11" : "pr-4"
          } h-[52px] outline-none transition-colors duration-300 focus:border-[#0b6e4f] focus:ring-2 focus:ring-[#0b6e4f]/20 cursor-text`}
          {...rest}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 grid place-items-center w-8 h-8 rounded-full text-[#7a847f] hover:text-[#1b2520] hover:bg-[#e6f2ec] transition-colors duration-300 cursor-pointer"
          >
            {visible ? (
              <HugeiconsIcon icon={ViewOffSlashIcon} size={18} />
            ) : (
              <HugeiconsIcon icon={ViewIcon} size={18} />
            )}
          </button>
        )}
      </div>

      {hint && <p className="text-[#7a847f] text-[12px] leading-snug">{hint}</p>}
    </div>
  );
}
