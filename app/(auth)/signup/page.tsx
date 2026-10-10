import type { Metadata } from "next";
import SignupFlow from "../components/SignupFlow";

export const metadata: Metadata = {
  title: "Create account",
  description:
    "Create a Duevy account to collect dues, run approved payouts, and track every kobo.",
};

export default function SignupPage() {
  return <SignupFlow />;
}
