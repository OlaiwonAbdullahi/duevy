import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { SecurityCheckIcon } from "@hugeicons/core-free-icons";

/** Shown when a rep account is registered but awaiting admin approval (`REP_APPROVAL_PENDING`). */
export function RepPending() {
  return (
    <div className="flex flex-col text-center">
      <span className="mx-auto mb-6 grid h-14 w-14 place-items-center rounded-2xl bg-[#e6f2ec] text-[#0b6e4f]">
        <HugeiconsIcon icon={SecurityCheckIcon} size={26} />
      </span>

      <h1 className="text-[#1b2520] font-semibold tracking-tight text-3xl leading-tight mb-2">
        Application received
      </h1>
      <p className="text-[#7a847f] text-[15px] leading-relaxed mb-8">
        Your rep account and department are set up and now under review. We
        verify every department rep before payouts can move — you&apos;ll get an
        email once you&apos;re approved and can sign in to your dashboard.
      </p>

      <div className="rounded-2xl border border-[#e6f2ec] bg-[#fbfaf7] p-5 text-left">
        <p className="text-[#1b2520] text-[13px] font-semibold mb-3">
          What happens next
        </p>
        <ul className="flex flex-col gap-3">
          {[
            "We review your details, usually within 1–2 business days.",
            "You'll get an approval email at the address you signed up with.",
            "Sign in to publish dues and start collecting.",
          ].map((item) => (
            <li
              key={item}
              className="flex items-start gap-3 text-[#7a847f] text-[13px] leading-relaxed"
            >
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#0b6e4f]" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-8 text-center text-[#7a847f] text-[14px]">
        <Link
          href="/login"
          className="text-[#0b6e4f] font-semibold hover:text-[#08583f] transition-colors duration-300 cursor-pointer"
        >
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
