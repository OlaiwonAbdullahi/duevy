import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { MailAtSign01Icon } from "@hugeicons/core-free-icons";

/** Shown right after signup — the account exists but still needs email confirmation. */
export function CheckEmailNotice({
  email,
  loginHref = "/login",
}: {
  email: string;
  loginHref?: string;
}) {
  return (
    <div className="flex flex-col text-center">
      <span className="mx-auto mb-6 grid h-14 w-14 place-items-center rounded-2xl bg-[#e6f2ec] text-[#0b6e4f]">
        <HugeiconsIcon icon={MailAtSign01Icon} size={26} />
      </span>

      <h1 className="text-[#1b2520] font-semibold tracking-tight text-3xl leading-tight mb-2">
        Check your email
      </h1>
      <p className="text-[#7a847f] text-[15px] leading-relaxed mb-8">
        We sent a verification link to{" "}
        <span className="font-semibold text-[#1b2520]">{email}</span>. Open it
        to confirm your address, then sign in to Duevy.
      </p>

      <div className="rounded-2xl border border-[#e6f2ec] bg-[#fbfaf7] p-5 text-left">
        <p className="text-[#1b2520] text-[13px] font-semibold mb-3">
          Don&apos;t see it?
        </p>
        <ul className="flex flex-col gap-3">
          {[
            "Check your spam or promotions folder.",
            "Make sure you typed your email correctly when signing up.",
            "You can sign in once your email is verified.",
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
          href={loginHref}
          className="text-[#0b6e4f] font-semibold hover:text-[#08583f] transition-colors duration-300 cursor-pointer"
        >
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
