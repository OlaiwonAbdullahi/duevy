import { HugeiconsIcon } from "@hugeicons/react";
import { Alert02Icon } from "@hugeicons/core-free-icons";

/** Shown on the login screen when credentials are correct but the email isn't verified yet. */
export function EmailUnverifiedNotice({
  email,
  onBack,
}: {
  email: string;
  onBack: () => void;
}) {
  return (
    <div className="flex flex-col text-center">
      <span className="mx-auto mb-6 grid h-14 w-14 place-items-center rounded-2xl bg-amber-500/15 text-amber-700">
        <HugeiconsIcon icon={Alert02Icon} size={26} />
      </span>

      <h1 className="text-[#1b2520] font-semibold tracking-tight text-3xl leading-tight mb-2">
        Verify your email first
      </h1>
      <p className="text-[#7a847f] text-[15px] leading-relaxed mb-8">
        <span className="font-semibold text-[#1b2520]">{email}</span> hasn&apos;t
        been verified yet. We sent a link to that address when you signed up —
        open it to confirm your account before signing in.
      </p>

      <div className="rounded-2xl border border-[#e6f2ec] bg-[#fbfaf7] p-5 text-left">
        <p className="text-[#1b2520] text-[13px] font-semibold mb-3">
          Don&apos;t see it?
        </p>
        <ul className="flex flex-col gap-3">
          {[
            "Check your spam or promotions folder.",
            "Once verified, come back and sign in as usual.",
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

      <button
        type="button"
        onClick={onBack}
        className="mt-8 text-center text-[#0b6e4f] font-semibold text-[14px] hover:text-[#08583f] transition-colors duration-300 cursor-pointer"
      >
        Back to sign in
      </button>
    </div>
  );
}
