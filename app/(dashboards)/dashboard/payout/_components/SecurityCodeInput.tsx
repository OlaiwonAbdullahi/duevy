"use client";

import { REGEXP_ONLY_DIGITS } from "input-otp";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

/** A digit code, one box per digit: the 4-digit security code (masked), or a 6-digit emailed approval code. */
export function SecurityCodeInput({
  id,
  value,
  onChange,
  invalid = false,
  autoFocus = false,
  disabled = false,
  length = 4,
  masked = true,
  className,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
  autoFocus?: boolean;
  disabled?: boolean;
  length?: number;
  masked?: boolean;
  className?: string;
}) {
  return (
    <InputOTP
      id={id}
      maxLength={length}
      pattern={REGEXP_ONLY_DIGITS}
      inputMode="numeric"
      autoComplete={masked ? "off" : "one-time-code"}
      autoFocus={autoFocus}
      disabled={disabled}
      value={value}
      onChange={onChange}
      containerClassName={className}
    >
      <InputOTPGroup className={length > 4 ? "gap-1.5 sm:gap-2" : "gap-2.5"}>
        {Array.from({ length }, (_, i) => (
          <InputOTPSlot
            key={i}
            index={i}
            masked={masked}
            aria-invalid={invalid || undefined}
            className={`${length > 4 ? "size-11" : "size-12"} rounded-2xl! border border-cloud bg-canvas text-xl font-semibold text-ink data-[active=true]:border-brand data-[active=true]:ring-brand/20`}
          />
        ))}
      </InputOTPGroup>
    </InputOTP>
  );
}
