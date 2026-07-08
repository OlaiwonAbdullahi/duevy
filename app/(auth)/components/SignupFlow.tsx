"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowRight01Icon,
  UserIcon,
  Building03Icon,
  SecurityCheckIcon,
} from "@hugeicons/core-free-icons";
import { GoogleIcon } from "../../components/icons";
import AuthField from "./AuthField";
import RoleSelect, { type SignupRole } from "./RoleSelect";
import SpaceDetailsStep, { type SpaceDetails } from "./SpaceDetailsStep";
import CoRepsStep from "./CoRepsStep";
import SpaceSettingsStep, { type SpaceSettings } from "./SpaceSettingsStep";

type StepId = "role" | "account" | "space" | "coReps" | "settings";

const STEPS: Record<SignupRole, StepId[]> = {
  student: ["role", "account"],
  rep: ["role", "account", "space", "coReps", "settings"],
};

const ROLE_META: Record<SignupRole, { label: string; icon: typeof UserIcon }> =
  {
    student: { label: "Student", icon: UserIcon },
    rep: { label: "Department rep", icon: Building03Icon },
  };

type Account = {
  name: string;
  matricNo: string;
  email: string;
  password: string;
};

const EMPTY_SPACE: SpaceDetails = {
  spaceName: "",
  short: "",
  kind: "department",
  school: "",
  faculty: "",
};

export default function SignupFlow() {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [role, setRole] = useState<SignupRole>("student");
  const [submitted, setSubmitted] = useState(false);

  const [account, setAccount] = useState<Account>({
    name: "",
    matricNo: "",
    email: "",
    password: "",
  });
  const [space, setSpace] = useState<SpaceDetails>(EMPTY_SPACE);
  const [coReps, setCoReps] = useState<string[]>([]);
  const [settings, setSettings] = useState<SpaceSettings>({
    theme: "emerald",
    requireApproval: false,
  });

  const steps = STEPS[role];
  const currentId = steps[stepIndex];
  const total = steps.length;

  const goBack = () => setStepIndex((index) => Math.max(0, index - 1));
  const goNext = () => setStepIndex((index) => index + 1);

  function handleAccountSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setAccount({
      name: String(data.get("name") ?? "").trim(),
      matricNo: String(data.get("matricNo") ?? "").trim(),
      email: String(data.get("email") ?? "").trim(),
      password: String(data.get("password") ?? ""),
    });
    // Students finish here; reps continue into department setup.
    if (role === "student") {
      router.push("/dashboard");
      return;
    }
    goNext();
  }

  // Rep signup complete — awaiting admin approval.
  if (submitted) {
    return <RepPending />;
  }

  const RoleIcon = ROLE_META[role].icon;
  const { title, subtitle } = headerFor(currentId, role, space.spaceName);

  return (
    <div className="flex flex-col">
      {/* Heading */}
      <div className="mb-8">
        <p className="text-[#0b6e4f] text-[12px] font-semibold uppercase tracking-[0.14em] mb-3">
          Step {stepIndex + 1} of {total}
        </p>
        <h1 className="text-[#1b2520] font-semibold tracking-tight text-3xl leading-tight mb-2">
          {title}
        </h1>
        <p className="text-[#7a847f] text-[15px] leading-relaxed">{subtitle}</p>
      </div>

      {currentId === "role" && (
        <div className="flex flex-col gap-6">
          <RoleSelect value={role} onChange={setRole} />
          <button
            type="button"
            onClick={goNext}
            className="group inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-[#0b6e4f] text-white text-[15px] font-semibold transition-colors duration-300 hover:bg-[#0f996d] cursor-pointer"
          >
            Continue
            <HugeiconsIcon
              icon={ArrowRight01Icon}
              size={16}
              className="transition-transform duration-500 group-hover:translate-x-1"
            />
          </button>
        </div>
      )}

      {currentId === "account" && (
        <div className="flex flex-col">
          {/* Chosen role summary — tap to change */}
          <button
            type="button"
            onClick={() => setStepIndex(0)}
            className="mb-6 flex items-center justify-between rounded-2xl border border-[#e6f2ec] bg-[#fbfaf7] px-4 py-3 text-left transition-colors duration-300 hover:border-[#0b6e4f]/40 cursor-pointer"
          >
            <span className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#e6f2ec] text-[#0b6e4f]">
                <HugeiconsIcon icon={RoleIcon} size={18} />
              </span>
              <span className="flex flex-col">
                <span className="text-[#7a847f] text-[12px] leading-none mb-1">
                  Signing up as
                </span>
                <span className="text-[#1b2520] text-[14px] font-semibold leading-none">
                  {ROLE_META[role].label}
                </span>
              </span>
            </span>
            <span className="text-[#0b6e4f] text-[13px] font-medium">Change</span>
          </button>

          {/* Social */}
          <button
            type="button"
            className="inline-flex h-13 w-full items-center justify-center gap-3 rounded-full border border-[#e6f2ec] bg-[#f4f2ec] text-[#1b2520] text-[15px] font-semibold transition-colors duration-300 hover:bg-[#e6f2ec] cursor-pointer"
          >
            <GoogleIcon size={18} />
            Sign up with Google
          </button>

          {/* Divider */}
          <div className="my-6 flex items-center gap-4">
            <span className="h-px flex-1 bg-[#e6f2ec]" />
            <span className="text-[#7a847f] text-[12px] font-medium uppercase tracking-[0.14em]">
              or
            </span>
            <span className="h-px flex-1 bg-[#e6f2ec]" />
          </div>

          {/* Form */}
          <form className="flex flex-col gap-5" onSubmit={handleAccountSubmit}>
            <AuthField
              id="name"
              label="Full name"
              icon="user"
              type="text"
              name="name"
              autoComplete="name"
              placeholder="e.g. Ada Okeke"
              defaultValue={account.name}
              required
            />

            <AuthField
              id="matricNo"
              label="Matric number"
              icon="matric"
              type="text"
              name="matricNo"
              autoComplete="off"
              placeholder="e.g. CSC/2021/045"
              defaultValue={account.matricNo}
              required
            />

            <AuthField
              id="email"
              label="Email address"
              icon="mail"
              type="email"
              name="email"
              autoComplete="email"
              placeholder="you@school.edu.ng"
              defaultValue={account.email}
              required
            />

            <AuthField
              id="password"
              label="Password"
              icon="lock"
              type="password"
              name="password"
              autoComplete="new-password"
              placeholder="Create a password"
              defaultValue={account.password}
              minLength={8}
              required
              hint="Use at least 8 characters."
            />

            <label className="flex items-start gap-3 text-[#7a847f] text-[13px] leading-relaxed cursor-pointer">
              <input
                type="checkbox"
                name="terms"
                required
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-[#e6f2ec] accent-[#0b6e4f] cursor-pointer"
              />
              <span>
                I agree to Duevy&apos;s{" "}
                <Link
                  href="/terms"
                  className="text-[#0b6e4f] font-medium hover:text-[#08583f] transition-colors duration-300 cursor-pointer"
                >
                  Terms
                </Link>{" "}
                and{" "}
                <Link
                  href="/privacy"
                  className="text-[#0b6e4f] font-medium hover:text-[#08583f] transition-colors duration-300 cursor-pointer"
                >
                  Privacy Policy
                </Link>
                .
              </span>
            </label>

            <button
              type="submit"
              className="group mt-1 inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-[#0b6e4f] text-white text-[15px] font-semibold transition-colors duration-300 hover:bg-[#0f996d] cursor-pointer"
            >
              {role === "rep" ? "Continue" : "Create account"}
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                size={16}
                className="transition-transform duration-500 group-hover:translate-x-1"
              />
            </button>
          </form>
        </div>
      )}

      {currentId === "space" && (
        <SpaceDetailsStep
          defaultValues={space}
          submitLabel="Create account"
          onBack={goBack}
          onSubmit={(data) => {
            setSpace(data);
            goNext();
          }}
        />
      )}

      {currentId === "coReps" && (
        <CoRepsStep
          spaceName={space.spaceName || "your department"}
          defaultValues={coReps}
          submitLabel="Continue"
          onBack={goBack}
          onSubmit={(emails) => {
            setCoReps(emails);
            goNext();
          }}
        />
      )}

      {currentId === "settings" && (
        <SpaceSettingsStep
          defaultValues={settings}
          submitLabel="Finish setup"
          onBack={goBack}
          onSubmit={(data) => {
            setSettings(data);
            setSubmitted(true);
          }}
        />
      )}

      {/* Footer — only on the entry steps */}
      {(currentId === "role" || currentId === "account") && (
        <p className="mt-8 text-center text-[#7a847f] text-[14px]">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-[#0b6e4f] font-semibold hover:text-[#08583f] transition-colors duration-300 cursor-pointer"
          >
            Sign in
          </Link>
        </p>
      )}
    </div>
  );
}

function headerFor(
  step: StepId,
  role: SignupRole,
  spaceName: string,
): { title: string; subtitle: string } {
  const space = spaceName || "your department";
  switch (step) {
    case "role":
      return {
        title: "Create your account",
        subtitle: "First, tell us how you'll use Duevy.",
      };
    case "account":
      return {
        title: "Your details",
        subtitle:
          role === "rep"
            ? "Tell us about you — you'll set up your department next."
            : "Setting up as a student — it's free to start.",
      };
    case "space":
      return {
        title: "Your department",
        subtitle: "Set up the space you'll collect dues for.",
      };
    case "coReps":
      return {
        title: "Invite your co-reps",
        subtitle: `Add anyone who helps run ${space}. You can skip this for now.`,
      };
    case "settings":
      return {
        title: "Finishing touches",
        subtitle: `A few defaults for ${space} — change them anytime.`,
      };
  }
}

/** Shown after a rep finishes onboarding — their account waits on admin approval. */
function RepPending() {
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
