import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import SignupFlow from "../components/SignupFlow";

export const metadata: Metadata = pageMetadata({
  title: "Create your account",
  description:
    "Join Duevy free. Students pay dues by bank transfer and keep every receipt; course reps collect dues and see who has paid.",
  path: "/signup",
});

export default function SignupPage() {
  return <SignupFlow />;
}
