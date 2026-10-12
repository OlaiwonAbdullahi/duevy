"use client";

import { REGEXP_ONLY_DIGITS } from "input-otp";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

/** The 4-digit withdrawal security code, one masked box per digit. */
export function SecurityCodeInput({
  id,
  value,
  onChange,
  invalid = false,
  autoFocus = false,
  disabled = false,
  className,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
  autoFocus?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <InputOTP
      id={id}
      maxLength={4}
      pattern={REGEXP_ONLY_DIGITS}
      inputMode="numeric"
      autoComplete="off"
      autoFocus={autoFocus}
      disabled={disabled}
      value={value}
      onChange={onChange}
      containerClassName={className}
    >
      <InputOTPGroup className="gap-2.5">
        {[0, 1, 2, 3].map((i) => (
          <InputOTPSlot
            key={i}
            index={i}
            masked
            aria-invalid={invalid || undefined}
            className="size-12 rounded-2xl! border border-cloud bg-canvas text-xl font-semibold text-ink data-[active=true]:border-brand data-[active=true]:ring-brand/20"
          />
        ))}
      </InputOTPGroup>
    </InputOTP>
  );
}
